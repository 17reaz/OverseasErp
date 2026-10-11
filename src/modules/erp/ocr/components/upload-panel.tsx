import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DOC_TYPES, DOC_TYPE_LABEL, DUMMY_CANDIDATES, averageConfidence, buildFields } from "../data/dummy";
import type { DocType, OcrScan } from "../types";

interface QueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  done: boolean;
}

interface Props {
  onScanned: (scan: OcrScan) => void;
}

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function UploadPanel({ onScanned }: Props) {
  const [docType, setDocType] = useState<DocType>("passport");
  const [candidate, setCandidate] = useState<string>("none");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearInterval(t)), []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      done: false,
    }));
    setQueue((q) => [...q, ...next]);
  };

  const remove = (id: string) => setQueue((q) => q.filter((i) => i.id !== id));

  // Dummy scan: fake progress, then push a fake result to the parent.
  const startScan = () => {
    const pending = queue.filter((i) => !i.done);
    if (!pending.length) return;
    setRunning(true);
    let finished = 0;

    pending.forEach((item) => {
      const timer = window.setInterval(() => {
        setQueue((q) =>
          q.map((i) =>
            i.id === item.id ? { ...i, progress: Math.min(100, i.progress + 8 + Math.random() * 12) } : i,
          ),
        );
      }, 250);
      timers.current.push(timer);

      window.setTimeout(() => {
        window.clearInterval(timer);
        setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 100, done: true } : i)));
        const fields = buildFields(docType, Math.floor(Math.random() * 5));
        onScanned({
          id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          fileName: item.name,
          docType,
          status: "needs_review",
          confidence: averageConfidence(fields),
          candidateName: candidate === "none" ? null : candidate,
          uploadedBy: "Admin",
          createdAt: new Date().toISOString(),
          pages: 1,
          fields,
        });
        finished += 1;
        if (finished === pending.length) setRunning(false);
      }, 2200 + Math.random() * 1200);
    });
  };

  const pendingCount = queue.filter((i) => !i.done).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload documents</CardTitle>
          <CardDescription>JPG, PNG or PDF, up to 10 MB each. You can add several files at once.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
            )}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground">Text is read automatically after upload</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {queue.length > 0 && (
            <ul className="space-y-2">
              {queue.map((item) => (
                <li key={item.id} className="rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
                    </div>
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : running ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {(running || item.done) && <Progress value={item.progress} className="mt-2 h-1.5" />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Scan settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {DOC_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Link to candidate</Label>
            <Select value={candidate} onValueChange={setCandidate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Decide later</SelectItem>
                {DUMMY_CANDIDATES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" disabled={!pendingCount || running} onClick={startScan}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
              </>
            ) : (
              `Scan ${pendingCount || ""} ${pendingCount === 1 ? "file" : "files"}`.replace("  ", " ")
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
