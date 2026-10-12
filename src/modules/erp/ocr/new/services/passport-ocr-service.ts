import type { PassportOcrResult } from "../types/passport-ocr-types";
import { createWorker, PSM } from "tesseract.js";

const MRZ_WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";
const EXPECTED_COUNTRY = "BGD";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TARGET_WIDTH = 2000;
const MAX_PIXELS = 9_000_000;

// Bonus only (never rejects). Tighten after checking real BD passports.
const PASSPORT_NO_PATTERN = /^[A-Z]{1,2}\d{7,8}$/;

type Rotation = 0 | 90 | 180 | 270;
const ROTATIONS: Rotation[] = [0, 180, 90, 270];

type MrzChecks = {
  passportNo: boolean;
  dateOfBirth: boolean;
  expiryDate: boolean;
  personalNo: boolean; // internal only (not returned in the public result)
  composite: boolean;
};

type ReviewField = "name" | "passportNo" | "dateOfBirth" | "expiryDate";

/** block = both lines in one image, line1/line2 = a single MRZ line per image */
type Role = "block" | "line1" | "line2";

type Line1Candidate = { line: string; score: number; confidence: number };

type Line2Candidate = {
  line: string; // final (possibly repaired) 44 chars
  base: string; // normalized, before check-digit repair (used for voting)
  checks: MrzChecks;
  repaired: boolean;
  score: number;
  confidence: number;
  rawText: string;
};

type Variant = { label: string; role: Role; create: () => HTMLCanvasElement };

type Band = { top: number; bottom: number };
type MrzBands = { block: Band; line1: Band; line2: Band };

/* ───────────────────────── MRZ text helpers ───────────────────────── */

function cleanMrzLine(value: string): string {
  return value
    .toUpperCase()
    .replace(/[«‹]/g, "<")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9<]/g, "");
}

const TO_DIGIT: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  S: "5",
  G: "6",
  B: "8",
};

const TO_LETTER: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "5": "S",
  "6": "G",
  "8": "B",
};

const toDigit = (char: string) => TO_DIGIT[char] ?? char;
const toLetter = (char: string) => TO_LETTER[char] ?? char;

function mismatches(a: string, b: string): number {
  let count = Math.abs(a.length - b.length);
  const length = Math.min(a.length, b.length);

  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) count++;
  }

  return count;
}

function calculateCheckDigit(value: string): string {
  const weights = [7, 3, 1];
  let total = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    let number: number;

    if (char >= "0" && char <= "9") {
      number = Number(char);
    } else if (char >= "A" && char <= "Z") {
      number = char.charCodeAt(0) - 55;
    } else {
      number = 0; // MRZ filler <
    }

    total += number * weights[i % 3];
  }

  return String(total % 10);
}

function checkDigitMatches(value: string, digit: string): boolean {
  return /^\d$/.test(digit) && calculateCheckDigit(value) === digit;
}

/**
 * Position-wise weighted vote across several equal-length readings.
 * A character misread in one OCR pass is outvoted by the passes that got it right.
 */
function voteLines(entries: Array<{ line: string; weight: number }>): string {
  const length = entries[0].line.length;
  let result = "";

  for (let i = 0; i < length; i++) {
    const tally = new Map<string, number>();

    for (const { line, weight } of entries) {
      const char = line[i] ?? "<";
      tally.set(char, (tally.get(char) ?? 0) + weight);
    }

    let winner = "<";
    let top = -1;

    tally.forEach((weight, char) => {
      if (weight > top) {
        top = weight;
        winner = char;
      }
    });

    result += winner;
  }

  return result;
}

/* ───────────────────────── Dates ───────────────────────── */

function validCalendarDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toIsoDate(value: string, kind: "birth" | "expiry"): string {
  if (!/^\d{6}$/.test(value)) return "";

  const yy = Number(value.slice(0, 2));
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);
  const currentYear = new Date().getFullYear();

  // Expiry is always 20xx. Birth years in the future roll back a century.
  let year = 2000 + yy;
  if (kind === "birth" && year > currentYear) year -= 100;

  const result = `${year}-${month}-${day}`;
  return validCalendarDate(result) ? result : "";
}

function plausibleBirth(iso: string): boolean {
  if (!iso) return false;
  const age = new Date().getFullYear() - Number(iso.slice(0, 4));
  return age >= 0 && age <= 100;
}

function plausibleExpiry(iso: string): boolean {
  if (!iso) return false;
  const year = Number(iso.slice(0, 4));
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 20 && year <= currentYear + 12;
}

/* ───────────────────────── Line 2 (numbers) ───────────────────────── */

/** Personal-number field (pos 28-41) + its check digit (pos 42). */
function personalCheckMatches(line: string): boolean {
  const field = line.slice(28, 42);
  const digit = line[42];

  // ICAO: an empty personal number has "<" or "0" as its check digit.
  if (/^<+$/.test(field)) return digit === "<" || digit === "0";

  return checkDigitMatches(field, digit);
}

function evaluate(line: string): MrzChecks {
  const composite =
    line.slice(0, 10) + line.slice(13, 20) + line.slice(21, 43);

  return {
    passportNo: checkDigitMatches(line.slice(0, 9), line[9]),
    dateOfBirth: checkDigitMatches(line.slice(13, 19), line[19]),
    expiryDate: checkDigitMatches(line.slice(21, 27), line[27]),
    personalNo: personalCheckMatches(line),
    composite: checkDigitMatches(composite, line[43]),
  };
}

const DIGIT_POSITIONS = [
  9, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 43,
];

/** Make every position the right type (digit / letter) for a TD3 line 2. */
function normalizeLine2Chars(line: string): string {
  const chars = line.split("");

  for (const i of DIGIT_POSITIONS) chars[i] = toDigit(chars[i]);
  if (chars[42] !== "<") chars[42] = toDigit(chars[42]);

  for (const i of [10, 11, 12]) chars[i] = toLetter(chars[i]);

  // Bangladesh passports: tolerate one wrong character in "BGD".
  if (mismatches(chars.slice(10, 13).join(""), EXPECTED_COUNTRY) <= 1) {
    chars[10] = "B";
    chars[11] = "G";
    chars[12] = "D";
  }

  if (!"MF<".includes(chars[20])) chars[20] = "<";

  return chars.join("");
}

/**
 * Anchored reconstruction of line 2.
 *
 * Line 2 = [28 chars: passport/dates] + [14 chars: personal number + "<" filler]
 *          + [personal check digit] + [composite check digit].
 *
 * OCR often drops, adds or misreads "<" characters in the long filler run, so a
 * line is rarely exactly 44 chars. Instead of guessing where to insert "<", we
 * anchor on the first 28 and last 2 characters, and rebuild the personal-number
 * field as "N digits + (14-N) fillers" for every plausible N. The check digits
 * then decide which N is right (natural N is tried first).
 *
 * Bangladesh personal number = numeric NID, so the field is digits-then-filler.
 */
function line2Options(raw: string): string[] {
  if (raw.length < 34 || raw.length > 52) return [];

  const head = raw.slice(0, 28);
  const tail = raw.slice(-2);
  const region = raw.slice(28, raw.length - 2);
  const maxK = Math.min(14, region.length);

  let natural = 0;
  while (natural < maxK && /\d/.test(region[natural])) natural++;

  const order: number[] = [];
  for (let k = 0; k <= maxK; k++) order.push(k);
  order.sort((a, b) => Math.abs(a - natural) - Math.abs(b - natural) || a - b);

  const options: string[] = [];
  if (raw.length === 44) options.push(raw);

  for (const k of order) {
    let digits = "";
    let valid = true;

    for (let i = 0; i < k; i++) {
      const d = toDigit(region[i]);
      if (!/^\d$/.test(d)) {
        valid = false;
        break;
      }
      digits += d;
    }

    if (valid) options.push(head + digits.padEnd(14, "<") + tail);
  }

  return options;
}

/* ───── Check-digit guided repair ───── */

const DIGIT_CONFUSIONS: Record<string, string> = {
  "0": "86",
  "1": "7",
  "2": "7",
  "3": "8",
  "4": "9",
  "5": "6",
  "6": "058",
  "7": "12",
  "8": "3069",
  "9": "48",
};

const ALNUM_CONFUSIONS: Record<string, string> = {
  O: "0QD",
  "0": "OD8",
  Q: "0O",
  D: "0O",
  I: "1L",
  L: "1I",
  "1": "IL7",
  B: "8",
  "8": "B3",
  S: "5",
  "5": "S6",
  Z: "2",
  "2": "Z7",
  G: "6",
  "6": "G5",
  U: "V",
  V: "U",
  H: "N",
  N: "H",
  "3": "8",
  "7": "1",
};

type FieldSpec = {
  key: "passportNo" | "dateOfBirth" | "expiryDate" | "personalNo";
  start: number;
  end: number;
  check: number;
  alphabet: "alnum" | "digit";
  plausible: (value: string) => boolean;
};

const FIELD_SPECS: FieldSpec[] = [
  {
    key: "passportNo",
    start: 0,
    end: 9,
    check: 9,
    alphabet: "alnum",
    plausible: (value) =>
      /\d/.test(value) && value.replace(/</g, "").length >= 6,
  },
  {
    key: "dateOfBirth",
    start: 13,
    end: 19,
    check: 19,
    alphabet: "digit",
    plausible: (value) => plausibleBirth(toIsoDate(value, "birth")),
  },
  {
    key: "expiryDate",
    start: 21,
    end: 27,
    check: 27,
    alphabet: "digit",
    plausible: (value) => plausibleExpiry(toIsoDate(value, "expiry")),
  },
  {
    key: "personalNo",
    start: 28,
    end: 42,
    check: 42,
    alphabet: "digit",
    plausible: (value) => /^\d*<*$/.test(value),
  },
];

type Fix = { index: number; char: string };

function alternatives(char: string, alphabet: "alnum" | "digit"): string[] {
  const table = alphabet === "digit" ? DIGIT_CONFUSIONS : ALNUM_CONFUSIONS;
  return (table[char] ?? "").split("");
}

function fieldFixes(line: string, spec: FieldSpec): Fix[] {
  const data = line.slice(spec.start, spec.end);
  const printed = line[spec.check];
  const fixes: Fix[] = [];

  // (a) data is right, the check digit was misread
  if (spec.plausible(data)) {
    fixes.push({ index: spec.check, char: calculateCheckDigit(data) });
  }

  // (b) exactly one data character was misread
  for (let i = 0; i < data.length; i++) {
    for (const alt of alternatives(data[i], spec.alphabet)) {
      const next = data.slice(0, i) + alt + data.slice(i + 1);

      if (calculateCheckDigit(next) === printed && spec.plausible(next)) {
        fixes.push({ index: spec.start + i, char: alt });
      }
    }
  }

  return fixes;
}

function applyFixes(line: string, fixes: Fix[]): string {
  const chars = line.split("");
  for (const fix of fixes) chars[fix.index] = fix.char;
  return chars.join("");
}

/**
 * Repairs are accepted ONLY when the independent composite check digit
 * confirms them. A guess that cannot be validated is never applied, so a wrong
 * value can't be silently shown as "verified".
 */
function repairLine2(line: string): { line: string; repaired: boolean } {
  const checks = evaluate(line);
  const failing = FIELD_SPECS.filter((spec) => !checks[spec.key]);

  if (failing.length === 0) return { line, repaired: false };

  const repairable = failing
    .map((spec) => ({ spec, fixes: fieldFixes(line, spec) }))
    .filter((item) => item.fixes.length > 0);

  if (repairable.length === 0) return { line, repaired: false };

  const total = repairable.reduce((n, item) => n * item.fixes.length, 1);
  if (total > 3000) return { line, repaired: false };

  let combos: Fix[][] = [[]];
  for (const { fixes } of repairable) {
    const next: Fix[][] = [];
    for (const combo of combos) {
      for (const fix of fixes) next.push([...combo, fix]);
    }
    combos = next;
  }

  const passing = combos
    .map((combo) => applyFixes(line, combo))
    .filter((candidate) => evaluate(candidate).composite);

  if (passing.length === 1) return { line: passing[0], repaired: true };

  return { line, repaired: false }; // none, or ambiguous
}

function keyChecks(candidate: Line2Candidate): number {
  const { passportNo, dateOfBirth, expiryDate } = candidate.checks;
  return [passportNo, dateOfBirth, expiryDate].filter(Boolean).length;
}

/** All three key fields AND the composite digit agree = exact read. */
function isVerified(candidate: Line2Candidate): boolean {
  return keyChecks(candidate) === 3 && candidate.checks.composite;
}

function scoreLine2(
  line: string,
  checks: MrzChecks,
  repaired: boolean,
  confidence: number,
): number {
  let score = 0;

  if (checks.passportNo) score += 5;
  if (checks.dateOfBirth) score += 4;
  if (checks.expiryDate) score += 4;
  if (checks.personalNo) score += 2;
  if (checks.composite) score += 3;

  if (line.slice(10, 13) === EXPECTED_COUNTRY) score += 2;
  if (plausibleBirth(toIsoDate(line.slice(13, 19), "birth"))) score += 1;
  if (plausibleExpiry(toIsoDate(line.slice(21, 27), "expiry"))) score += 1;
  if (PASSPORT_NO_PATTERN.test(line.slice(0, 9).replace(/</g, ""))) score += 1;
  if (/^\d+<*$/.test(line.slice(28, 42))) score += 1;
  if (repaired) score -= 1;

  return score + confidence / 100;
}

function bestLine2(
  rawLine: string,
  confidence: number,
  rawText: string,
): Line2Candidate | null {
  let best: Line2Candidate | null = null;

  for (const option of line2Options(rawLine)) {
    const base = normalizeLine2Chars(option);
    const fixed = repairLine2(base);
    const checks = evaluate(fixed.line);
    const score = scoreLine2(fixed.line, checks, fixed.repaired, confidence);

    if (!best || score > best.score) {
      best = {
        line: fixed.line,
        base,
        checks,
        repaired: fixed.repaired,
        score,
        confidence,
        rawText,
      };
    }
  }

  return best;
}

/** Vote across several OCR passes, then run the same checksum repair. */
function consensusLine2(pool: Line2Candidate[]): Line2Candidate | null {
  const usable = pool
    .filter((c) => c.base.length === 44 && keyChecks(c) >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (usable.length < 3) return null;

  const merged = voteLines(
    usable.map((c) => ({
      line: c.base,
      weight: 1 + keyChecks(c) * 2 + c.confidence / 100,
    })),
  );

  const fixed = repairLine2(merged);
  const checks = evaluate(fixed.line);
  const confidence =
    usable.reduce((sum, c) => sum + c.confidence, 0) / usable.length;

  return {
    line: fixed.line,
    base: merged,
    checks,
    repaired: fixed.repaired,
    confidence,
    rawText: usable[0].rawText,
    score: scoreLine2(fixed.line, checks, fixed.repaired, confidence),
  };
}

function selectBestLine2(pool: Line2Candidate[]): Line2Candidate | null {
  let best: Line2Candidate | null = null;

  for (const candidate of pool) {
    if (!best || candidate.score > best.score) best = candidate;
  }

  const merged = consensusLine2(pool);
  if (merged && (!best || merged.score > best.score)) best = merged;

  return best;
}

/* ───────────────────────── Line 1 (name) ───────────────────────── */

function fixLine1(raw: string): string {
  const chars = raw
    .padEnd(44, "<")
    .slice(0, 44)
    .split("")
    .map((char, index) => (index < 5 ? char : toLetter(char)));

  if (mismatches(chars.slice(0, 5).join(""), `P<${EXPECTED_COUNTRY}`) <= 2) {
    "P<BGD".split("").forEach((char, index) => {
      chars[index] = char;
    });
  }

  return chars.join("");
}

function scoreLine1(raw: string): number {
  let score = 0;

  if (raw.startsWith(`P<${EXPECTED_COUNTRY}`)) score += 3;
  else if (mismatches(raw.slice(0, 5), `P<${EXPECTED_COUNTRY}`) <= 2) score += 1;

  if (raw.includes("<<")) score += 2;
  if (Math.abs(raw.length - 44) <= 1) score += 2;
  if (!/\d/.test(raw)) score += 1;
  if (raw.endsWith("<<")) score += 1;

  return score;
}

function parseName(line1: string): { name: string; suspicious: boolean } {
  let body = line1.slice(5).replace(/<+$/, "");
  let junkRemoved = false;

  // OCR often reads the "<<<<" filler as KKKK / CCCC / LLLL / EEEE (or a mix).
  const junk = body.match(/[KCLESXZ<]{5,}$/);

  if (junk) {
    if (/[^<]/.test(junk[0])) junkRemoved = true;
    body = body.slice(0, junk.index ?? body.length).replace(/<+$/, "");
  }

  const [surnameRaw = "", ...givenRaw] = body.split("<<");

  const clean = (value: string) =>
    value.replace(/</g, " ").replace(/\s+/g, " ").trim();

  const surname = clean(surnameRaw);
  const given = clean(givenRaw.join(" "));
  const name = [given, surname].filter(Boolean).join(" ").trim();

  // The name has no check digit, so flag patterns that look like misread fillers.
  const suspicious =
    name.length < 3 || /[KCXZ]{2,}/.test(name) || junkRemoved;

  return { name, suspicious };
}

/**
 * The name has no check digit, so it can't be proven correct. The best we can
 * do: vote across all line-1 readings and require at least 2 independent
 * readings to agree before we stop calling it "suspicious".
 */
function resolveName(pool: Line1Candidate[]): {
  name: string;
  suspicious: boolean;
} {
  if (pool.length === 0) return { name: "", suspicious: true };

  const lines = pool.map((c) => ({
    line: c.line,
    weight: 1 + c.score + c.confidence / 100,
  }));

  const merged = parseName(voteLines(lines));
  const confirmations = pool.filter(
    (c) => parseName(c.line).name === merged.name,
  ).length;

  return {
    name: merged.name,
    suspicious: merged.suspicious || confirmations < 2,
  };
}

/* ───────────────────────── OCR text → candidates ───────────────────────── */

function collectFromText(
  text: string,
  confidence: number,
  role: Role,
): { line1: Line1Candidate[]; line2: Line2Candidate[] } {
  const rawLines = text
    .split(/\r?\n/)
    .map(cleanMrzLine)
    .filter((line) => line.length >= 28);

  const lines: string[] = [];

  for (const line of rawLines) {
    // OCR sometimes glues both MRZ lines together.
    if (line.length >= 84 && line.length <= 92) {
      lines.push(line.slice(0, 44), line.slice(-44));
    } else {
      lines.push(line);
    }
  }

  const line1: Line1Candidate[] = [];
  const line2: Line2Candidate[] = [];

  for (const line of lines) {
    const looksLikeLine1 =
      line.length >= 30 &&
      line.length <= 48 &&
      (line.startsWith("P") ||
        (role === "line1" &&
          mismatches(line.slice(0, 5), `P<${EXPECTED_COUNTRY}`) <= 2));

    if (role !== "line2" && looksLikeLine1) {
      const score = scoreLine1(line);
      // Ignore normal page text such as "PERSONALDATAAND..." that is not an MRZ.
      if (score >= 4) {
        line1.push({ line: fixLine1(line), score, confidence });
      }
    }

    if (role === "line1") continue;
    if (line.startsWith("P<")) continue;

    const candidate = bestLine2(line, confidence, text);
    if (candidate) line2.push(candidate);
  }

  return { line1, line2 };
}

/* ───────────────────────── Image preprocessing ───────────────────────── */

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

/** Rotate + resize to a fixed working width (safe for iOS canvas limits). */
function renderPage(bitmap: ImageBitmap, rotation: Rotation): HTMLCanvasElement {
  const swap = rotation === 90 || rotation === 270;
  const srcWidth = swap ? bitmap.height : bitmap.width;
  const srcHeight = swap ? bitmap.width : bitmap.height;

  let scale = Math.min(3, TARGET_WIDTH / srcWidth);
  const pixels = srcWidth * srcHeight * scale * scale;
  if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(srcWidth * scale));
  canvas.height = Math.max(1, Math.round(srcHeight * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Image preprocessing চালু করা যায়নি।");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(
    bitmap,
    -(bitmap.width * scale) / 2,
    -(bitmap.height * scale) / 2,
    bitmap.width * scale,
    bitmap.height * scale,
  );

  return canvas;
}

/** Grayscale (computed manually, Safari ignores ctx.filter) + contrast stretch. */
function toStretchedGray(image: ImageData): Uint8ClampedArray {
  const { data, width, height } = image;
  const gray = new Uint8ClampedArray(width * height);
  const histogram = new Uint32Array(256);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const value = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    gray[p] = value;
    histogram[value]++;
  }

  const total = gray.length;
  let low = 0;
  let high = 255;
  let accumulated = 0;

  for (let v = 0; v < 256; v++) {
    accumulated += histogram[v];
    if (accumulated >= total * 0.01) {
      low = v;
      break;
    }
  }

  accumulated = 0;

  for (let v = 255; v >= 0; v--) {
    accumulated += histogram[v];
    if (accumulated >= total * 0.01) {
      high = v;
      break;
    }
  }

  if (high - low < 30) return gray;

  const factor = 255 / (high - low);
  for (let p = 0; p < gray.length; p++) {
    gray[p] = (gray[p] - low) * factor; // Uint8ClampedArray clamps for us
  }

  return gray;
}

/** Bradley adaptive threshold (integral image). Text = 0, background = 255. */
function adaptiveBinarize(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  windowSize: number,
  sensitivity: number,
): Uint8ClampedArray {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowSum = 0;

    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * stride + (x + 1)] =
        integral[y * stride + (x + 1)] + rowSum;
    }
  }

  const half = Math.max(2, Math.floor(windowSize / 2));
  const output = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - half);
    const y2 = Math.min(height - 1, y + half);

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(width - 1, x + half);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const sum =
        integral[(y2 + 1) * stride + (x2 + 1)] -
        integral[y1 * stride + (x2 + 1)] -
        integral[(y2 + 1) * stride + x1] +
        integral[y1 * stride + x1];

      output[y * width + x] =
        gray[y * width + x] * count < sum * (1 - sensitivity) ? 0 : 255;
    }
  }

  return output;
}

/**
 * Find the two bottom-most, similar-height text bands (the MRZ lines).
 * Returns the whole block AND each line separately, so every line can be OCR'd
 * on its own (single-line mode is much more accurate than block mode).
 */
function findMrzBand(
  binary: Uint8ClampedArray,
  width: number,
  height: number,
): MrzBands | null {
  const ink = new Float32Array(height);

  for (let y = 0; y < height; y++) {
    let count = 0;
    const offset = y * width;
    for (let x = 0; x < width; x++) {
      if (binary[offset + x] === 0) count++;
    }
    ink[y] = count / width;
  }

  const smooth = new Float32Array(height);

  for (let y = 0; y < height; y++) {
    let sum = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const yy = y + k;
      if (yy >= 0 && yy < height) {
        sum += ink[yy];
        n++;
      }
    }
    smooth[y] = sum / n;
  }

  const active = Array.from(smooth)
    .filter((value) => value > 0.02)
    .sort((a, b) => a - b);

  if (active.length < 30) return null;

  const p90 = active[Math.floor(active.length * 0.9)];
  const threshold = Math.max(0.03, p90 * 0.3);

  const bands: Band[] = [];
  let start = -1;
  let gap = 0;

  for (let y = 0; y < height; y++) {
    if (smooth[y] > threshold) {
      if (start === -1) start = y;
      gap = 0;
    } else if (start !== -1) {
      gap++;
      if (gap > 4) {
        bands.push({ top: start, bottom: y - gap });
        start = -1;
        gap = 0;
      }
    }
  }

  if (start !== -1) bands.push({ top: start, bottom: height - 1 });

  const lines = bands.filter((band) => {
    const h = band.bottom - band.top + 1;
    return h >= 18 && h <= 160;
  });

  for (let i = lines.length - 1; i >= 1; i--) {
    const upper = lines[i - 1];
    const lower = lines[i];
    const upperHeight = upper.bottom - upper.top + 1;
    const lowerHeight = lower.bottom - lower.top + 1;
    const ratio = upperHeight / lowerHeight;
    const distance = lower.top - upper.bottom;

    if (
      ratio >= 0.6 &&
      ratio <= 1.7 &&
      distance > 0 &&
      distance <= Math.max(upperHeight, lowerHeight) * 1.5
    ) {
      const tallest = Math.max(upperHeight, lowerHeight);
      const pad = Math.round(tallest * 0.6);
      const linePad = Math.round(tallest * 0.35);
      const middle = Math.floor((upper.bottom + lower.top) / 2);

      return {
        block: {
          top: Math.max(0, upper.top - pad),
          bottom: Math.min(height - 1, lower.bottom + pad),
        },
        line1: {
          top: Math.max(0, upper.top - linePad),
          bottom: Math.min(middle, upper.bottom + linePad),
        },
        line2: {
          top: Math.max(middle + 1, lower.top - linePad),
          bottom: Math.min(height - 1, lower.bottom + linePad),
        },
      };
    }
  }

  return null;
}

function canvasFromPixels(
  pixels: Uint8ClampedArray,
  width: number,
  top: number,
  bottom: number,
): HTMLCanvasElement {
  const margin = 24;
  const height = bottom - top + 1;

  const canvas = document.createElement("canvas");
  canvas.width = width + margin * 2;
  canvas.height = height + margin * 2;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image preprocessing চালু করা যায়নি।");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const image = context.createImageData(width, height);
  const offset = top * width;

  for (let i = 0; i < width * height; i++) {
    const value = pixels[offset + i];
    const o = i * 4;
    image.data[o] = value;
    image.data[o + 1] = value;
    image.data[o + 2] = value;
    image.data[o + 3] = 255;
  }

  context.putImageData(image, margin, margin);

  return canvas;
}

function buildVariants(page: HTMLCanvasElement): Variant[] {
  const context = page.getContext("2d", { willReadFrequently: true });
  if (!context) return [];

  const width = page.width;
  const cropTop = Math.floor(page.height * 0.45);
  const cropHeight = page.height - cropTop;

  if (cropHeight < 40) return [];

  const image = context.getImageData(0, cropTop, width, cropHeight);
  const gray = toStretchedGray(image);
  const binary = adaptiveBinarize(
    gray,
    width,
    cropHeight,
    Math.round(width / 16),
    0.15,
  );
  // Second threshold: different window/sensitivity recovers thin or faint strokes.
  const binaryAlt = adaptiveBinarize(
    gray,
    width,
    cropHeight,
    Math.round(width / 30),
    0.1,
  );

  const bands = findMrzBand(binary, width, cropHeight);
  const variants: Variant[] = [];

  const add = (
    label: string,
    role: Role,
    source: Uint8ClampedArray,
    band: Band,
  ) => {
    variants.push({
      label,
      role,
      create: () => canvasFromPixels(source, width, band.top, band.bottom),
    });
  };

  if (bands) {
    // Numbers first (they have check digits), then the name line.
    add("line2-binary", "line2", binary, bands.line2);
    add("line2-gray", "line2", gray, bands.line2);
    add("line1-binary", "line1", binary, bands.line1);
    add("line1-gray", "line1", gray, bands.line1);
    add("band-binary", "block", binary, bands.block);
    add("band-gray", "block", gray, bands.block);
    add("line2-binary-alt", "line2", binaryAlt, bands.line2);
    add("line1-binary-alt", "line1", binaryAlt, bands.line1);
  }

  add("crop-binary", "block", binary, { top: 0, bottom: cropHeight - 1 });
  add("crop-gray", "block", gray, { top: 0, bottom: cropHeight - 1 });

  return variants;
}

/* ───────────────────────── Result ───────────────────────── */

function buildResult(
  name: { name: string; suspicious: boolean },
  line2: Line2Candidate,
): PassportOcrResult {
  const line = line2.line;
  const passportNo = line.slice(0, 9).replace(/</g, "").trim();

  if (!passportNo) {
    throw new Error(
      "Passport number পাওয়া যায়নি। আরও পরিষ্কার ছবি দিয়ে আবার চেষ্টা করো।",
    );
  }

  const sexCode = line[20];
  const reviewFields: ReviewField[] = [];

  if (!line2.checks.passportNo) reviewFields.push("passportNo");
  if (!line2.checks.dateOfBirth) reviewFields.push("dateOfBirth");
  if (!line2.checks.expiryDate) reviewFields.push("expiryDate");
  if (name.suspicious) reviewFields.push("name");

  return {
    name: name.name,
    passportNo,
    nationality: line.slice(10, 13).replace(/</g, "").trim(),
    dateOfBirth: toIsoDate(line.slice(13, 19), "birth"),
    sex: sexCode === "M" ? "Male" : sexCode === "F" ? "Female" : "",
    expiryDate: toIsoDate(line.slice(21, 27), "expiry"),
    confidence: Math.round(line2.confidence),
    rawText: line2.rawText,
    verified: isVerified(line2),
    checks: {
      passportNo: line2.checks.passportNo,
      dateOfBirth: line2.checks.dateOfBirth,
      expiryDate: line2.checks.expiryDate,
      composite: line2.checks.composite,
    },
    reviewFields,
  };
}

/* ───────────────────────── Public API ───────────────────────── */

export async function readPassport(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<PassportOcrResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "এখন Passport OCR-এর জন্য JPG, PNG বা image file ব্যবহার করো। PDF support এখনো নেই।",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Passport image 10 MB-এর কম রাখো।");
  }

  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  let bitmap: ImageBitmap | undefined;

  try {
    onProgress?.(3);

    bitmap = await createImageBitmap(file);

    // Dictionaries only hurt MRZ text (they "correct" names into English words).
    // These are init-only parameters, so they go in the 4th createWorker arg.
    worker = await createWorker("eng", 1, {}, {
      load_system_dawg: "0",
      load_freq_dawg: "0",
    });

    await worker.setParameters({
      tessedit_char_whitelist: MRZ_WHITELIST,
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      user_defined_dpi: "300",
    });

    let mode: "block" | "line" = "block";

    onProgress?.(8);

    const line1Pool: Line1Candidate[] = [];
    const line2Pool: Line2Candidate[] = [];
    let passes = 0;

    for (const rotation of ROTATIONS) {
      const page = renderPage(bitmap, rotation);
      const variants = buildVariants(page);

      for (const variant of variants) {
        const canvas = variant.create();
        const wanted = variant.role === "block" ? "block" : "line";

        let text = "";
        let confidence = 0;

        try {
          if (wanted !== mode) {
            await worker.setParameters({
              tessedit_pageseg_mode:
                wanted === "block" ? PSM.SINGLE_BLOCK : PSM.SINGLE_LINE,
            });
            mode = wanted;
          }

          const { data } = await worker.recognize(canvas);
          text = data.text;
          confidence = data.confidence;
        } finally {
          releaseCanvas(canvas);
        }

        passes++;
        onProgress?.(Math.min(95, 8 + passes * 8));

        const found = collectFromText(text, confidence, variant.role);

        line1Pool.push(...found.line1);
        line2Pool.push(...found.line2);

        // Verified numbers + a name confirmed by 2 independent readings: done.
        const best2 = selectBestLine2(line2Pool);

        if (
          best2 &&
          isVerified(best2) &&
          !resolveName(line1Pool).suspicious
        ) {
          break;
        }
      }

      releaseCanvas(page);

      // Right orientation found (even if not fully verified): stop rotating.
      const current = selectBestLine2(line2Pool);
      if (current && keyChecks(current) >= 2) break;
    }

    const best2 = selectBestLine2(line2Pool);

    if (!best2 || keyChecks(best2) < 2) {
      throw new Error(
        "Passport-এর MRZ নির্ভরযোগ্যভাবে পড়া যায়নি। Passport সোজা করে, ভালো আলোতে এবং নিচের দুই লাইন (<<<<) পরিষ্কার দেখা যায় এমন ছবি upload করো।",
      );
    }

    onProgress?.(100);

    return buildResult(resolveName(line1Pool), best2);
  } catch (error) {
    if (error instanceof Error) throw error;

    throw new Error("Passport OCR করা যায়নি। ছবিটি আবার upload করে চেষ্টা করো।");
  } finally {
    bitmap?.close();

    if (worker) {
      await worker.terminate();
    }
  }
}