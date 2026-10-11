# OCR module (dummy UI)

All data is fake and lives in memory. Nothing is sent to a server.

## Add to the project

1. Copy `src/modules/ocr` into your app.
2. Install any missing shadcn components:

   npx shadcn@latest add tabs table card badge button input label select sheet alert progress switch slider

3. Add a route / menu item:

   import { OcrPage } from "@/modules/ocr";
   // <Route path="/ocr" element={<OcrPage />} />

## Structure

- `components/ocr-page.tsx`      page with Scans / New scan / Settings tabs, holds the state
- `components/ocr-stats.tsx`     summary cards
- `components/scan-table.tsx`    searchable, filterable list of scans
- `components/upload-panel.tsx`  drag-and-drop upload with fake progress
- `components/review-sheet.tsx`  side panel: preview, editable fields, confidence, approve
- `components/ocr-settings.tsx`  engine, languages, auto-approve rules
- `data/dummy.ts`                fake scans and field templates
- `types.ts`                     shared types

## Connecting the real backend later

Replace `DUMMY_SCANS` in `ocr-page.tsx` with an API call, `startScan` in `upload-panel.tsx` with a real upload,
and the placeholder preview in `review-sheet.tsx` with the uploaded image.
