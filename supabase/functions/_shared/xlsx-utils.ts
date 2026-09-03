// supabase/functions/_shared/xlsx-utils.ts

import * as XLSX from "npm:xlsx@0.18.5";

export interface SheetDefinition {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

/**
 * Builds a multi-sheet .xlsx workbook and returns the raw bytes,
 * ready to upload to Supabase Storage.
 */
export function buildWorkbook(sheets: SheetDefinition[]): Uint8Array {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const aoa = [sheet.headers, ...sheet.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    // Excel sheet names: max 31 chars, no special chars.
    const safeName = sheet.name.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
  }

  const buffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  });

  return new Uint8Array(buffer);
}

/**
 * Parses an uploaded .xlsx file (single relevant sheet) into an array
 * of row objects keyed by the header row. Trims header/value strings.
 */
export function parseSheetToObjects(
  fileBytes: Uint8Array,
  sheetName?: string,
): Record<string, unknown>[] {
  const workbook = XLSX.read(fileBytes, { type: "array" });

  const targetSheetName = sheetName ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${targetSheetName}" not found in workbook.`);
  }

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
    worksheet,
    { defval: null, raw: false },
  );

  return rows.map((row) => {
    const trimmed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.trim();
      trimmed[cleanKey] =
        typeof value === "string" ? value.trim() : value;
    }
    return trimmed;
  });
}
