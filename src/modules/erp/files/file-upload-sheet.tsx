import { useEffect, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  candidateId?: string | null;
  candidateSl?: number | null;
  candidateName?: string | null;
  passportNo?: string | null;

  onCandidateSelected?: (
    candidate: CandidateInfo,
  ) => void;

  onSuccess?: () => void;
}

export function FileUploadSheet({
  open,
  onOpenChange,
  tenantId,
  candidateId: initialCandidateId,
  candidateSl: initialCandidateSl,
  candidateName: initialCandidateName,
  passportNo: initialPassportNo,
  onCandidateSelected,
  onSuccess,
}: FileUploadSheetProps) {
  /*
   * ==============================
   * STATE
   * ==============================
   */

  const [docType, setDocType] =
    useState<DocumentType>("passport");

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [candidateLoading, setCandidateLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [candidates, setCandidates] =
    useState<CandidateInfo[]>([]);

  const [candidateSelectorOpen, setCandidateSelectorOpen] =
    useState(false);

  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateInfo | null>(
      initialCandidateId
        ? {
            id: initialCandidateId,
            sl: initialCandidateSl ?? 0,
            name: initialCandidateName ?? "",
            passport_no:
              initialPassportNo ?? "",
          }
        : null,
    );

  /*
   * ==============================
   * LOAD CANDIDATES
   * ==============================
   */

  async function loadCandidates() {
    if (!tenantId) {
      return;
    }

    try {
      setCandidateLoading(true);
      setError("");

      const {
        data,
        error: candidateError,
      } = await supabase
        .from("candidates")
        .select(
          "id, sl, name, passport_no",
        )
        .eq(
          "tenant_id",
          tenantId,
        )
        .eq(
          "is_deleted",
          false,
        )
        .order("sl", {
          ascending: true,
        });

      if (candidateError) {
        throw candidateError;
      }

      setCandidates(
        (data ?? []) as CandidateInfo[],
      );
    } catch (error) {
      console.error(
        "Failed to load candidates:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load candidates.",
      );
    } finally {
      setCandidateLoading(false);
    }
  }

  /*
   * Load candidates whenever
   * Sheet opens.
   */

  useEffect(() => {
    if (open) {
      loadCandidates();
    }
  }, [open, tenantId]);

  /*
   * ==============================
   * RESET
   * ==============================
   */

  function resetForm() {
    setDocType("passport");
    setFile(null);
    setError("");
    setCandidateSelectorOpen(false);

    setSelectedCandidate(
      initialCandidateId
        ? {
            id: initialCandidateId,
            sl: initialCandidateSl ?? 0,
            name: initialCandidateName ?? "",
            passport_no:
              initialPassportNo ?? "",
          }
        : null,
    );
  }

  /*
   * ==============================
   * CLOSE SHEET
   * ==============================
   */

  function handleClose(
    nextOpen: boolean,
  ) {
    if (!nextOpen && !loading) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  /*
   * ==============================
   * SELECT CANDIDATE
   * ==============================
   */

  function handleCandidateSelect(
    candidate: CandidateInfo,
  ) {
    setSelectedCandidate(candidate);

    setCandidateSelectorOpen(false);

    setError("");

    /*
     * Inform parent page.
     */
    onCandidateSelected?.(
      candidate,
    );
  }

  /*
   * ==============================
   * UPLOAD
   * ==============================
   */

  async function handleUpload() {
    setError("");

    if (!tenantId) {
      setError(
        "Tenant information is missing.",
      );
      return;
    }

    if (!selectedCandidate) {
      setError(
        "Please select a candidate.",
      );
      return;
    }

    if (!selectedCandidate.id) {
      setError(
        "Candidate information is missing.",
      );
      return;
    }

    if (!selectedCandidate.sl) {
      setError(
        "Candidate SL is missing.",
      );
      return;
    }

    if (!selectedCandidate.name.trim()) {
      setError(
        "Candidate name is missing.",
      );
      return;
    }

    if (
      !selectedCandidate.passport_no.trim()
    ) {
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

        candidateId:
          selectedCandidate.id,

        candidateSl:
          selectedCandidate.sl,

        candidateName:
          selectedCandidate.name,

        passportNo:
          selectedCandidate.passport_no,

        docType,

        file,
      });

      /*
       * Tell parent that upload
       * completed successfully.
       */
      onSuccess?.();

      /*
       * Close sheet.
       */
      onOpenChange(false);

      resetForm();
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

  /*
   * ==============================
   * UI
   * ==============================
   */

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
          {/* ========================
              ERROR
          ========================= */}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ========================
              CANDIDATE SELECTOR
          ========================= */}

          <div className="space-y-2">
            <Label>
              Candidate
            </Label>

            <Popover
              open={
                candidateSelectorOpen
              }
              onOpenChange={
                setCandidateSelectorOpen
              }
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={
                    candidateSelectorOpen
                  }
                  disabled={
                    loading ||
                    candidateLoading
                  }
                  className="w-full justify-between"
                >
                  {selectedCandidate ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-medium">
                        #
                        {
                          selectedCandidate.sl
                        }
                      </span>

                      <span className="truncate">
                        {
                          selectedCandidate.name
                        }
                      </span>

                      <span className="shrink-0 text-muted-foreground">
                        ·{" "}
                        {
                          selectedCandidate.passport_no
                        }
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Search candidate...
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
                    {candidateLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />

                        Loading candidates...
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>
                          No candidates found.
                        </CommandEmpty>

                        <CommandGroup>
                          {candidates.map(
                            (item) => (
                              <CommandItem
                                key={
                                  item.id
                                }
                                value={`${item.name} ${item.passport_no} ${item.sl}`}
                                onSelect={() =>
                                  handleCandidateSelect(
                                    item,
                                  )
                                }
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium">
                                    {
                                      item.sl
                                    }
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-medium">
                                      {
                                        item.name
                                      }
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
                                    selectedCandidate?.id ===
                                    item.id
                                      ? "ml-2 size-4 opacity-100"
                                      : "ml-2 size-4 opacity-0"
                                  }
                                />
                              </CommandItem>
                            ),
                          )}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* ========================
              SELECTED CANDIDATE
          ========================= */}

          {selectedCandidate && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Candidate
                </p>

                <p className="font-medium">
                  {
                    selectedCandidate.name
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Passport No
                </p>

                <p className="font-medium">
                  {
                    selectedCandidate.passport_no
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Candidate SL
                </p>

                <p className="font-medium">
                  {
                    selectedCandidate.sl
                  }
                </p>
              </div>
            </div>
          )}

          {/* ========================
              DOCUMENT TYPE
          ========================= */}

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
              disabled={
                loading ||
                !selectedCandidate
              }
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

          {/* ========================
              FILE SELECT
          ========================= */}

          <div className="space-y-2">
            <Label htmlFor="document-file">
              Select File
            </Label>

            <Input
              id="document-file"
              type="file"
              accept="image/*,.pdf"
              disabled={
                loading ||
                !selectedCandidate
              }
              onChange={(event) => {
                const selectedFile =
                  event.target.files?.[0] ??
                  null;

                setFile(
                  selectedFile,
                );

                setError("");
              }}
            />

            <p className="text-xs text-muted-foreground">
              PDF, JPG, JPEG or PNG
            </p>
          </div>

          {/* ========================
              SELECTED FILE
          ========================= */}

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

          {/* ========================
              UPLOAD STATUS
          ========================= */}

          {loading && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />

                <span className="text-sm font-medium">
                  Uploading document...
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Please wait while the file is
                being uploaded.
              </p>
            </div>
          )}
        </div>

        {/* ========================
            FOOTER
        ========================= */}

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
              !selectedCandidate ||
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