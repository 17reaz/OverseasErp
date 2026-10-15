
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Clipboard,
  FileText,
  LoaderCircle,
  ScanLine,
  Upload,
  X,
} from "lucide-react";

import {
  extractGlobalDocument,
  suggestGlobalDocumentType,
  type GlobalDocumentType,
} from "@/modules/erp/ocr/new/global-document/global-document-service";

type ExtractedField = {
  key: string;
  label: string;
  value: string;
};

const DOCUMENTS: {
  value: GlobalDocumentType;
  label: string;
  description: string;
}[] = [
  {
    value: "passport",
    label: "Passport",
    description: "JPG or PNG image",
  },
  {
    value: "medical",
    label: "Wafid Medical",
    description: "Medical report PDF",
  },
  {
    value: "mofa",
    label: "MOFA",
    description: "PDF or image",
  },
  {
    value: "visa",
    label: "Saudi Visa",
    description: "Visa PDF",
  },
];

function validateGlobalFile(
  docType: GlobalDocumentType,
  file: File,
): string | null {
  const maxSize = 10 * 1024 * 1024;

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  if (file.size > maxSize) {
    return "File size must not exceed 10 MB.";
  }

  const name = file.name.toLowerCase();
  const isPdf =
    file.type === "application/pdf" || name.endsWith(".pdf");
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png)$/i.test(name);

  switch (docType) {
    case "passport":
      if (!isImage) {
        return "Passport requires a JPG or PNG image.";
      }
      break;

    case "medical":
      if (!isPdf) {
        return "Wafid Medical requires a PDF file.";
      }
      break;

    case "mofa":
      if (!isPdf && !isImage) {
        return "MOFA requires a PDF, JPG or PNG file.";
      }
      break;

    case "visa":
      if (!isPdf) {
        return "Saudi Visa requires a PDF file.";
      }
      break;
  }

  return null;
}

export function GlobalDocumentWorkspace() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [docType, setDocType] =
    useState<GlobalDocumentType>("passport");
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [busy, setBusy] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [classificationReason, setClassificationReason] =
    useState("");
  const [completed, setCompleted] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () =>
      window.removeEventListener("keydown", handleKeyboard);
  }, []);

  function resetWorkspace() {
    setFile(null);
    setFields([]);
    setNotice("");
    setError("");
    setClassificationReason("");
    setCompleted(false);
    setBusy(false);
    setClassifying(false);
    setWarnings([]);
  }

  async function selectFile(nextFile?: File) {
    if (!nextFile) return;

    resetWorkspace();
    setFile(nextFile);
    setError("");
    setNotice("");
    setClassifying(true);

    try {
      const result = await suggestGlobalDocumentType(nextFile);

      if (result.docType) {
        setDocType(result.docType);
      }

      setClassificationReason(result.reason);

      setNotice(
        result.docType
          ? `Document type suggested: ${
              DOCUMENTS.find(
                (item) => item.value === result.docType,
              )?.label
            }. Please verify before extracting.`
          : "Document type could not be confirmed. Select the correct type manually.",
      );
    } catch (cause) {
      console.error("Document classification failed:", cause);
      setClassificationReason(
        "Automatic classification was unavailable.",
      );
      setNotice("Select the document type manually.");
    } finally {
      setClassifying(false);
    }
  }

  async function runExtraction() {
    if (!file) {
      setError("First upload a document.");
      return;
    }

    const validationError = validateGlobalFile(docType, file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    setCompleted(false);
    setFields([]);
    setWarnings([]);

    try {
      const result = await extractGlobalDocument(file, docType);

      setFields(result.fields);
      setWarnings(result.warnings);
      setCompleted(true);

      setNotice(
        result.warnings.length > 0
          ? `Extraction completed. ${result.warnings.length} warning(s) need review.`
          : "Extraction completed. Review and edit the fields below.",
      );
    } catch (cause) {
      console.error("Global document extraction failed:", cause);

      setError(
        cause instanceof Error
          ? cause.message
          : "Could not read this document. Try another file.",
      );
    } finally {
      setBusy(false);
    }
  }

  function updateField(key: string, value: string) {
    setFields((current) =>
      current.map((field) =>
        field.key === key ? { ...field, value } : field,
      ),
    );
  }

  async function copyResults() {
    const output = Object.fromEntries(
      fields.map((field) => [field.key, field.value]),
    );

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(output, null, 2),
      );
      setNotice("Extracted data copied as JSON.");
      setError("");
    } catch {
      setError(
        "Clipboard access failed. Please copy the values manually.",
      );
    }
  }

  const isPdf =
    file?.type === "application/pdf" ||
    file?.name.toLowerCase().endsWith(".pdf");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Global Document Workspace (Ctrl+Shift+O)"
        aria-label="Open Document Workspace"
        className="fixed bottom-5 right-5 z-[80] flex h-14 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <ScanLine className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Global Document Workspace"
            className="flex h-[94dvh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <ScanLine className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Global Document Workspace
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload · Extract · Review · Copy
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close workspace"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:overflow-hidden">
              <aside className="flex min-h-[340px] flex-col border-b border-slate-200 bg-slate-50 lg:min-h-0 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Source document
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preview the uploaded file
                    </p>
                  </div>

                  {file && (
                    <button
                      type="button"
                      onClick={resetWorkspace}
                      className="text-xs font-medium text-slate-600 hover:text-red-600"
                    >
                      Remove file
                    </button>
                  )}
                </div>

                {!file ? (
                  <label className="m-4 flex min-h-64 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 text-center transition hover:border-slate-500 hover:bg-slate-50 sm:m-5">
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <Upload className="h-7 w-7" />
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      Choose a document
                    </span>

                    <span className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                      Passport image, Medical PDF, MOFA PDF/image or
                      Saudi Visa PDF
                    </span>

                    <span className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
                      Browse files
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                      className="sr-only"
                      onChange={(event) => {
                        void selectFile(event.currentTarget.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                ) : (
                  <>
                    <div className="mx-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:mx-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Replace
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                          className="sr-only"
                          onChange={(event) => {
                            void selectFile(event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <div className="m-4 min-h-64 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white sm:m-5 lg:min-h-0">
                      {previewUrl && isPdf ? (
                        <iframe
                          title="PDF document preview"
                          src={previewUrl}
                          className="h-full min-h-64 w-full"
                        />
                      ) : previewUrl ? (
                        <div className="flex h-full min-h-64 items-center justify-center overflow-auto p-3">
                          <img
                            src={previewUrl}
                            alt="Uploaded document preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </aside>

              <main className="flex min-h-[420px] flex-col lg:min-h-0">
                <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Extraction settings
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Automatic detection is a suggestion. Confirm the
                      document type.
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={docType}
                      onChange={(event) => {
                        setDocType(
                          event.target.value as GlobalDocumentType,
                        );
                        setFields([]);
                        setWarnings([]);
                        setCompleted(false);
                        setError("");
                        setNotice("");
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-3 pr-10 text-sm font-medium text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      {DOCUMENTS.map((document) => (
                        <option
                          key={document.value}
                          value={document.value}
                        >
                          {document.label} — {document.description}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                  </div>

                  {classificationReason && (
                    <p className="text-xs leading-5 text-slate-500">
                      {classifying
                        ? "Identifying document…"
                        : classificationReason}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void runExtraction()}
                    disabled={!file || busy || classifying}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy || classifying ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <ScanLine className="h-4 w-4" />
                    )}

                    {classifying
                      ? "Identifying document…"
                      : busy
                        ? "Extracting fields…"
                        : "Extract document"}
                  </button>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  )}

                  {notice && !error && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
                      {notice}
                    </div>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Extracted fields
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Edit any value before copying the results.
                      </p>
                    </div>

                    {fields.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void copyResults()}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Clipboard className="h-4 w-4" />
                        Copy JSON
                      </button>
                    )}
                  </div>

                  {warnings.length > 0 && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-amber-900">
                        Please review
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-xs leading-5 text-amber-800">
                        {warnings.map((warning, index) => (
                          <li key={`${index}-${warning}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fields.length === 0 ? (
                    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>

                      <p className="text-sm font-medium text-slate-700">
                        No extracted data yet
                      </p>

                      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                        Upload a file, select its type and run
                        extraction to review the detected fields here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completed && (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                          <Check className="h-4 w-4" />
                          Extraction finished · {fields.length} fields
                        </div>
                      )}

                      {fields.map((field) => (
                        <label key={field.key} className="block">
                          <span className="mb-1.5 block text-xs font-medium text-slate-600">
                            {field.label}
                          </span>

                          <input
                            value={field.value}
                            onChange={(event) =>
                              updateField(field.key, event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                    This workspace only extracts and reviews data. It
                    does not create or update candidates, Medical, MOFA
                    or Visa records.
                  </p>
                </div>
              </main>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
