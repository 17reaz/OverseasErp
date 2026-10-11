import { useEffect, useRef, useState } from "react";
import { averageConfidence, buildFields } from "../data/dummy";
import type { DocType, OcrScan } from "../types";

export type UploadStatus = "uploading" | "reading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface Options {
  /** document type used when it can't be guessed from the file name */
  docType: DocType;
  addScan: (scan: OcrScan) => void;
  updateScan: (id: string, changes: Partial<OcrScan>) => void;
}

const MAX_SIZE = 10 * 1024 * 1024;

const isAccepted = (f: File) =>
  f.type.startsWith("image/") || f.type === "application/pdf" || /\.pdf$/i.test(f.name);

// Dummy detection from the file name. Replace with the real classifier later.
const HINTS: [RegExp, DocType][] = [
  [/pass/i, "passport"],
  [/visa/i, "visa"],
  [/mofa/i, "mofa"],
  [/nid/i, "nid"],
  [/medical|health/i, "medical"],
  [/pcc|police/i, "police_clearance"],
];

const detectDocType = (name: string): DocType | null => HINTS.find(([re]) => re.test(name))?.[1] ?? null;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Drive-style upload: files start uploading as soon as they are added.
 * Each file shows up in the scans list as "processing" right away,
 * then moves to "needs_review" once the (fake) reading is done.
 */
export function useAutoUpload({ docType, addScan, updateScan }: Options) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () =>
      timers.current.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      }),
    [],
  );

  const patchItem = (id: string, changes: Partial<UploadItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));

  const upload = (files: File[]) => {
    files.forEach((file) => {
      const id = `scan-${uid()}`;

      if (!isAccepted(file) || file.size > MAX_SIZE) {
        setItems((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            size: file.size,
            progress: 0,
            status: "error",
            error: "Only JPG, PNG or PDF up to 10 MB",
          },
        ]);
        return;
      }

      const type = detectDocType(file.name) ?? docType;

      setItems((prev) => [...prev, { id, name: file.name, size: file.size, progress: 0, status: "uploading" }]);
      addScan({
        id,
        fileName: file.name,
        docType: type,
        status: "processing",
        confidence: 0,
        candidateName: null,
        uploadedBy: "Admin",
        createdAt: new Date().toISOString(),
        pages: 1,
        fields: [],
      });

      // 1) upload progress
      const interval = window.setInterval(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id && i.status === "uploading"
              ? { ...i, progress: Math.min(100, i.progress + 10 + Math.random() * 15) }
              : i,
          ),
        );
      }, 200);

      // 2) uploaded, now reading text
      const uploaded = window.setTimeout(() => {
        window.clearInterval(interval);
        patchItem(id, { progress: 100, status: "reading" });
      }, 1500 + Math.random() * 800);

      // 3) done, ready for review
      const read = window.setTimeout(() => {
        const fields = buildFields(type, Math.floor(Math.random() * 5));
        updateScan(id, { status: "needs_review", fields, confidence: averageConfidence(fields) });
        patchItem(id, { status: "done" });
      }, 3500 + Math.random() * 1500);

      timers.current.push(interval, uploaded, read);
    });
  };

  /** Remove finished and failed rows from the tray. */
  const dismiss = () =>
    setItems((prev) => prev.filter((i) => i.status === "uploading" || i.status === "reading"));

  return { items, upload, dismiss };
}
