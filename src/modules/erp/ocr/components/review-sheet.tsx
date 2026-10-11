import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DOC_TYPE_LABEL, DUMMY_CANDIDATES } from "../data/dummy";
import type { ExtractedField, OcrScan } from "../types";
import { ConfidenceText, StatusBadge } from "./status-badge";

interface Props {
  scan: OcrScan | null;
  onClose: () => void;
  onApprove: (id: string, fields: ExtractedField[], candidateName: string | null) => void;
  onRescan: (id: string) => void;
}

const LOW_CONFIDENCE = 75;

export function ReviewSheet({ scan, onClose, onApprove, onRescan }: Props) {
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [candidate, setCandidate] = useState("none");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!scan) return;
    setFields(scan.fields);
    setCandidate(scan.candidateName ?? "none");
    setActiveKey(null);
  }, [scan]);

  const update = (key: string, value: string) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, value } : f)));

  const lowCount = fields.filter((f) => f.confidence < LOW_CONFIDENCE).length;
  const readOnly = scan?.status === "approved";

  return (
    <Sheet open={!!scan} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        {scan && (
          <>
            <SheetHeader className="border-b p-6">
              <div className="flex items-center gap-2">
                <SheetTitle>{scan.fileName}</SheetTitle>
                <StatusBadge status={scan.status} />
              </div>
              <SheetDescription>
                {DOC_TYPE_LABEL[scan.docType]} - {scan.pages} {scan.pages === 1 ? "page" : "pages"}
              </SheetDescription>
            </SheetHeader>

            {scan.status === "failed" ? (
              <div className="space-y-4 p-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Could not read this document</AlertTitle>
                  <AlertDescription>{scan.error}</AlertDescription>
                </Alert>
                <Button onClick={() => onRescan(scan.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Scan again
                </Button>
              </div>
            ) : (
              <div className="grid flex-1 gap-6 p-6 md:grid-cols-2">
                {/* Dummy document preview. Each extracted field is drawn as a row; the active one is highlighted. */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Original</p>
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                    <div className="mb-3 h-3 w-1/2 rounded bg-muted-foreground/20" />
                    {fields.map((f) => (
                      <div
                        key={f.key}
                        className={cn(
                          "flex items-baseline justify-between gap-3 rounded px-2 py-1.5 text-xs transition-colors",
                          activeKey === f.key
                            ? "bg-primary/10 ring-1 ring-primary"
                            : f.confidence < LOW_CONFIDENCE
                              ? "bg-amber-100/60 dark:bg-amber-950/40"
                              : "bg-transparent",
                        )}
                      >
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-mono">{f.value}</span>
                      </div>
                    ))}
                    <div className="mt-3 space-y-1.5 font-mono text-[10px] leading-tight text-muted-foreground/70">
                      <p>P&lt;BGDUDDIN&lt;&lt;MD&lt;RAHIM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                      <p>A01234567&lt;4BGD9403122M3205318&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placeholder preview. The real image will show here, with the field you edit highlighted.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Extracted details</p>
                    <p className="text-xs text-muted-foreground">
                      Overall <ConfidenceText value={scan.confidence} />
                    </p>
                  </div>

                  {lowCount > 0 && !readOnly && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>
                        {lowCount} {lowCount === 1 ? "field needs" : "fields need"} a check
                      </AlertTitle>
                      <AlertDescription>Fields below {LOW_CONFIDENCE}% are marked in amber.</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
                          <ConfidenceText value={f.confidence} />
                        </div>
                        <Input
                          id={`f-${f.key}`}
                          value={f.value}
                          readOnly={readOnly}
                          onFocus={() => setActiveKey(f.key)}
                          onBlur={() => setActiveKey(null)}
                          onChange={(e) => update(f.key, e.target.value)}
                          className={cn(
                            f.confidence < LOW_CONFIDENCE && "border-amber-400 focus-visible:ring-amber-400",
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 border-t pt-4">
                    <Label>Candidate</Label>
                    <Select value={candidate} onValueChange={setCandidate} disabled={readOnly}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not linked</SelectItem>
                        {DUMMY_CANDIDATES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {scan.status !== "failed" && (
              <SheetFooter className="mt-auto gap-2 border-t p-4 sm:justify-between">
                <Button variant="outline" onClick={() => onRescan(scan.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Scan again
                </Button>
                {!readOnly && (
                  <Button onClick={() => onApprove(scan.id, fields, candidate === "none" ? null : candidate)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve and save
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
