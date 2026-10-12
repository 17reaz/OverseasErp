// wafid-pdf.ts — Wafid / GCC medical status PDF theke data extract (browser-e, server lage na)
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
  "First name": "firstName",
  "Last name": "lastName",
  "Passport No": "passportNo",
  "Passport issue place": "passportIssuePlace",
  "Nationality": "nationality",
  "National ID": "nationalId",
  "Age": "age",
  "Weight": "weight",
  "Height": "height",
  "Medical test at": "medicalTestAt",
  "Medical center": "medicalCenter",
  "Medical center code": "medicalCenterCode",
  "Medical examination date": "medicalExamDate",
  "Date of examination in GCC state": "gccExamDate",
  "Status": "status",
};

type Item = { str: string; x: number; y: number; bold: boolean };

export async function extractWafidMedical(file: File | ArrayBuffer): Promise<WafidMedical> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  await page.getOperatorList(); // font-er real naam load korar jonno dorkar

  const items: Item[] = [];
  for (const it of tc.items as any[]) {
    const str = String(it.str ?? "").trim();
    if (!str) continue;
    let fontName = "";
    try { fontName = page.commonObjs.get(it.fontName)?.name ?? ""; } catch { /* ignore */ }
    items.push({ str, x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), bold: /bold/i.test(fontName) });
  }

  // column start = jei x-e 3 ta-r beshi item shuru hoy (header bad jabe)
  const count = new Map<number, number>();
  for (const i of items) count.set(i.x, (count.get(i.x) ?? 0) + 1);
  const colStarts = [...count].filter(([, n]) => n >= 3).map(([x]) => x).sort((a, b) => a - b);

  const raw: Record<string, string> = {};
  for (const cx of colStarts) {
    const col = items.filter((i) => Math.abs(i.x - cx) <= 3).sort((a, b) => b.y - a.y); // upor theke niche
    let label: string[] = [], value: string[] = [], mode: "l" | "v" | null = null;
    for (const it of col) {
      if (it.bold) { value.push(it.str); mode = "v"; }
      else {
        if (mode === "v") { raw[label.join(" ")] = value.join(" "); label = []; value = []; }
        label.push(it.str); mode = "l";
      }
    }
    if (label.length && value.length) raw[label.join(" ")] = value.join(" ");
  }

  const out = Object.fromEntries(Object.values(FIELD_MAP).map((k) => [k, ""])) as unknown as WafidMedical;
  for (const [label, val] of Object.entries(raw)) {
    const key = FIELD_MAP[label];
    if (key) out[key] = val === "-" ? "" : val;
  }
  return out;
}