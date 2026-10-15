
import { useEffect, useState, type ChangeEvent } from "react";
import {
  FileSearch,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  ScanLine,
  Upload,
  X,
  Copy,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { classifyDocument } from "@/modules/erp/ocr/new/services/document-classifier";
import { readPassportDocument } from "@/modules/erp/ocr/new/services/passport-ocr-provider";
import { extractWafidMedical } from "@/modules/erp/ocr/new/services/wafid-reder";
import { readMofa } from "@/modules/erp/ocr/new/services/mofa-reader";
import { extractKsaVisa } from "@/modules/erp/ocr/new/services/kisa-visa";

type DocumentType = "passport" | "medical" | "mofa" | "visa";

type ExtractedFields = Record<string, string>;

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "medical", label: "Medical / Wafid" },
  { value: "mofa", label: "MOFA" },
  { value: "visa", label: "Saudi Visa" },
];

function toEditableFields(result: unknown): ExtractedFields {
  if (!result || typeof result !== "object") {
    return { result: String(result ?? "") };
  }

  return Object.fromEntries(
    Object.entries(result as Record<string, unknown>)
      .filter(
        ([key]) =>
          !["rawText", "mrz", "warnings", "checks", "reviewFields"].includes(
            key,
          ),
      )
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.join(", ")
          : value == null
            ? ""
            : String(value),
      ]),
  );
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function isPdf(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

export function GlobalDocumentWorkspace() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<DocumentType>("passport");

  const [classificationMessage, setClassificationMessage] = useState("");
  const [fields, setFields] = useState<ExtractedFields>({});
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Ctrl + Shift + O opens the global OCR popup from any mounted page.
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function clearDocument() {
    setFile(null);
    setFields({});
    setRawText("");
    setError("");
    setProgress(0);
    setClassificationMessage("");
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    if (!isPdf(selectedFile) && !isImage(selectedFile)) {
      setError("শুধু PDF, JPG অথবা PNG file upload করো।");
      return;
    }

    clearDocument();
    setFile(selectedFile);

    try {
      const result = await classifyDocument(selectedFile);

      if (result.docType) {
        const supportedType = DOCUMENT_TYPES.some(
          (item) => item.value === result.docType,
        );

        if (supportedType) {
          setDocumentType(result.docType as DocumentType);
        }
      }

      setClassificationMessage(
        `${result.reason} Confidence: ${result.confidence}.`,
      );
    } catch {
      setClassificationMessage(
        "Automatic detection হয়নি। Document type নিজে select করো।",
      );
    }
  }

  async function extractDocumentData() {
    if (!file) {
      setError("প্রথমে একটি document upload করো।");
      return;
    }

    setBusy(true);
    setError("");
    setFields({});
    setRawText("");
    setProgress(5);

    try {
      let result: unknown;

      switch (documentType) {
        case "passport": {
          if (!isImage(file)) {
            throw new Error(
              "বর্তমান Passport OCR service JPG/PNG image নেয়, PDF নয়।",
            );
          }

          const passportResult = await readPassportDocument(
            file,
            (value) => setProgress(value),
          );

          result = passportResult;

          if (passportResult.rawText) {
            setRawText(passportResult.rawText);
          }

          break;
        }

        case "medical": {
          if (!isPdf(file)) {
            throw new Error(
              "বর্তমান Wafid Medical OCR service-এর জন্য PDF file দাও।",
            );
          }

          result = await extractWafidMedical(file);
          break;
        }

        case "mofa": {
          result = await readMofa(file);
          break;
        }

        case "visa": {
          if (!isPdf(file)) {
            throw new Error(
              "বর্তমান Saudi Visa parser-এর জন্য PDF file দাও।",
            );
          }

          result = await extractKsaVisa(file);
          break;
        }
      }

      setFields(toEditableFields(result));
      setProgress(100);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "OCR করা যায়নি। আবার চেষ্টা করো।",
      );
    } finally {
      setBusy(false);
    }
  }

  function updateField(key: string, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            documentType,
            fileName: file?.name ?? "",
            fields,
          },
          null,
          2,
        ),
      );
    } catch {
      setError("Clipboard-এ copy করা যায়নি। Browser permission check করো।");
    }
  }

  return (
    <>
      {/* Floating global launcher */}
      <Button
        type="button"
        size="icon-lg"
        title="Global Document OCR · Ctrl + Shift + O"
        aria-label="Open Global Document OCR"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[80] rounded-full shadow-lg"
      >
        <ScanLine className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[92dvh] w-[96vw] max-w-[1500px] flex-col gap-4 overflow-hidden p-4 sm:p-6">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-5 w-5" />
              Global Document OCR
            </DialogTitle>

            <DialogDescription>
              যেকোনো পেজ থেকে document upload, preview, extract ও review করো।
              এখানে কোনো ERP record auto-save হবে না।
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:overflow-hidden">
            {/* LEFT: FULL DOCUMENT PREVIEW */}
            <section className="flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-xl border bg-muted/20">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  {isPdf(file ?? new File([], "")) ? (
                    <FileText className="h-4 w-4 shrink-0" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0" />
                  )}

                  <span className="truncate">
                    {file?.name ?? "Document preview"}
                  </span>
                </div>

                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={clearDocument}
                    title="Remove document"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-2">
                {!file && (
                  <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed bg-background p-8 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />

                    <span className="text-sm font-medium">
                      PDF অথবা image upload করো
                    </span>

                    <span className="text-xs text-muted-foreground">
                      PDF, JPG, PNG
                    </span>

                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                )}

                {file && previewUrl && isPdf(file) && (
                  <iframe
                    title="Full document preview"
                    src={previewUrl}
                    className="h-full min-h-[420px] w-full rounded-md bg-background"
                  />
                )}

                {file && previewUrl && isImage(file) && (
                  <img
                    src={previewUrl}
                    alt="Uploaded document preview"
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {file && !isPdf(file) && !isImage(file) && (
                  <p className="text-sm text-muted-foreground">
                    এই file format preview করা যাচ্ছে না।
                  </p>
                )}
              </div>

              {file && (
                <div className="shrink-0 border-t p-3">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    Replace document

                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </section>

            {/* RIGHT: OCR EXTRACTION AND REVIEW */}
            <section className="flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-xl border">
              <div className="shrink-0 space-y-3 border-b p-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="global-document-type"
                    className="block text-sm font-medium"
                  >
                    Document type
                  </label>

                  <select
                    id="global-document-type"
                    value={documentType}
                    onChange={(event) =>
                      setDocumentType(event.target.value as DocumentType)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {DOCUMENT_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {classificationMessage && (
                  <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {classificationMessage}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={extractDocumentData}
                  disabled={!file || busy}
                  className="w-full"
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Reading document… {progress}%
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Extract data
                    </>
                  )}
                </Button>

                {busy && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                      }}
                    />
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {Object.keys(fields).length === 0 ? (
                  <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <FileSearch className="h-8 w-8" />

                    <p>Extracted data এখানে দেখা যাবে।</p>

                    <p className="text-xs">
                      Extract করার পর প্রতিটি field edit করতে পারবে।
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        Extracted data
                      </h3>

                      <span className="text-xs text-muted-foreground">
                        {Object.keys(fields).length} fields
                      </span>
                    </div>

                    {Object.entries(fields).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <label
                          htmlFor={`global-ocr-${key}`}
                          className="block text-xs font-medium text-muted-foreground"
                        >
                          {formatLabel(key)}
                        </label>

                        <input
                          id={`global-ocr-${key}`}
                          value={value}
                          onChange={(event) =>
                            updateField(key, event.target.value)
                          }
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyJson}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFields({});
                          setRawText("");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear fields
                      </Button>
                    </div>

                    {rawText && (
                      <details className="rounded-md border p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Passport raw OCR text
                        </summary>

                        <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                          {rawText}
                        </pre>
                      </details>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Review workspace only. এখানে কোনো Candidate, Medical,
                      MOFA অথবা Visa record save করা হয় না।
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
