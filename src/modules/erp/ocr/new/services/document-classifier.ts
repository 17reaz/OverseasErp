import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// import type { DocType } from "../../../registration/types"; // path ta tomar project onujayi thik koro
import type { DocType } from "../../types";
// Jodi onno jaygay already workerSrc set kora thake, ei 3 line remove kore dao.
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export type ClassifyResult = {
  docType: DocType | null;
  confidence: "high" | "medium" | "low" | "none";
  scores: Record<DocType, number>;
  reason: string;
};

type Rule = { pattern: RegExp; weight: number };

const RULES: Record<DocType, Rule[]> = {
  visa: [
    { pattern: /visa\s*(no|number)/, weight: 3 },
    { pattern: /duration\s*of\s*stay/, weight: 3 },
    { pattern: /valid\s*(from|until)/, weight: 2 },
    { pattern: /place\s*of\s*issue/, weight: 2 },
    { pattern: /skill\s*level/, weight: 2 },
    { pattern: /visa\s*fees?/, weight: 2 },
    { pattern: /kingdom of saudi arabia/, weight: 1 },
    { pattern: /employer/, weight: 1 },
    { pattern: /التأشيرة|تأشيرة/, weight: 2 },
  ],
  mofa: [
    { pattern: /ministry of foreign affairs|\bmofa\b/, weight: 3 },
    { pattern: /application\s*(no|number)/, weight: 2 },
    { pattern: /application\s*date/, weight: 2 },
    { pattern: /embassy|consulate|attest|enjaz/, weight: 2 },
    { pattern: /occupation|profession|\btrade\b/, weight: 1 },
    { pattern: /visa\s*type/, weight: 1 },
    { pattern: /وزارة الخارجية/, weight: 3 },
  ],
  medical: [
    { pattern: /wafid/, weight: 4 },
    { pattern: /medical\s*(examination|exam)/, weight: 3 },
    { pattern: /\bgcc\b/, weight: 2 },
    { pattern: /medical\s*cent(er|re)/, weight: 2 },
    { pattern: /\b(unfit|fit)\b/, weight: 1 },
    { pattern: /slip/, weight: 1 },
    { pattern: /الفحص الطبي|لائق/, weight: 3 },
  ],
  passport: [
    { pattern: /p<[a-z]{3}/, weight: 6 }, // MRZ line
    { pattern: /passport\s*(no|number)/, weight: 1 },
    { pattern: /date of birth/, weight: 1 },
    { pattern: /place of birth/, weight: 1 },
  ],  police_clearance: [
    { pattern: /\b(police clearance|police certificate|criminal record)\b/i, weight: 5 },
  ],
  nid: [
    { pattern: /\b(national id|national identity|identity card|nid number)\b/i, weight: 5 },
  ],
};

const FILENAME_HINTS: Array<[RegExp, DocType]> = [
  [/wafid|medical|\bgamca\b/i, "medical"],
  [/mofa/i, "mofa"],
  [/visa|\bksa\b/i, "visa"],
  [/passport|\bpp\b/i, "passport"],
];

const MAX_PAGES = 3;
const MIN_SCORE = 4;
const MIN_MARGIN = 2;

function emptyScores(): Record<DocType, number> {
  return {
  passport: 0,
  medical: 0,
  mofa: 0,
  visa: 0,
  police_clearance: 0,
  nid: 0,
};
}

function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}


async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pages = Math.min(pdf.numPages, MAX_PAGES);
  const chunks: string[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    chunks.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }

  return chunks.join("\n").toLowerCase().replace(/\s+/g, " ");
}


function scoreText(text: string): Record<DocType, number> {
  const scores = emptyScores();

  (Object.keys(RULES) as DocType[]).forEach((docType) => {
    for (const rule of RULES[docType]) {
      if (rule.pattern.test(text)) scores[docType] += rule.weight;
    }
  });

  return scores;
}

function hintFromFileName(name: string): DocType | null {
  for (const [pattern, docType] of FILENAME_HINTS) {
    if (pattern.test(name)) return docType;
  }
  return null;
}

function pickWinner(scores: Record<DocType, number>) {
  const ranked = (Object.entries(scores) as [DocType, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [topType, topScore] = ranked[0];
  const secondScore = ranked[1][1];

  return { topType, topScore, margin: topScore - secondScore };
}

export async function classifyDocument(file: File): Promise<ClassifyResult> {
  const nameHint = hintFromFileName(file.name);

  // Image hole: passport dhore nei, kintu filename hint thakle seta use kori.
  if (isImage(file)) {
    const docType = nameHint ?? "passport";
    return {
      docType,
      confidence: nameHint ? "medium" : "low",
      scores: emptyScores(),
      reason: nameHint
        ? "Image file, detected from file name."
        : "Image file, assumed to be a passport.",
    };
  }

  if (!isPdf(file)) {
    return {
      docType: null,
      confidence: "none",
      scores: emptyScores(),
      reason: "Unsupported file type. Upload a PDF or an image.",
    };
  }

  let text = "";
  try {
    text = await extractPdfText(file);
  } catch (error) {
    console.error("Document classification failed to read PDF:", error);
  }

  // Scanned PDF (text nai): filename hint e fallback.
  if (text.length < 30) {
    return {
      docType: nameHint,
      confidence: nameHint ? "low" : "none",
      scores: emptyScores(),
      reason: nameHint
        ? "PDF has no readable text (scanned). Guessed from file name."
        : "PDF has no readable text (scanned) and the file name gave no clue. Select the document type manually.",
    };
  }

  const scores = scoreText(text);

  // Filename hint ke ekta chhoto bonus dei, tie-break er jonno.
  if (nameHint) scores[nameHint] += 1;

  const { topType, topScore, margin } = pickWinner(scores);

  if (topScore < MIN_SCORE) {
    return {
      docType: nameHint,
      confidence: nameHint ? "low" : "none",
      scores,
      reason: "Not enough matching keywords to identify the document.",
    };
  }

  if (margin < MIN_MARGIN) {
    return {
      docType: null,
      confidence: "none",
      scores,
      reason: "Document looks like more than one type. Select the type manually.",
    };
  }

  return {
    docType: topType,
    confidence: topScore >= 8 && margin >= 4 ? "high" : "medium",
    scores,
    reason: `Detected as ${topType}.`,
  };
}
