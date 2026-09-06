import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { UniversalSheet } from "../../shared/forms/universal-sheet";

import {
  getActiveFile,
  getFileUrl,
  getFileVersions,
  uploadFile,
} from "../../files/files-service";

import type { FileRecord } from "../../files/types";

import type { Candidate } from "../candidate-service";

interface CandidatePassportDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getFileName(fileLocation: string) {
  const rawName =
    fileLocation.split("/").pop() ?? "passport";

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

function isPdf(fileLocation: string) {
  return /\.pdf$/i.test(fileLocation);
}

function isImage(fileLocation: string) {
  return /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(
    fileLocation,
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function CandidatePassportDialog({
  candidate,
  open,
  onOpenChange,
}: CandidatePassportDialogProps) {
  const [checking, setChecking] = useState(true);

  const [activeFile, setActiveFile] =
    useState<FileRecord | null>(null);

  const [versions, setVersions] = useState<
    FileRecord[]
  >([]);

  const [selectedPreview, setSelectedPreview] =
    useState<FileRecord | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [loadingPreview, setLoadingPreview] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [file, setFile] =
    useState<File | null>(null);

  const [showUpload, setShowUpload] =
    useState(false);

  const [error, setError] = useState("");

  const currentFile =
    selectedPreview ?? activeFile;

  const previewIsPdf = useMemo(
    () =>
      currentFile
        ? isPdf(currentFile.file_location)
        : false,
    [currentFile],
  );

  const previewIsImage = useMemo(
    () =>
      currentFile
        ? isImage(currentFile.file_location)
        : false,
    [currentFile],
  );

  async function loadPassportFiles() {
    if (!candidate) return;

    setChecking(true);
    setError("");

    try {
      const [active, history] =
        await Promise.all([
          getActiveFile(
            candidate.id,
            "passport",
          ),
          getFileVersions(
            candidate.id,
            "passport",
          ),
        ]);

      setActiveFile(active);
      setVersions(history);

      setSelectedPreview(active);
    } catch (err) {
      console.error(
        "Failed to load passport files:",
        err,
      );

      setError(
        "Could not load passport files.",
      );
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!open || !candidate) {
      return;
    }

    setFile(null);
    setShowUpload(false);
    setPreviewUrl(null);
    setSelectedPreview(null);

    void loadPassportFiles();
  }, [open, candidate]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewUrl() {
      if (!selectedPreview) {
        setPreviewUrl(null);
        return;
      }

      setLoadingPreview(true);

      try {
        const url = await getFileUrl(
          selectedPreview.file_location,
        );

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error(
          "Failed to generate preview URL:",
          err,
        );

        if (!cancelled) {
          setPreviewUrl(null);
          setError(
            "Could not generate preview.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreviewUrl();

    return () => {
      cancelled = true;
    };
  }, [selectedPreview]);

  function handleSelectVersion(
    version: FileRecord,
  ) {
    setError("");
    setSelectedPreview(version);
  }
async function handleDownload(
  target: FileRecord | null,
) {
  if (!target) return;

  try {
    setError("");

    const url = await getFileUrl(
      target.file_location,
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Failed to download file.",
      );
    }

    const blob = await response.blob();

    const blobUrl =
      window.URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = blobUrl;
    anchor.download =
      getFileName(target.file_location);

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error(
      "Failed to download passport:",
      err,
    );

    setError(
      "Failed to download passport.",
    );
  }
}

  async function handleUpload() {
    if (!candidate) return;

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (!candidate.sl) {
      setError("Candidate SL is missing.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadFile({
        tenantId: candidate.tenant_id,
        candidateId: candidate.id,
        candidateSl: candidate.sl,
        candidateName: candidate.name,
        passportNo: candidate.passport_no,
        docType: "passport",
        file,
      });

      setFile(null);
      setShowUpload(false);

      await loadPassportFiles();
    } catch (err) {
      console.error(
        "Failed to upload passport:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload passport.",
      );
    } finally {
      setUploading(false);
    }
  }

  function renderPreview() {
    if (checking) {
      return (
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border bg-muted/20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!currentFile) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground" />

          <p className="text-sm font-medium">
            No passport uploaded
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Upload a passport to see the
            preview here.
          </p>
        </div>
      );
    }

    if (loadingPreview) {
      return (
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border bg-muted/20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-muted/20 px-6 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground" />

          <p className="text-sm font-medium">
            Preview unavailable
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            You can still download this file.
          </p>
        </div>
      );
    }

    if (previewIsPdf) {
      return (
        <div className="overflow-hidden rounded-lg border bg-muted/20">
          <iframe
            src={previewUrl}
            title="Passport preview"
            className="h-[360px] w-full"
          />
        </div>
      );
    }

    if (previewIsImage) {
      return (
        <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-3">
          <img
            src={previewUrl}
            alt="Passport preview"
            className="max-h-[360px] max-w-full rounded-md object-contain"
          />
        </div>
      );
    }

    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-muted/20 px-6 text-center">
        <FileText className="mb-3 h-8 w-8 text-muted-foreground" />

        <p className="text-sm font-medium">
          Preview not supported
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Download the file to view it.
        </p>
      </div>
    );
  }

  const footer = (
    <div className="flex w-full items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError("");
          setShowUpload((value) => !value);
        }}
        disabled={uploading}
      >
        {showUpload ? (
          <>
            <X />
            Cancel
          </>
        ) : (
          <>
            <Upload />
            Upload New Version
          </>
        )}
      </Button>

      <Button
        type="button"
        onClick={() =>
          void handleDownload(
            activeFile,
          )
        }
        disabled={
          uploading || !activeFile
        }
      >
        <Download />
        Download
      </Button>
    </div>
  );

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Passport"
      description={
        candidate
          ? `${candidate.name} · ${candidate.passport_no}`
          : undefined
      }
      loading={uploading}
      footer={footer}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">
                Passport Preview
              </h3>

              {currentFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Version {currentFile.version}
                </p>
              )}
            </div>

            {currentFile?.is_active && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-1 text-xs font-medium">
                <Check className="h-3 w-3" />
                Current
              </span>
            )}
          </div>

          {renderPreview()}

          {currentFile && (
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {getFileName(
                    currentFile.file_location,
                  )}
                </p>

                <p>
                  Uploaded{" "}
                  {formatDate(
                    currentFile.created_at,
                  )}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  void handleDownload(
                    currentFile,
                  )
                }
              >
                <Download />
                Download
              </Button>
            </div>
          )}
        </section>

        {/* Upload */}
        {showUpload && (
          <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-medium">
                Upload New Version
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                The existing passport will remain
                in history.
              </p>
            </div>

            <Input
              type="file"
              accept="image/*,.pdf"
              disabled={uploading}
              onChange={(event) => {
                setFile(
                  event.target.files?.[0] ??
                    null,
                );
                setError("");
              }}
            />

            {file && (
              <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  {file.type ===
                  "application/pdf" ? (
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}

                  <span className="truncate text-sm">
                    {file.name}
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void handleUpload()
                  }
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload />
                  )}

                  {uploading
                    ? "Uploading..."
                    : "Upload"}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Version History */}
        {!checking &&
          versions.length > 0 && (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">
                  Previous Versions
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  All uploaded passport versions.
                </p>
              </div>

              <div className="divide-y rounded-lg border">
                {versions.map((version) => {
                  const selected =
                    selectedPreview?.id ===
                    version.id;

                  return (
                    <div
                      key={version.id}
                      className="flex items-center justify-between gap-3 px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          {isPdf(
                            version.file_location,
                          ) ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              v{version.version}
                            </p>

                            {version.is_active && (
                              <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="truncate text-xs text-muted-foreground">
                            {getFileName(
                              version.file_location,
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatDate(
                              version.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant={
                            selected
                              ? "secondary"
                              : "ghost"
                          }
                          size="sm"
                          onClick={() =>
                            handleSelectVersion(
                              version,
                            )
                          }
                        >
                          Preview
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            void handleDownload(
                              version,
                            )
                          }
                          aria-label={`Download passport version ${version.version}`}
                        >
                          <Download />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
      </div>
    </UniversalSheet>
  );
}
