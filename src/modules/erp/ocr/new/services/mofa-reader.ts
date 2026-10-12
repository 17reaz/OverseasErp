import { createWorker, PSM } from "tesseract.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export type MofaResult = {
  applicationNumber: string;
  applicationDate: string; // ISO yyyy-mm-dd
  name: string;
  passportNo: string;
  trade: string; // "Occupation" on the MOFA page
  visaType: string;
  dateOfBirth: string; // ISO
  expiryDate: string; // ISO
  gender: string;
  source: "pdf-text" | "ocr";
  /** Fields that failed validation or came from OCR and should be eyeballed. */
  reviewFields: Array<keyof MofaResult>;
};

/* ───────────────────────── Parser (shared by PDF text and OCR) ───────────────────────── */

const LABELS = [
  "Application Number",
  "Application Date",
  "Saudi Mission in",
  "Visa Type",
  "Number of Entries",
  "Sponsor Name",
  "Arabic Name",
  "Name",
  "Passport Number",
  "Passport Type",
  "Date of Expiry",
  "Date of Birth",
  "Place of Birth",
  "Current Nationality",
  "Gender",
  "Occupation",
  "Purpose",
];

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Longest label first, so "Sponsor Name" is consumed before the bare "Name".
const LABEL_REGEX = new RegExp(
  `(?<![A-Za-z])(${[...LABELS]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|")})(?![A-Za-z])\\s*:?`,
  "g",
);

/** label -> value text (first occurrence only, so the declaration text below is ignored). */
function splitByLabels(text: string): Map<string, string> {
  const flat = text.replace(/\s+/g, " ").trim();
  const matches = Array.from(flat.matchAll(LABEL_REGEX));
  const fields = new Map<string, string>();

  matches.forEach((match, index) => {
    const label = match[1];
    if (fields.has(label)) return;

    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? flat.length;
    fields.set(label, flat.slice(start, end).trim());
  });

  return fields;
}

function validCalendarDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Accepts yyyy/mm/dd or dd/mm/yyyy (also - or .) and returns ISO, or "". */
function parseDate(value: string): string {
  const match = value.match(/(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})/);
  if (!match) return "";

  const [, a, b, c] = match;
  const iso =
    a.length === 4
      ? `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
      : `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;

  return validCalendarDate(iso) ? iso : "";
}

const OCR_TO_DIGIT: Record<string, string> = {
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

/** BD passport: 1 letter + 8 digits. Only used for OCR text (PDF text is exact). */
function fixPassportNoFromOcr(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 9) return cleaned;

  const letter = cleaned[0];
  const digits = cleaned
    .slice(1)
    .split("")
    .map((char) => OCR_TO_DIGIT[char] ?? char)
    .join("");

  return letter + digits;
}

export function parseMofaText(
  text: string,
  source: MofaResult["source"],
): MofaResult {
  const fields = splitByLabels(text);
  const get = (label: string) => fields.get(label) ?? "";

  const rawPassport = get("Passport Number").split(" ")[0] ?? "";
  const passportNo =
    source === "ocr"
      ? fixPassportNoFromOcr(rawPassport)
      : rawPassport.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const result: MofaResult = {
    applicationNumber: (get("Application Number").split(" ")[0] ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ""),
    applicationDate: parseDate(get("Application Date")),
    name: get("Name").toUpperCase(),
    passportNo,
    trade: get("Occupation"),
    visaType: get("Visa Type"),
    dateOfBirth: parseDate(get("Date of Birth")),
    expiryDate: parseDate(get("Date of Expiry")),
    gender: get("Gender"),
    source,
    reviewFields: [],
  };

  const review = new Set<keyof MofaResult>();

  if (!/^[A-Z]{1,2}\d{7,8}$/.test(result.passportNo)) review.add("passportNo");
  if (!result.applicationDate) review.add("applicationDate");
  if (!result.dateOfBirth) review.add("dateOfBirth");
  if (!result.expiryDate) review.add("expiryDate");
  if (!/^[A-Z .'-]{3,}$/.test(result.name)) review.add("name");
  if (!result.trade) review.add("trade");
  if (!/^[A-Z]\d{9}$/.test(result.applicationNumber)) {
    review.add("applicationNumber");
  }

  // OCR has no checksum for these, so a person should confirm them once.
  if (source === "ocr") {
    (["passportNo", "name", "trade", "applicationDate"] as const).forEach(
      (key) => review.add(key),
    );
  }

  result.reviewFields = Array.from(review);
  return result;
}

/* ───────────────────────── PDF text layer ───────────────────────── */

type PdfDocument = Awaited<
  ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]
>;

async function openPdf(file: File): Promise<PdfDocument> {
  const pdfjs = await import("pdfjs-dist");

  // Bundler-friendly worker setup (Next.js / Vite). Adjust the path to your pdfjs-dist version.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

/** Text of page 1 as reading-order lines (items are grouped by their y position). */
async function extractPdfText(pdf: PdfDocument): Promise<string> {
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();

  const items: Array<{ x: number; y: number; str: string }> = [];

  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    items.push({
      x: item.transform[4],
      y: item.transform[5],
      str: item.str,
    });
  }

  items.sort((a, b) => b.y - a.y || a.x - b.x);

  const rows: Array<{ y: number; items: typeof items }> = [];

  for (const item of items) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row.y - item.y) <= 3) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }

  return rows
    .map((row) =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(" "),
    )
    .join("\n");
}

async function renderPdfPage(pdf: PdfDocument): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas চালু করা যায়নি।");

  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas;
}

/* ───────────────────────── OCR fallback ───────────────────────── */

async function ocrCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await createWorker("eng");

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      user_defined_dpi: "300",
    });
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(2.5, 2400 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas চালু করা যায়নি।");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

/* ───────────────────────── Public API ───────────────────────── */

const isComplete = (result: MofaResult) =>
  Boolean(result.passportNo && result.name && result.applicationDate);

export async function readMofa(file: File): Promise<MofaResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("MOFA file 10 MB-এর কম রাখো।");
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const pdf = await openPdf(file);

    // 1) Real text layer: exact, instant, no OCR.
    const text = await extractPdfText(pdf);
    const fromText = parseMofaText(text, "pdf-text");
    if (isComplete(fromText)) return fromText;

    // 2) Scanned / image-only PDF: render and OCR.
    const canvas = await renderPdfPage(pdf);
    const ocrText = await ocrCanvas(canvas);
    canvas.width = 0;
    canvas.height = 0;

    const fromOcr = parseMofaText(ocrText, "ocr");
    if (!isComplete(fromOcr)) {
      throw new Error("MOFA paper থেকে data পড়া যায়নি। আরও পরিষ্কার file দাও।");
    }
    return fromOcr;
  }

  if (file.type.startsWith("image/")) {
    const canvas = await imageToCanvas(file);
    const ocrText = await ocrCanvas(canvas);
    canvas.width = 0;
    canvas.height = 0;

    const result = parseMofaText(ocrText, "ocr");
    if (!isComplete(result)) {
      throw new Error("MOFA paper থেকে data পড়া যায়নি। আরও পরিষ্কার ছবি দাও।");
    }
    return result;
  }

  throw new Error("PDF অথবা image file দাও।");
}

/** Compare MOFA data with the passport MRZ result (both normalized). */
export function crossCheckWithPassport(
  mofa: MofaResult,
  passport: { passportNo: string; name: string },
): { passportNoMatches: boolean; nameMatches: boolean } {
  const norm = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("")
      .sort()
      .join(""); // order-insensitive: "SABOJ MIA" == "MIA SABOJ"

  return {
    passportNoMatches:
      mofa.passportNo.toUpperCase() === passport.passportNo.toUpperCase(),
    nameMatches: norm(mofa.name) === norm(passport.name),
  };
}
