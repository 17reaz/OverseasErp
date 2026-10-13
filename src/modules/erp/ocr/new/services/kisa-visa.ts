// ksa-visa-pdf.ts — KSA e-visa PDF theke data extract (browser, server lage na)
// npm i pdfjs-dist
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"; // Vite

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface KsaVisa {
  visaNo: string;
  validFrom: string; // dd/mm/yyyy
  validUntil: string; // dd/mm/yyyy
  durationOfStay: string; // "90 Days"
  placeOfIssue: string;
  visaType: string; // Work
  skillLevel: string; // Skilled
  name: string;
  nationality: string;
  birthDate: string; // dd/mm/yyyy
  passportNo: string;
  refNo: string;
  refDate: string; // dd/mm/yyyy
  occupation: string;
  employerName: string; // Arabic
  visaFees: string;
  applicationNo: string;
  mrz: string[];
  warnings: string[]; // cross-check / missing field report
}

type StrKey = Exclude<keyof KsaVisa, "mrz" | "warnings">;
type Tok = { str: string; x: number; y: number; w: number; h: number };
type PageData = { toks: Tok[]; W: number };
type Kind = "latin" | "bilingual" | "arabic";
type Field = {
  label: RegExp; // normalized label (shudhu a-z, lowercase) -er upor match
  keys: StrKey[]; // 1 ta key, na hole 2 ta (visaType, skillLevel)
  kind: Kind;
  pattern?: RegExp; // latin value theke ja ber korbo
  extraBelow?: number; // value label-er niche thakle (line height-er gunon)
};

// ---------- tunables (page width W-er ratio) ----------
const LABEL_X = 0.78; // English label column shuru
const AR_LABEL_X = 0.19; // Arabic label column er dan-sima (er bam-e porle label)
const LINE_GAP = 1.8; // 2-line label gulo ek block (line height-er gunon)
const VALUE_GAP = 0.06; // ek row-te 2 ta value alada korar gap

const DATE = /\d{2}\/\d{2}\/\d{4}/;
const FIELDS: Field[] = [
  { label: /^visano$/, keys: ["visaNo"], kind: "latin", pattern: /\d{8,12}/ },
  { label: /^validfrom$/, keys: ["validFrom"], kind: "latin", pattern: DATE },
  { label: /^validuntil$/, keys: ["validUntil"], kind: "latin", pattern: DATE },
  { label: /^durationofstay$/, keys: ["durationOfStay"], kind: "latin", pattern: /\d+\s*Days?/i },
  { label: /^placeofissue$/, keys: ["placeOfIssue"], kind: "bilingual" },
  { label: /^visatype$/, keys: ["visaType", "skillLevel"], kind: "bilingual" },
  { label: /^name$/, keys: ["name"], kind: "latin" },
  { label: /^nationality$/, keys: ["nationality"], kind: "bilingual" },
  { label: /^birthdate$/, keys: ["birthDate"], kind: "latin", pattern: DATE },
  { label: /^passportno$/, keys: ["passportNo"], kind: "latin", pattern: /\b[A-Z]{1,2}\d{6,8}\b/ },
  { label: /^refno$/, keys: ["refNo"], kind: "latin", pattern: /\d{6,}/ },
  { label: /^refdate$/, keys: ["refDate"], kind: "latin", pattern: DATE },
  { label: /^occupation$/, keys: ["occupation"], kind: "bilingual" },
  { label: /^employername$/, keys: ["employerName"], kind: "arabic" },
  { label: /^visafees$/, keys: ["visaFees"], kind: "bilingual" },
  // barcode-er niche-e value thake
  { label: /^applicationno$/, keys: ["applicationNo"], kind: "latin", pattern: /\b[A-Z]?\d{8,10}\b/, extraBelow: 2 },
];

// ---------- helpers ----------
const AR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const AR_G = new RegExp(AR.source, "g");
const byX = (a: Tok, b: Tok) => a.x - b.x;
const cy = (t: Tok) => t.y + t.h / 2;
const clean = (s: string) =>
  s.replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").replace(/\s+/g, " ").trim();
const normDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function emptyVisa(): KsaVisa {
  return {
    visaNo: "", validFrom: "", validUntil: "", durationOfStay: "", placeOfIssue: "", visaType: "",
    skillLevel: "", name: "", nationality: "", birthDate: "", passportNo: "", refNo: "", refDate: "",
    occupation: "", employerName: "", visaFees: "", applicationNo: "", mrz: [], warnings: [],
  };
}

async function loadPage(page: pdfjs.PDFPageProxy): Promise<PageData> {
  const vp = page.getViewport({ scale: 1 });
  const [x0, y0] = page.view;
  const tc = await page.getTextContent();
  const toks: Tok[] = [];
  for (const it of tc.items as any[]) {
    if (typeof it.str !== "string" || !it.str.trim()) continue;
    toks.push({
      str: normDigits(it.str.normalize("NFKC")), // Arabic shaped form -> normal
      x: it.transform[4] - x0,
      y: it.transform[5] - y0,
      w: it.width,
      h: it.height || Math.abs(it.transform[3]) || 10,
    });
  }
  return { toks, W: vp.width };
}

// y-position diye line-e bhag (stream order-er upor nirbhor na)
function groupLines(toks: Tok[]): Tok[][] {
  const sorted = [...toks].sort((a, b) => cy(b) - cy(a));
  const lines: Tok[][] = [];
  for (const t of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(cy(line[0]) - cy(t)) <= 0.5 * Math.max(t.h, line[0].h)) line.push(t);
    else lines.push([t]);
  }
  return lines;
}

function clusters(toks: Tok[], gap: number): Tok[][] {
  const out: Tok[][] = [];
  let right = -Infinity;
  for (const t of [...toks].sort(byX)) {
    if (out.length && t.x - right <= gap) out[out.length - 1].push(t);
    else out.push([t]);
    right = Math.max(right, t.x + t.w);
  }
  return out;
}

// ---------- label blocks ----------
type Block = { key: string; minX: number; cyTop: number; cyBot: number; h: number };

function buildBlocks(labelToks: Tok[]): Block[] {
  const sorted = [...labelToks].sort((a, b) => cy(b) - cy(a));
  const groups: Tok[][] = [];
  for (const t of sorted) {
    const g = groups[groups.length - 1];
    const prev = g && g[g.length - 1];
    if (prev && cy(prev) - cy(t) < LINE_GAP * Math.max(t.h, prev.h)) g.push(t);
    else groups.push([t]);
  }
  return groups.map((g) => {
    const text = groupLines(g)
      .map((l) => l.sort(byX).map((t) => t.str).join(" "))
      .join(" ");
    const cys = g.map(cy);
    return {
      key: text.toLowerCase().replace(/[^a-z]/g, ""), // "Visa No." -> "visano"
      minX: Math.min(...g.map((t) => t.x)),
      cyTop: Math.max(...cys),
      cyBot: Math.min(...cys),
      h: Math.max(...g.map((t) => t.h)),
    };
  });
}

// ---------- value readers ----------
function splitBilingual(raw: string): { en: string; ar: string } {
  const en: string[] = [];
  const ar: string[] = [];
  for (const part of raw.split(/\s+-\s+/)) {
    const lat = clean(part.replace(AR_G, " "));
    if (lat) en.push(lat);
    if (AR.test(part)) ar.push(clean(part.replace(/[A-Za-z0-9]+/g, " ")));
  }
  return { en: en.join(" - "), ar: ar.join(" ") };
}

// Arabic glyph/word gulo ডান theke bame joray
function arabicText(toks: Tok[]): string {
  const arabic = toks.filter((t) => AR.test(t.str)).sort((a, b) => b.x - a.x);
  let s = "";
  let prevLeft: number | null = null;
  for (const t of arabic) {
    if (prevLeft !== null && prevLeft - (t.x + t.w) > 0.15 * t.h) s += " ";
    s += t.str;
    prevLeft = t.x;
  }
  return clean(s);
}

function readValue(f: Field, vt: Tok[]): string {
  const joined = clean([...vt].sort(byX).map((t) => t.str).join(" "));
  if (f.kind === "arabic") return arabicText(vt);
  if (f.kind === "bilingual") return splitBilingual(joined).en;
  const lat = clean(joined.replace(AR_G, " "));
  if (!f.pattern) return lat;
  return lat.match(f.pattern)?.[0] ?? "";
}

// ---------- main field scan ----------
function fillFields(out: KsaVisa, { toks, W }: PageData) {
  const labelToks = toks.filter((t) => t.x >= LABEL_X * W && /[A-Za-z]/.test(t.str));
  const blocks = buildBlocks(labelToks);
  const set = (k: StrKey, v: string) => { if (v && !out[k]) out[k] = v; };

  blocks.forEach((blk, i) => {
    const field = FIELDS.find((f) => f.label.test(blk.key));
    if (!field) return; // "Note" ba onno text -> shudhu boundary hishebe kaj kore

    const upper = i === 0 ? blk.cyTop + 2 * blk.h : (blocks[i - 1].cyBot + blk.cyTop) / 2;
    const lower =
      (i === blocks.length - 1 ? blk.cyBot - 3 * blk.h : (blk.cyBot + blocks[i + 1].cyTop) / 2) -
      (field.extraBelow ?? 0) * blk.h;

    const vt = toks.filter(
      (t) =>
        cy(t) <= upper &&
        cy(t) >= lower &&
        t.x + t.w <= blk.minX - 2 && // English label-er bam-e
        t.x + t.w > AR_LABEL_X * W // Arabic label column-er dan-e
    );
    if (!vt.length) return;

    if (field.keys.length === 2) {
      // Visa Type row: bam = type, dan = skill
      const cl = clusters(vt, VALUE_GAP * W);
      field.keys.forEach((k, idx) => {
        if (cl[idx]) set(k, splitBilingual(clean(cl[idx].sort(byX).map((t) => t.str).join(" "))).en);
      });
    } else {
      set(field.keys[0], readValue(field, vt));
    }
  });
}

// ---------- MRZ ----------
function findMrz(pages: PageData[]): string[] {
  const res: string[] = [];
  for (const { toks } of pages) {
    for (const line of groupLines(toks)) {
      const s = line.sort(byX).map((t) => t.str).join("").replace(/\s+/g, "");
      if (s.length >= 28 && /^[A-Z0-9<]+$/.test(s) && s.includes("<<")) res.push(s);
    }
  }
  return res;
}

// ICAO 9303 check digit (7-3-1)
function checkDigit(s: string): number {
  const w = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const v = c === "<" ? 0 : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 55; // A=10
    sum += v * w[i % 3];
  }
  return sum % 10;
}

const parseDMY = (s: string) => {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : NaN;
};

function crossCheck(out: KsaVisa) {
  const w = out.warnings;

  // 1) required field
  (Object.keys(out) as (keyof KsaVisa)[])
    .filter((k) => k !== "mrz" && k !== "warnings" && !out[k])
    .forEach((k) => w.push(`missing: ${k}`));

  // 2) validFrom + duration == validUntil
  const from = parseDMY(out.validFrom);
  const until = parseDMY(out.validUntil);
  const days = parseInt(out.durationOfStay, 10);
  if (!isNaN(from) && !isNaN(until) && !isNaN(days)) {
    const diff = Math.round((until - from) / 86400000);
    if (diff !== days) w.push(`date mismatch: validFrom→validUntil = ${diff} days, duration = ${days}`);
  }

  // 3) MRZ
  const [l1, l2] = out.mrz;
  if (l2) {
    const pn9 = l2.slice(0, 9);
    const pn = pn9.replace(/</g, "");
    if (out.passportNo && out.passportNo !== pn) w.push(`passport mismatch: page=${out.passportNo}, mrz=${pn}`);
    if (String(checkDigit(pn9)) !== l2[9]) w.push("MRZ passport check digit invalid");
    if (!out.passportNo && pn) out.passportNo = pn;
    // ei template-e MRZ-e birth date DDMMYYYY akare thake
    const bd = out.birthDate.replace(/\//g, "");
    if (bd && !l2.includes(bd)) w.push("birthDate MRZ-e pawa jay nai");
  }
  if (l1) {
    const m = l1.match(/^[A-Z0-9]<([A-Z]{3})([A-Z<]*?)<<([A-Z<]*?)<*$/);
    if (m && out.name) {
      const joined = (m[3] + m[2]).replace(/</g, "");
      if (out.name.replace(/\s+/g, "").toUpperCase() !== joined) {
        w.push(`name mismatch: page=${out.name}, mrz=${m[3]} ${m[2]}`);
      }
    }
  }
}

// ---------- public API ----------
export async function extractKsaVisa(file: File | ArrayBuffer): Promise<KsaVisa> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

  const pages: PageData[] = [];
  for (let p = 1; p <= doc.numPages; p++) pages.push(await loadPage(await doc.getPage(p)));

  const out = emptyVisa();
  for (const pg of pages) fillFields(out, pg); // proti page, shudhu khali field bhore
  out.mrz = findMrz(pages); // page 1 theke-i shuru
  crossCheck(out);
  return out;
}

// Tuning-er jonno: shob token-er position dekhte
export async function debugKsaTokens(file: File | ArrayBuffer, pageNo = 1) {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const { toks, W } = await loadPage(await doc.getPage(pageNo));
  console.log("page width:", W);
  console.table(
    toks.map((t) => ({
      str: t.str, x: +t.x.toFixed(1), xr: +((t.x / W).toFixed(3)),
      y: +t.y.toFixed(1), w: +t.w.toFixed(1), h: +t.h.toFixed(1),
    }))
  );
}