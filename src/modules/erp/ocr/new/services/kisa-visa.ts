// ksa-visa-pdf.ts — KSA Visa (Saudi e-visa / Mofa-style) PDF theke data extract (browser-e, server lage na)
// Font-er upor nirbhor kore na. Dan-pashe-r English label (Visa No., Valid From...) khuje,
// tar ek line-er bhetore thaka Latin text-ke value dhore. Employer name shudhu Arabic, tai alada kore pore.
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
  mrz: string[]; // page 2-te thakle (2 ta line), na thakle []
}

type Item = { str: string; x: number; y: number; w: number };
type Rule = { key: keyof KsaVisa | "visaTypeAndSkill" | "employerName"; yAbove?: number };

// English label (prothom line) -> kon field
const LABELS: Record<string, Rule> = {
  "Visa No.": { key: "visaNo" },
  "Valid From": { key: "validFrom" },
  "Valid Until": { key: "validUntil" },
  "Duration of": { key: "durationOfStay" },
  "Place of": { key: "placeOfIssue" },
  "Visa": { key: "visaTypeAndSkill" },
  "Name": { key: "name" },
  "Nationality": { key: "nationality" },
  "Birth Date": { key: "birthDate" },
  "Passport": { key: "passportNo" },
  "Ref. No.": { key: "refNo" },
  "Ref. Date": { key: "refDate" },
  "Occupation": { key: "occupation" },
  "Employer": { key: "employerName" },
  "Visa Fees": { key: "visaFees" },
  "Application No.": { key: "applicationNo", yAbove: 25 }, // barcode-er niche-e value thake
};

const ROW_TOL = 6; // label-er line theke koto y-difference porjonto "ek line" dhora hobe
const hasLatinOrDigit = (s: string) => /[A-Za-z0-9]/.test(s);
const clean = (s: string) => s.replace(/^\s*-\s*/, "").replace(/\s+/g, " ").trim();

export async function extractKsaVisa(file: File | ArrayBuffer): Promise<KsaVisa> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

  const out: KsaVisa = {
    visaNo: "", validFrom: "", validUntil: "", durationOfStay: "", placeOfIssue: "", visaType: "",
    skillLevel: "", name: "", nationality: "", birthDate: "", passportNo: "", refNo: "", refDate: "",
    occupation: "", employerName: "", visaFees: "", applicationNo: "", mrz: [],
  };

  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  const items: Item[] = [];
  for (const it of tc.items as any[]) {
    const str = String(it.str ?? "");
    if (str.trim()) items.push({ str, x: it.transform[4], y: it.transform[5], w: it.width });
  }

  // 1) English label gulo (dan-pashe) khuje ber kora
  for (const lab of items) {
    const rule = LABELS[lab.str.trim()];
    if (!rule) continue;
    const yTop = lab.y + ROW_TOL;
    const yBottom = lab.y - (rule.yAbove ?? ROW_TOL);
    // label-er bam-pashe, ek-i row-er item
    const row = items.filter((i) => i.y <= yTop && i.y >= yBottom && i.x + i.w < lab.x - 2 && i.x > 130);

    if (rule.key === "employerName") {
      out.employerName = arabicText(row);
      continue;
    }
    const latin = row.filter((i) => hasLatinOrDigit(i.str)).sort((a, b) => a.x - b.x);
    if (!latin.length) continue;

    if (rule.key === "visaTypeAndSkill") {
      out.visaType = clean(latin[0].str);
      out.skillLevel = latin[1] ? clean(latin[1].str) : "";
    } else {
      (out as any)[rule.key] = clean(latin.map((i) => i.str).join(" "));
    }
  }

  // 2) MRZ (jodi page 2-te thake): "<" thaka lambaa line
  for (let p = 2; p <= doc.numPages; p++) {
    const pg = await doc.getPage(p);
    const t = await pg.getTextContent();
    for (const it of t.items as any[]) {
      const s = String(it.str ?? "").trim();
      if (s.includes("<") && s.length >= 30) out.mrz.push(s);
    }
  }
  return out;
}

// Arabic glyph gulo (visual order-e, shaped form-e) -> normal Arabic text
function arabicText(row: Item[]): string {
  const arabic = row.filter((i) => /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(i.str));
  arabic.sort((a, b) => b.x - a.x); // Arabic dan theke bame pora hoy
  let s = "";
  let prevStart: number | null = null;
  for (const g of arabic) {
    if (prevStart !== null && prevStart - (g.x + g.w) > 1.5) s += " "; // gap = space
    s += g.str.normalize("NFKC");
    prevStart = g.x;
  }
  return s.trim();
}