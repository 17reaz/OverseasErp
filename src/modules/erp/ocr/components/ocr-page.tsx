import { useMemo, useRef, useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DUMMY_SCANS, averageConfidence } from "../data/dummy";
import type { ExtractedField, OcrScan } from "../types";
import { OcrSettings } from "./ocr-settings";
import { OcrStats } from "./ocr-stats";
import { ReviewSheet } from "./review-sheet";
import { ScanTable } from "./scan-table";
import { UploadPanel } from "./upload-panel";

export function OcrPage() {
  const [scans, setScans] = useState<OcrScan[]>(DUMMY_SCANS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("scans");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const selected = useMemo(() => scans.find((s) => s.id === selectedId) ?? null, [scans, selectedId]);
  const needsReview = scans.filter((s) => s.status === "needs_review").length;

  const handleScanned = (scan: OcrScan) => setScans((prev) => [scan, ...prev]);

  const handleApprove = (id: string, fields: ExtractedField[], candidateName: string | null) => {
    setScans((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, fields, candidateName, status: "approved", confidence: averageConfidence(fields) }
          : s,
      ),
    );
    setSelectedId(null);
  };

  // Dummy re-scan: show "processing" for a moment, then go back to review.
  const handleRescan = (id: string) => {
    setScans((prev) => prev.map((s) => (s.id === id ? { ...s, status: "processing", error: undefined } : s)));
    setSelectedId(null);
    const t = window.setTimeout(() => {
      setScans((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const fields = s.fields.length ? s.fields : DUMMY_SCANS[0].fields;
          return { ...s, status: "needs_review", fields, confidence: averageConfidence(fields) };
        }),
      );
    }, 2000);
    timers.current.push(t);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <ScanLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight">OCR</h1>
          <p className="text-sm text-muted-foreground">Read candidate documents and review the details before saving.</p>
        </div>
      </div>

      <OcrStats scans={scans} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="scans">
            Scans{needsReview > 0 && <span className="ml-2 rounded-full bg-amber-100 px-1.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">{needsReview}</span>}
          </TabsTrigger>
          <TabsTrigger value="new">New scan</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="scans" className="mt-4">
          <ScanTable scans={scans} onSelect={setSelectedId} />
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <UploadPanel onScanned={handleScanned} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <OcrSettings />
        </TabsContent>
      </Tabs>

      <ReviewSheet
        scan={selected}
        onClose={() => setSelectedId(null)}
        onApprove={handleApprove}
        onRescan={handleRescan}
      />
    </div>
  );
}
