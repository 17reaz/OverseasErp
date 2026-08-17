import {
  FileText,
  Loader2,
  Upload,
} from "lucide-react";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { uploadCandidatePassport } from "./candidate-files-service";

interface CandidatePassportUploadProps {
  tenantId: string;
  candidateId: string;
  candidateSl: number;
  candidateName: string;
  passportNo: string;
  onSuccess?: () => void;
}

export function CandidatePassportUpload({
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  onSuccess,
}: CandidatePassportUploadProps) {
  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleUpload() {
    if (!file) {
      setError("Please select a passport file.");
      return;
    }

    if (!tenantId) {
      setError("Tenant information is missing.");
      return;
    }

    if (!candidateId) {
      setError("Candidate information is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await uploadCandidatePassport({
        tenantId,
        candidateId,
        candidateSl,
        candidateName,
        passportNo,
        file,
      });

      setFile(null);

      setSuccess(
        "Passport uploaded successfully.",
      );

      onSuccess?.();
    } catch (error) {
      console.error(
        "Failed to upload passport:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload passport.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Passport
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Error */}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Success */}

        {success && (
          <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
            {success}
          </div>
        )}

        {/* Current candidate */}

        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                {candidateName}
              </p>

              <p className="text-xs text-muted-foreground">
                Passport: {passportNo}
              </p>
            </div>
          </div>
        </div>

        {/* File */}

        <div className="space-y-2">
          <Label htmlFor="passport-file">
            Passport File
          </Label>

          <Input
            id="passport-file"
            type="file"
            accept="image/*,.pdf"
            disabled={loading}
            onChange={(event) => {
              const selectedFile =
                event.target.files?.[0] ?? null;

              setFile(selectedFile);
              setError("");
              setSuccess("");
            }}
          />

          <p className="text-xs text-muted-foreground">
            JPG, PNG or PDF
          </p>
        </div>

        {/* Selected file */}

        {file && (
          <div className="rounded-md border px-3 py-2 text-sm">
            Selected:
            <span className="ml-1 font-medium">
              {file.name}
            </span>
          </div>
        )}

        {/* Upload */}

        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )}

            {loading
              ? "Uploading..."
              : "Upload Passport"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}