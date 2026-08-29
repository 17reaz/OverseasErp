// src/modules/erp/candidates/components/candidate-passport-dialog.tsx

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getActiveFile,
  getFileUrl,
  uploadFile,
} from "../../files/files-service";
import type { FileRecord } from "../../files/types";

import type { Candidate } from "../candidate-service";

interface CandidatePassportDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidatePassportDialog({
  candidate,
  open,
  onOpenChange,
}: CandidatePassportDialogProps) {
  const [checking, setChecking] = useState(true);
  const [activeFile, setActiveFile] = useState<FileRecord | null>(null);

  const [replacing, setReplacing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Look up the candidate's current active passport whenever the
  // dialog opens for a candidate.
  useEffect(() => {
    if (!open || !candidate) {
      return;
    }

    setChecking(true);
    setError("");
    setReplacing(false);
    setFile(null);

    getActiveFile(candidate.id, "passport")
      .then((result) => setActiveFile(result))
      .catch((err) => {
        console.error("Failed to check passport file:", err);
        setError("Could not check for an existing passport file.");
      })
      .finally(() => setChecking(false));
  }, [open, candidate]);

  async function handleDownload() {
    if (!activeFile) return;

    try {
      setLoading(true);
      setError("");

      const url = await getFileUrl(activeFile.file_location);

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to get passport URL:", err);
      setError("Failed to generate a download link.");
    } finally {
      setLoading(false);
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
      setLoading(true);
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

      // Refresh so the dialog flips back to "download" mode.
      const updated = await getActiveFile(candidate.id, "passport");

      setActiveFile(updated);
      setReplacing(false);
      setFile(null);
    } catch (err) {
      console.error("Failed to upload passport:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload passport.",
      );
    } finally {
      setLoading(false);
    }
  }

  const showUploadForm = !checking && (!activeFile || replacing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passport</DialogTitle>

          <DialogDescription>
            {candidate?.name} · {candidate?.passport_no}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {checking ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : showUploadForm ? (
          /* ===============================================
             NO PASSPORT ON FILE (or replacing) — UPLOAD
             =============================================== */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passport-file">Passport File</Label>

              <Input
                id="passport-file"
                type="file"
                accept="image/*,.pdf"
                disabled={loading}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError("");
                }}
              />

              <p className="text-xs text-muted-foreground">
                JPG, PNG or PDF
              </p>
            </div>

            {file && (
              <div className="rounded-md border px-3 py-2 text-sm">
                Selected: <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>
        ) : (
          /* ===============================================
             PASSPORT ALREADY UPLOADED — DOWNLOAD
             =============================================== */
          <div className="rounded-md border bg-muted/40 p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  Passport · v{activeFile?.version}
                </p>

                <p className="text-xs text-muted-foreground">
                  Uploaded{" "}
                  {activeFile
                    ? new Date(activeFile.created_at).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {!checking && activeFile && !replacing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setReplacing(true)}
              disabled={loading}
            >
              Upload new version
            </Button>
          ) : (
            <span />
          )}

          {showUploadForm ? (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload />
              )}
              {loading ? "Uploading..." : "Upload"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleDownload}
              disabled={loading || checking || !activeFile}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              {loading ? "Preparing..." : "Download"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}