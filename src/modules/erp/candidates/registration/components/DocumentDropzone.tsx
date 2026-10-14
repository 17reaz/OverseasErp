import { useRef, useState } from "react";
import {
  Check,
  Loader2,
  RefreshCw,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { ScanState } from "../types";
import { formatSize } from "../utils/registration-utils";
import { DocumentPreviewPanel } from "./DocumentPreviewPanel";
export function DocumentDropzone({
   title,
  hint,
  icon: Icon,
  scan,
  file,
  disabled,
  previewUrl,
  previewFileName,
  compact,
  onFile,
}: {
  title: string;
  hint: string;
  icon: LucideIcon;
  scan: ScanState;
  file?: File | null;
  disabled?: boolean;
  previewUrl?: string | null;
previewFileName?: string;
  compact?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [compareOpen, setCompareOpen] = useState(true);
  const scanning = scan.status === "scanning";
  const done = scan.status === "done";
  const locked = !!disabled || scanning;
  // const [previewOpen, setPreviewOpen] = useState(false);
  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!locked) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!locked) handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-lg border border-dashed p-4 transition-colors",
        dragging && "border-primary bg-primary/5",
        done && "border-primary/40 bg-muted/30",
        disabled && !done && "opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              done
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {done ? (
              <Check className="h-4 w-4" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {done || scanning ? scan.fileName : hint}
            </p>
          </div>
        </div>

        {done && (
          <Badge variant="secondary" className="shrink-0">
            {scan.confidence == null
              ? "Read complete"
              : `${scan.confidence}% match`}
          </Badge>
        )}
      </div>

      {scan.status === "idle" && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Drop a file here or choose one · JPG, PNG, PDF · max 10 MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={locked}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            Upload {title}
          </Button>
        </div>
      )}

      {scanning && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reading document…
          </div>
          <Progress value={scan.progress} className="h-1.5" />
        </div>
      )}

      {done && (
        <div className="mt-3 space-y-3">
          <dl
            className={cn(
              "grid gap-x-4 gap-y-1.5 text-sm",
              compact ? "grid-cols-1 text-xs" : "sm:grid-cols-2",
            )}
          >
            {scan.fields?.map((item) => (
              <div key={item.label} className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-muted-foreground">
                  {item.label}:
                </dt>
                <dd className="min-w-0 truncate font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatSize(scan.fileSize)} · Data added to the form
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={locked}
              onClick={() => inputRef.current?.click()}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Replace
            </Button>
          </div>
        </div>
      )}
   {(file || previewUrl) && (
  <div className="mt-3 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {previewUrl && (
          <Badge variant="secondary">Old · Saved</Badge>
        )}
        {file && (
          <Badge variant="default">New · Uploaded</Badge>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setCompareOpen((open) => !open)}
      >
        {compareOpen ? "Hide comparison" : "Compare files"}
      </Button>
    </div>

    {compareOpen && (
      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
        {previewUrl && (
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">
              Old Visa · Cloud file
            </p>

            <DocumentPreviewPanel
              file={null}
              sourceUrl={previewUrl}
              fileName={previewFileName}
              title="Previously saved Visa"
              className="h-[28rem]"
            />
          </div>
        )}

        {file && (
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">
              New Visa · Selected file
            </p>

            <DocumentPreviewPanel
              file={file}
              title="Newly uploaded Visa"
              className="h-[28rem]"
            />
          </div>
        )}
      </div>
    )}
  </div>
)}
    </div>
  );
}
