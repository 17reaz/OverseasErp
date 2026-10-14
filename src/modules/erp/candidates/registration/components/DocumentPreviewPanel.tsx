import { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useFilePreviewUrl } from "../hooks/useFilePreview";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

type PreviewKind = "image" | "pdf" | "other";

function getPreviewKind(
  file: File | null,
  fileName?: string,
): PreviewKind {
  const name = (file?.name ?? fileName ?? "").toLowerCase();

  if (
    file?.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(name)
  ) {
    return "image";
  }

  if (
    file?.type === "application/pdf" ||
    name.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return "other";
}

interface DocumentPreviewPanelProps {
  file: File | null;
  title: string;
  onClose?: () => void;
  className?: string;
  sourceUrl?: string | null;
  fileName?: string;
}

export function DocumentPreviewPanel({
  file,
  title,
  onClose,
  className,
  sourceUrl,
  fileName,
}: DocumentPreviewPanelProps) {
  const localUrl = useFilePreviewUrl(file);
  const url = localUrl ?? sourceUrl ?? null;

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [file, sourceUrl]);

  const kind = file || fileName
    ? getPreviewKind(file, fileName)
    : null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            {(file || fileName) && (
  <p className="truncate text-xs text-muted-foreground">
    {file?.name ?? fileName}
  </p>
)}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {kind === "image" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Zoom out"
                disabled={zoom <= MIN_ZOOM}
                onClick={() =>
                  setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))
                }
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <button
                type="button"
                className="w-12 text-center text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setZoom(1)}
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() =>
                  setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))
                }
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Rotate"
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}

          {url && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Open in new tab"
              asChild
            >
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close preview"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto bg-muted/30">
        {!file || !url ? (
          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            No document selected.
          </div>
        ) : kind === "image" ? (
          <div className="flex min-h-full items-center justify-center p-3">
            <img
              src={url}
              alt={title}
              draggable={false}
              className="h-auto max-w-none select-none transition-transform"
              style={{
                width: `${zoom * 100}%`,
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>
        ) : kind === "pdf" ? (
          <iframe
            src={url}
            title={title}
            className="h-full min-h-96 w-full border-0"
          />
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <p>Preview is not available for this file type.</p>
            <Button variant="outline" size="sm" asChild>
              <a
  href={url}
  download={file?.name ?? fileName ?? "document"}
>
  Download file
</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
