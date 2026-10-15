import { useEffect, useState } from "react";
import {
  Check,
  Clipboard,
  FileText,
  Loader2,
  ScanLine,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { GlobalDocumentResult } from "./global-document-service";
import { setGlobalDocumentPrefill } from "./global-document-prefill";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  extractGlobalDocument,
  suggestGlobalDocumentType,
  type GlobalDocumentType,
   type GlobalDocumentResult,
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

const FILE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf";

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
    const navigate = useNavigate();
const [extractedResult, setExtractedResult] =
  useState<GlobalDocumentResult | null>(null);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [busy, setBusy] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [classificationReason, setClassificationReason] =
    useState("");
  const [completed, setCompleted] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // UI-only state: which panel is visible on small screens, and drag highlight.
  const [panel, setPanel] = useState<"source" | "fields">("source");
  const [dragging, setDragging] = useState(false);

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
    // Escape is handled by the Dialog itself.
    function handleKeyboard(event: KeyboardEvent) {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () =>
      window.removeEventListener("keydown", handleKeyboard);
  }, []);

  function resetWorkspace() {
    setExtractedResult(null);
    setFile(null);
    setFields([]);
    setNotice("");
    setError("");
    setClassificationReason("");
    setCompleted(false);
    setBusy(false);
    setClassifying(false);
    setWarnings([]);
    setPanel("source");
  }

  async function selectFile(nextFile?: File) {
    setExtractedResult(null);
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
      setExtractedResult(result);
      setFields(result.fields);
      setWarnings(result.warnings);
      setCompleted(true);
      setPanel("fields");

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

function sendToCandidateRegistration() {
  if (!file || !extractedResult) {
    setError("First extract a document before continuing.");
    return;
  }

  // Use the reviewed values, not the original unedited OCR values.
  const reviewedData: Record<string, unknown> = {
    ...extractedResult.raw,
    ...Object.fromEntries(
      fields.map((field) => [field.key, field.value]),
    ),
  };

  setGlobalDocumentPrefill({
    docType: extractedResult.docType,
    data: reviewedData,
    file,
  });

  setOpen(false);
  navigate("/app/candidates/new");
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

  const selectedDoc = DOCUMENTS.find((item) => item.value === docType);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title="Scan a document (Ctrl+Shift+O)"
        aria-label="Scan a document"
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 size-11 rounded-full bg-background shadow-md"
      >
        <ScanLine className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-dvh w-full max-w-none flex-col gap-0 rounded-none p-0 sm:h-[90dvh] sm:max-w-5xl sm:rounded-lg">
          <DialogHeader className="border-b px-4 py-3 pr-12 text-left sm:px-6">
            <DialogTitle>Scan a document</DialogTitle>
            <DialogDescription>
              Upload a file, check its type, then review the fields.
            </DialogDescription>
          </DialogHeader>

          {/* Panel switch, small screens only */}
          <div className="border-b px-4 py-2 lg:hidden">
            <Tabs
              value={panel}
              onValueChange={(value) =>
                setPanel(value as "source" | "fields")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="source">Document</TabsTrigger>
                <TabsTrigger value="fields">
                  Fields
                  {fields.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1.5 py-0 text-[10px]"
                    >
                      {fields.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-2">
            {/* Source document */}
            <section
              className={cn(
                "min-h-0 flex-col bg-muted/30 lg:flex lg:border-r",
                panel === "source" ? "flex" : "hidden",
              )}
            >
              {!file ? (
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void selectFile(event.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "m-4 flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-background px-6 text-center transition-colors",
                    "hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring",
                    dragging && "border-primary bg-muted/50",
                  )}
                >
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Choose a document
                  </span>
                  <span className="max-w-xs text-xs text-muted-foreground">
                    or drop it here. Passport image, Medical PDF, MOFA
                    PDF or image, Saudi Visa PDF.
                  </span>
                  <input
                    type="file"
                    accept={FILE_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      void selectFile(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              ) : (
                <>
                  <div className="m-4 mb-0 flex items-center gap-3 rounded-lg border bg-background p-3">
                    <FileText className="size-5 shrink-0 text-muted-foreground" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                    >
                      <label>
                        Replace
                        <input
                          type="file"
                          accept={FILE_ACCEPT}
                          className="sr-only"
                          onChange={(event) => {
                            void selectFile(
                              event.currentTarget.files?.[0],
                            );
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetWorkspace}
                    >
                      Remove
                    </Button>
                  </div>

                  {classificationReason && (
                    <p className="mx-4 mt-2 text-xs text-muted-foreground">
                      {classifying
                        ? "Identifying document…"
                        : classificationReason}
                    </p>
                  )}

                  <div className="m-4 min-h-0 flex-1 overflow-hidden rounded-lg border bg-background">
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
            </section>

            {/* Extracted fields */}
            <section
              className={cn(
                "min-h-0 flex-col lg:flex",
                panel === "fields" ? "flex" : "hidden",
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">
                    Extracted fields
                  </h3>
                  {completed && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="size-3" />
                      {fields.length}
                    </Badge>
                  )}
                </div>

                {fields.length > 0 && (
                  <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyResults()}
                  >
                    <Clipboard className="size-4" />
                    Copy JSON
                  </Button>
                  
<button
  type="button"
  onClick={sendToCandidateRegistration}
  disabled={!completed || !extractedResult}
  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
>
  Use in Registration
</button>

                  </div>
                )}
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-4 p-4 sm:p-5">
                  {warnings.length > 0 && (
                    <Alert>
                      <AlertTitle>Please review</AlertTitle>
                      <AlertDescription>
                        <ul className="list-inside list-disc space-y-1">
                          {warnings.map((warning, index) => (
                            <li key={`${index}-${warning}`}>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {fields.length === 0 ? (
                    <div className="flex min-h-56 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-6 text-center">
                      <FileText className="mb-2 size-5 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Nothing extracted yet
                      </p>
                      <p className="max-w-xs text-xs text-muted-foreground">
                        Choose a file, pick its type, then tap Extract.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <Label
                            htmlFor={`field-${field.key}`}
                            className="text-xs text-muted-foreground"
                          >
                            {field.label}
                          </Label>
                          <Input
                            id={`field-${field.key}`}
                            value={field.value}
                            placeholder="Not found"
                            aria-invalid={!field.value.trim()}
                            onChange={(event) =>
                              updateField(field.key, event.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="border-t pt-4 text-xs text-muted-foreground">
                    This workspace only extracts and reviews data. It
                    does not create or update candidates, Medical, MOFA
                    or Visa records.
                  </p>
                </div>
              </ScrollArea>
            </section>
          </div>

          {/* Always-visible action bar */}
          <div className="space-y-2 border-t bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              notice && (
                <p className="text-xs text-muted-foreground">{notice}</p>
              )
            )}

            <div className="flex items-center gap-2">
              <Select
                value={docType}
                onValueChange={(value) => {
                  setDocType(value as GlobalDocumentType);
                  setFields([]);
                  setWarnings([]);
                  setCompleted(false);
                  setError("");
                  setNotice("");
                }}
              >
                <SelectTrigger
                  className="w-full flex-1 sm:max-w-xs"
                  aria-label="Document type"
                >
                  <SelectValue>{selectedDoc?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENTS.map((document) => (
                    <SelectItem key={document.value} value={document.value}>
                      <div className="flex flex-col text-left">
                        <span>{document.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {document.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={() => void runExtraction()}
                disabled={!file || busy || classifying}
                className="shrink-0"
              >
                {busy || classifying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ScanLine className="size-4" />
                )}
                {classifying
                  ? "Identifying…"
                  : busy
                    ? "Extracting…"
                    : "Extract"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
