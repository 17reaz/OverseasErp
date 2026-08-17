import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { uploadFile } from "./files-service";

import type { DocumentType } from "./types";

interface FileUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  tenantId: string;

  candidateId?: string;
  candidateSl?: number;
  candidateName?: string;
  passportNo?: string;

  onSuccess?: () => void;
}

export function FileUploadSheet({
  open,
  onOpenChange,
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  onSuccess,
}: FileUploadSheetProps) {
  const [docType, setDocType] =
    useState<DocumentType>("passport");

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function resetForm() {
    setDocType("passport");
    setFile(null);
    setError("");
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen && !loading) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  async function handleUpload() {
    setError("");

    if (!tenantId) {
      setError(
        "Tenant information is missing.",
      );
      return;
    }

    if (!candidateId) {
      setError(
        "Candidate information is missing.",
      );
      return;
    }

    if (!candidateSl) {
      setError(
        "Candidate SL is missing.",
      );
      return;
    }

    if (!candidateName?.trim()) {
      setError(
        "Candidate name is missing.",
      );
      return;
    }

    if (!passportNo?.trim()) {
      setError(
        "Passport number is missing.",
      );
      return;
    }

    if (!file) {
      setError(
        "Please select a file.",
      );
      return;
    }

    try {
      setLoading(true);

      await uploadFile({
        tenantId,
        candidateId,
        candidateSl,
        candidateName,
        passportNo,
        docType,
        file,
      });

      resetForm();

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(
        "Failed to upload file:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload file.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleClose}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>
            Upload Document
          </SheetTitle>

          <SheetDescription>
            Upload and manage candidate
            documents.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          {/* Error */}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Document Type */}

          <div className="space-y-2">
            <Label>
              Document Type
            </Label>

            <Select
              value={docType}
              onValueChange={(value) =>
                setDocType(
                  value as DocumentType,
                )
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="passport">
                  Passport
                </SelectItem>

                <SelectItem value="photo">
                  Photo
                </SelectItem>

                <SelectItem value="medical">
                  Medical
                </SelectItem>

                <SelectItem value="mofa">
                  MOFA
                </SelectItem>

                <SelectItem value="visa">
                  Visa
                </SelectItem>

                <SelectItem value="contract">
                  Contract
                </SelectItem>

                <SelectItem value="other">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Candidate Information */}

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Candidate
              </p>

              <p className="font-medium">
                {candidateName || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Passport No
              </p>

              <p className="font-medium">
                {passportNo || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Candidate SL
              </p>

              <p className="font-medium">
                {candidateSl || "-"}
              </p>
            </div>
          </div>

          {/* File */}

          <div className="space-y-2">
            <Label htmlFor="document-file">
              Select File
            </Label>

            <Input
              id="document-file"
              type="file"
              accept="image/*,.pdf"
              disabled={loading}
              onChange={(event) => {
                const selectedFile =
                  event.target.files?.[0] ??
                  null;

                setFile(selectedFile);
                setError("");
              }}
            />

            <p className="text-xs text-muted-foreground">
              PDF, JPG, JPEG or PNG
            </p>
          </div>

          {/* Selected File */}

          {file && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Selected file
              </p>

              <p className="mt-1 truncate text-sm font-medium">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(
                  2,
                )}{" "}
                MB
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="px-4">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() =>
              handleClose(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={
              loading || !file
            }
            onClick={handleUpload}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )}

            {loading
              ? "Uploading..."
              : "Upload"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}