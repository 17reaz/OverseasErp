// src/modules/erp/settings/components/import-data-card.tsx

import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, Upload, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "@/components/shared/toast/toast";

import { uploadAndValidateImport } from "../data-management-service";
import {
  IMPORT_TYPE_LABELS,
  type ConflictStrategy,
  type ImportJob,
  type ImportType,
} from "../data-management-types";

import { ImportPreviewSheet } from "./import-preview-sheet";

const IMPORT_TYPES: ImportType[] = [
  "candidates",
  "agents",
  "agencies",
  "medical",
  "mofa",
  "visa",
  "flight",
];

const CONFLICT_STRATEGIES: {
  value: ConflictStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: "skip",
    label: "Skip existing",
    description: "Leave existing matching records untouched.",
  },
  {
    value: "update",
    label: "Update existing",
    description: "Overwrite existing matching records with file data.",
  },
  {
    value: "error",
    label: "Error on duplicate",
    description: "Flag any row that matches an existing record.",
  },
];

interface ImportDataCardProps {
  onImported?: () => void;
}

export function ImportDataCard({ onImported }: ImportDataCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importType, setImportType] = useState<ImportType>("candidates");
  const [conflictStrategy, setConflictStrategy] =
    useState<ConflictStrategy>("skip");

  const [uploading, setUploading] = useState(false);
  const [previewJob, setPreviewJob] = useState<ImportJob | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);

    try {
      const job = await uploadAndValidateImport(
        file,
        importType,
        conflictStrategy,
      );

      setPreviewJob(job);
      setPreviewOpen(true);

      if (job.status === "failed") {
        toast.error(
          "Import validation failed.",
          job.error_message ?? "The file could not be processed.",
        );
      } else {
        toast.info(
          "File validated.",
          `${job.valid_rows} of ${job.total_rows} row(s) are valid — review before committing.`,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to upload and validate the file.",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UploadCloud className="size-4" />
          Import Data
        </CardTitle>

        <CardDescription>
          Upload an Excel (.xlsx) file. Nothing is written to the
          database until you review the preview and explicitly commit.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Data type</Label>

            <Select
              value={importType}
              onValueChange={(value) => setImportType(value as ImportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {IMPORT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {IMPORT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>If a record already exists</Label>

            <Select
              value={conflictStrategy}
              onValueChange={(value) =>
                setConflictStrategy(value as ConflictStrategy)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {CONFLICT_STRATEGIES.map((strategy) => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {
                CONFLICT_STRATEGIES.find((s) => s.value === conflictStrategy)
                  ?.description
              }
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileSelected}
        />

        <Button
          type="button"
          onClick={handlePickFile}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Upload className="mr-2 size-4" />
          )}
          {uploading ? "Uploading..." : "Choose File"}
        </Button>
      </CardContent>

      <ImportPreviewSheet
        job={previewJob}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onCommitted={() => {
          onImported?.();
        }}
      />
    </Card>
  );
}
