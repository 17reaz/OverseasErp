import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfThumbnailProps {
  url: string;
  title: string;
}

export function PdfThumbnail({ url, title }: PdfThumbnailProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function renderPdf() {
      setPreview(null);
      setFailed(false);

      try {
        const loadingTask = getDocument({ url });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          
          return;
        }

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) throw new Error("Canvas is not supported.");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        if (!cancelled) {
          objectUrl = await new Promise<string>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error("Could not create PDF thumbnail."));
                return;
              }

              resolve(URL.createObjectURL(blob));
            }, "image/jpeg", 0.82);
          });

          if (!cancelled) setPreview(objectUrl);
        }

        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
        
      } catch (error) {
        if (!cancelled) {
          console.error("PDF thumbnail failed:", error);
          setFailed(true);
        }
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (preview) {
    return (
      <img
        src={preview}
        alt={title}
        className="h-full w-full bg-white object-contain"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted">
      {failed ? (
        <FileText className="size-12 text-red-600" />
      ) : (
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      )}

      <span className="text-xs font-medium text-muted-foreground">
        {failed ? "PDF preview unavailable" : "Preparing PDF preview..."}
      </span>
      <span className="max-w-[85%] truncate text-xs text-muted-foreground">
        {title}
      </span>
    </div>
  );
}
