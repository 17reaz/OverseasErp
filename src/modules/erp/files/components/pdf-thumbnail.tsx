import { useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

/* =========================================================
 * CONFIG
 * ========================================================= */

const THUMB_WIDTH = 280; // CSS px; dpr diye multiply hoy
const MAX_CACHE = 60;
const MAX_CONCURRENT = 2;

/* =========================================================
 * CACHE + QUEUE (module level, sob component share kore)
 * ========================================================= */

const cache = new Map<string, string>(); // key -> blob URL
const inflight = new Map<string, Promise<string>>();

let active = 0;
const waiting: Array<() => void> = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

function remember(key: string, objectUrl: string) {
  cache.set(key, objectUrl);

  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      const old = cache.get(oldest);
      if (old) URL.revokeObjectURL(old);
      cache.delete(oldest);
    }
  }
}

/* =========================================================
 * THUMBNAIL GENERATOR
 * ========================================================= */

async function createThumbnail(
  url: string,
  withCredentials: boolean,
): Promise<string> {
  // Choto PDF, tai pura download kore pdf.js ke data dei (range/CORS jhamela nai)
  const res = await fetch(url, {
    credentials: withCredentials ? "include" : "same-origin",
  });
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`);

  const data = new Uint8Array(await res.arrayBuffer());
  const loadingTask = getDocument({ data });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const base = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({
      scale: (THUMB_WIDTH * dpr) / base.width,
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported.");

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Could not create thumbnail.")),
        "image/jpeg",
        0.82,
      );
    });

    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;

    return URL.createObjectURL(blob);
  } finally {
    // cancel hok ba fail, pdf/worker memory sob somoy chere dey
    await loadingTask.destroy();
  }
}

function getThumbnail(
  key: string,
  url: string,
  withCredentials: boolean,
): Promise<string> {
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);

  const running = inflight.get(key);
  if (running) return running;

  const promise = withSlot(() => createThumbnail(url, withCredentials))
    .then((objectUrl) => {
      remember(key, objectUrl);
      return objectUrl;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

interface PdfThumbnailProps {
  url: string;
  /** Stable key (e.g. file_location). Signed URL protibar bodlay, tai cache er jonno eta dorkar */
  cacheKey?: string;
  title: string;
  withCredentials?: boolean;
  /** cover = WhatsApp style (upor theke crop), contain = pura page */
  fit?: "cover" | "contain";
}

export function PdfThumbnail({
  url,
  cacheKey,
  title,
  withCredentials = false,
  fit = "cover",
}: PdfThumbnailProps) {
  const key = cacheKey ?? url;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    () => cache.get(key) ?? null,
  );
  const [failed, setFailed] = useState(false);

  // Screen e ashle tobei render shuru
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setPreview(cache.get(key) ?? null);
    setFailed(false);

    getThumbnail(key, url, withCredentials)
      .then((objectUrl) => {
        if (!cancelled) setPreview(objectUrl);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("PDF thumbnail failed:", error);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // url ke deliberately deps e rakhini: shudhu key bodlale abar render hobe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, withCredentials, visible]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {preview ? (
        <img
          src={preview}
          alt={title}
          className={`h-full w-full bg-white ${
            fit === "cover" ? "object-cover object-top" : "object-contain"
          }`}
          draggable={false}
        />
      ) : (
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
      )}
    </div>
  );
}