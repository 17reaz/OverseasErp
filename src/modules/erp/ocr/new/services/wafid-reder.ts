// wafid-pdf.ts — Wafid / GCC medical status PDF theke data extract (browser-e, server lage na)
// Font/bold-er upor nirbhor kore na. Known label dhore, tar thik niche-r text-ke value dhore.
// npm i pdfjs-dist
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"; // Vite

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface WafidMedical {
  firstName: string;
  lastName: string;
  passportNo: string;
  passportIssuePlace: string;
  nationality: string;
  nationalId: string;
  age: string;
  weight: string;
  height: string;
  medicalTestAt: string;
  medicalCenter: string;
  medicalCenterCode: string;
  medicalExamDate: string; // dd/mm/yyyy
  gccExamDate: string;
  status: string; // FIT / UNFIT ...
}

const FIELD_MAP: Record<string, keyof WafidMedical> = {
  "first name": "firstName",
  "last name": "lastName",
  "passport no": "passportNo",
  "passport issue place": "passportIssuePlace",
  "nationality": "nationality",
  "national id": "nationalId",
  "age": "age",
  "weight": "weight",
  "height": "height",
  "medical test at": "medicalTestAt",
  "medical center": "medicalCenter",
  "medical center code": "medicalCenterCode",
  "medical examination date": "medicalExamDate",
  "date of examination in gcc state": "gccExamDate",
  "status": "status",
};
const MAX_LABEL_PARTS = 5; // ekta label max koyta text-piece-e bhaga thakte pare

type Item = { str: string; x: number; y: number };
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function extractWafidMedical(file: File | ArrayBuffer): Promise<WafidMedical> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();

  const items: Item[] = [];
  for (const it of tc.items as any[]) {
    const str = String(it.str ?? "").replace(/\s+/g, " ").trim();
    if (str) items.push({ str, x: it.transform[4], y: it.transform[5] });
  }

  // 1) x position onujayi column-e bhag (left-aligned item-gulo ek column-e porbe)
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const columns: Item[][] = [];
  for (const it of sorted) {
    const last = columns[columns.length - 1];
    if (last && Math.abs(it.x - last[0].x) <= 4) last.push(it);
    else columns.push([it]);
  }

  // 2) prottek column upor→niche: label khuje, tar porer text gulo value
  const out = Object.fromEntries(Object.values(FIELD_MAP).map((k) => [k, ""])) as unknown as WafidMedical;
  for (const col of columns) {
    col.sort((a, b) => b.y - a.y); // PDF-e y upore boro
    let current: keyof WafidMedical | null = null;
    const values: Record<string, string[]> = {};
    for (let i = 0; i < col.length; ) {
      // sobcheye lamba label match age (jemon "Medical center code" vs "Medical center")
      let matched: { key: keyof WafidMedical; len: number } | null = null;
      for (let len = Math.min(MAX_LABEL_PARTS, col.length - i); len >= 1 && !matched; len--) {
        const key = FIELD_MAP[norm(col.slice(i, i + len).map((c) => c.str).join(" "))];
        if (key) matched = { key, len };
      }
      if (matched) { current = matched.key; values[current] = []; i += matched.len; }
      else { if (current) values[current].push(col[i].str); i++; }
    }
    for (const [key, parts] of Object.entries(values)) {
      const v = parts.join(" ").trim();
      (out as any)[key] = v === "-" ? "" : v;
    }
  }
  return out;
}