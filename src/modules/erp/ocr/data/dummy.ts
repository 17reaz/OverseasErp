import type { DocType, ExtractedField, OcrScan } from "../types";

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  passport: "Passport",
  visa: "Visa",
  mofa: "MOFA",
  nid: "National ID",
  medical: "Medical report",
  police_clearance: "Police clearance",
};

export const DOC_TYPES = Object.keys(DOC_TYPE_LABEL) as DocType[];

export const DUMMY_CANDIDATES = [
  "Md. Rahim Uddin",
  "Sumaiya Akter",
  "Abdul Karim",
  "Nasrin Sultana",
  "Jahid Hasan",
  "Rubel Mia",
];

const TEMPLATES: Record<DocType, { key: string; label: string; sample: string }[]> = {
  passport: [
    { key: "surname", label: "Surname", sample: "UDDIN" },
    { key: "given_names", label: "Given names", sample: "MD RAHIM" },
    { key: "passport_no", label: "Passport number", sample: "A01234567" },
    { key: "nationality", label: "Nationality", sample: "BANGLADESHI" },
    { key: "dob", label: "Date of birth", sample: "1994-03-12" },
    { key: "sex", label: "Sex", sample: "M" },
    { key: "pob", label: "Place of birth", sample: "JESSORE" },
    { key: "issue", label: "Date of issue", sample: "2022-06-01" },
    { key: "expiry", label: "Date of expiry", sample: "2032-05-31" },
  ],
  visa: [
    { key: "visa_no", label: "Visa number", sample: "VS-2026-884521" },
    { key: "visa_type", label: "Visa type", sample: "Work" },
    { key: "passport_no", label: "Passport number", sample: "A01234567" },
    { key: "sponsor", label: "Sponsor", sample: "AL NOOR CONTRACTING" },
    { key: "issue", label: "Date of issue", sample: "2026-08-14" },
    { key: "expiry", label: "Date of expiry", sample: "2027-02-13" },
  ],
  mofa: [
    { key: "application_no", label: "Application number", sample: "MOFA-558201" },
    { key: "visa_no", label: "Visa number", sample: "VS-2026-884521" },
    { key: "employer", label: "Employer", sample: "AL NOOR CONTRACTING" },
    { key: "profession", label: "Profession", sample: "Electrician" },
    { key: "date", label: "Attestation date", sample: "2026-09-02" },
  ],
  nid: [
    { key: "name", label: "Name", sample: "Md. Rahim Uddin" },
    { key: "father", label: "Father's name", sample: "Md. Abdul Latif" },
    { key: "nid_no", label: "NID number", sample: "1994 5678 9012 3" },
    { key: "dob", label: "Date of birth", sample: "1994-03-12" },
  ],
  medical: [
    { key: "name", label: "Patient name", sample: "Md. Rahim Uddin" },
    { key: "passport_no", label: "Passport number", sample: "A01234567" },
    { key: "center", label: "Medical center", sample: "Dhaka Health Care" },
    { key: "result", label: "Result", sample: "FIT" },
    { key: "date", label: "Exam date", sample: "2026-08-20" },
  ],
  police_clearance: [
    { key: "name", label: "Name", sample: "Md. Rahim Uddin" },
    { key: "pcc_no", label: "Certificate number", sample: "PCC-2026-77310" },
    { key: "issue", label: "Date of issue", sample: "2026-07-30" },
    { key: "valid_until", label: "Valid until", sample: "2027-01-29" },
  ],
};

// deterministic dummy confidence values so the UI looks realistic
const CONF = [98, 96, 99, 94, 71, 97, 58, 92, 95];

export function buildFields(docType: DocType, offset = 0): ExtractedField[] {
  return TEMPLATES[docType].map((f, i) => ({
    key: f.key,
    label: f.label,
    value: f.sample,
    confidence: CONF[(i + offset) % CONF.length],
  }));
}

export function averageConfidence(fields: ExtractedField[]): number {
  if (!fields.length) return 0;
  return Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length);
}

const mins = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

function make(
  id: string,
  fileName: string,
  docType: DocType,
  status: OcrScan["status"],
  candidateName: string | null,
  minutesAgo: number,
  offset = 0,
): OcrScan {
  const fields = status === "processing" || status === "failed" ? [] : buildFields(docType, offset);
  return {
    id,
    fileName,
    docType,
    status,
    confidence: averageConfidence(fields),
    candidateName,
    uploadedBy: "Admin",
    createdAt: mins(minutesAgo),
    pages: docType === "passport" ? 2 : 1,
    fields,
    error: status === "failed" ? "Image is too blurry to read. Upload a clearer scan." : undefined,
  };
}

export const DUMMY_SCANS: OcrScan[] = [
  make("scan-1008", "rahim-passport.jpg", "passport", "needs_review", "Md. Rahim Uddin", 4),
  make("scan-1007", "sumaiya-visa.pdf", "visa", "processing", "Sumaiya Akter", 6),
  make("scan-1006", "karim-mofa.png", "mofa", "approved", "Abdul Karim", 38, 2),
  make("scan-1005", "nasrin-nid-front.jpg", "nid", "approved", "Nasrin Sultana", 95, 1),
  make("scan-1004", "jahid-medical.pdf", "medical", "needs_review", "Jahid Hasan", 140, 3),
  make("scan-1003", "rubel-passport.jpg", "passport", "failed", "Rubel Mia", 210),
  make("scan-1002", "rahim-pcc.pdf", "police_clearance", "approved", "Md. Rahim Uddin", 1450, 2),
  make("scan-1001", "karim-visa.jpg", "visa", "approved", "Abdul Karim", 2880, 1),
];
