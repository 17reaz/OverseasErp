import { useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Upload,
} from "lucide-react";

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

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { uploadFile } from "./files-service";

import type { DocumentType } from "./types";

interface CandidateInfo {
  id: string;
  sl: number;
  name: string;
  passport_no: string;
}

interface FileUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  tenantId: string;

  candidates: CandidateInfo[];

  onSuccess?: () => void | Promise<void>;
}

export function FileUploadSheet({
  open,
  onOpenChange,
  tenantId,
  candidates,
  onSuccess,
}: FileUploadSheetProps) {
  const [candidateOpen, setCandidateOpen] =
    useState(false);

  const [candidate, setCandidate] =
    useState<CandidateInfo | null>(null);

  const [docType, setDocType] =
    useState<DocumentType>("passport");

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function resetForm() {
    setCandidateOpen(false);
    setCandidate(null);
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

    if (!candidate) {
      setError(
        "Please select a candidate.",
      );
      return;
    }

    if (!candidate.sl) {
      setError(
        "Candidate SL is missing.",
      );
      return;
    }

    if (!candidate.name.trim()) {
      setError(
        "Candidate name is missing.",
      );
      return;
    }

    if (!candidate.passport_no.trim()) {
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
        candidateId: candidate.id,
        candidateSl: candidate.sl,
        candidateName: candidate.name,
        passportNo: candidate.passport_no,
        docType,
        file,
      });

      await onSuccess?.();

      resetForm();

      onOpenChange(false);
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
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>
            Upload Document
          </SheetTitle>

          <SheetDescription>
            Select a candidate and upload
            their document.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          {/* Error */}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Candidate */}

          <div className="space-y-2">
            <Label>
              Candidate
            </Label>

            <Popover
              open={candidateOpen}
              onOpenChange={
                setCandidateOpen
              }
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={
                    candidateOpen
                  }
                  disabled={
                    loading ||
                    candidates.length === 0
                  }
                  className="w-full justify-between"
                >
                  {candidate ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-medium">
                        #{candidate.sl}
                      </span>

                      <span className="truncate">
                        {candidate.name}
                      </span>

                      <span className="truncate text-muted-foreground">
                        ·{" "}
                        {candidate.passport_no}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Search and select candidate...
                    </span>
                  )}

                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
              >
                <Command>
                  <CommandInput
                    placeholder="Search name or passport..."
                  />

                  <CommandList>
                    <CommandEmpty>
                      No candidate found.
                    </CommandEmpty>

                    <CommandGroup>
                      {candidates.map(
                        (item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.sl} ${item.name} ${item.passport_no}`}
                            onSelect={() => {
                              setCandidate(
                                item,
                              );

                              setCandidateOpen(
                                false,
                              );

                              setError("");
                            }}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium">
                                {item.sl}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {item.name}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  Passport:{" "}
                                  {
                                    item.passport_no
                                  }
                                </p>
                              </div>
                            </div>

                            <Check
                              className={
                                candidate?.id ===
                                item.id
                                  ? "ml-2 size-4 opacity-100"
                                  : "ml-2 size-4 opacity-0"
                              }
                            />
                          </CommandItem>
                        ),
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected Candidate */}

          {candidate && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Candidate
                </p>

                <p className="font-medium">
                  {candidate.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Passport No
                </p>

                <p className="font-medium">
                  {candidate.passport_no}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Candidate SL
                </p>

                <p className="font-medium">
                  {candidate.sl}
                </p>
              </div>
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
                {(
                  file.size /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
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
              loading ||
              !candidate ||
              !file
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