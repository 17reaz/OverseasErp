import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronsUpDown,
} from "lucide-react";

import {
  cn,
} from "@/lib/utils";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  UniversalSheet,
} from "../../shared/forms/universal-sheet";

import {
  FormSection,
} from "../../shared/forms/form-section";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  createMedical,
  getMedicalCandidates,
  updateMedical,
  type Medical,
  type MedicalCandidate,
  type MedicalStatus,
} from "../medical-service";


interface MedicalFormProps {
  open: boolean;

  medical: Medical | null;

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: () => void;
}


export function MedicalForm({
  open,
  medical,
  onOpenChange,
  onSuccess,
}: MedicalFormProps) {

  const [
    candidates,
    setCandidates,
  ] = useState<MedicalCandidate[]>(
    [],
  );

  const [
    candidateId,
    setCandidateId,
  ] = useState("");

  const [
    medicalDate,
    setMedicalDate,
  ] = useState("");

  const [
    fitDate,
    setFitDate,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<MedicalStatus>(
    "new",
  );

  const [
    candidateOpen,
    setCandidateOpen,
  ] = useState(false);

  const [
    loadingCandidates,
    setLoadingCandidates,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  // =====================================================
  // LOAD CANDIDATES
  // =====================================================

  useEffect(() => {

    if (!open) {
      return;
    }

    async function loadCandidates() {

      try {

        setLoadingCandidates(
          true,
        );

        const {
          data,
          error,
        } =
          await getMedicalCandidates();

        if (error) {
          throw error;
        }

        setCandidates(
          data ?? [],
        );

      } catch (error) {

        console.error(
          error,
        );

        toast.error(
          "Failed to load candidates.",
          "Please try again.",
        );

      } finally {

        setLoadingCandidates(
          false,
        );

      }
    }

    loadCandidates();

  }, [
    open,
  ]);


  // =====================================================
  // LOAD FORM DATA
  // =====================================================

  useEffect(() => {

    if (medical) {

      setCandidateId(
        medical.candidate_id,
      );

      setMedicalDate(
        medical.medical_date ??
          "",
      );

      setFitDate(
        medical.fit_date ??
          "",
      );

      setStatus(
        medical.status,
      );

    } else {

      setCandidateId("");

      setMedicalDate("");

      setFitDate("");

      setStatus("new");

    }

    setError("");

  }, [
    medical,
    open,
  ]);


  // =====================================================
  // SELECTED CANDIDATE
  // =====================================================

  const selectedCandidate =
    useMemo(
      () =>
        candidates.find(
          (candidate) =>
            candidate.id ===
            candidateId,
        ),
      [
        candidates,
        candidateId,
      ],
    );


  // =====================================================
  // HAS CHANGES
  // =====================================================

  const hasChanges =
    Boolean(
      candidateId ||
      medicalDate ||
      fitDate ||
      status !== "new",
    );


  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setError("");


    if (!candidateId) {

      setError(
        "Candidate is required.",
      );

      return;
    }


    if (
      status === "fit" &&
      !fitDate
    ) {

      setError(
        "Fit date is required when status is Fit.",
      );

      return;
    }


    try {

      setLoading(true);


      const input = {
        candidate_id:
          candidateId,

        medical_date:
          medicalDate ||
          null,

        fit_date:
          status === "fit"
            ? fitDate ||
              null
            : null,

        status,
      };


      const result =
        medical
          ? await updateMedical(
              medical.id,
              input,
            )
          : await createMedical(
              input,
            );


      if (result.error) {

        console.error(
          result.error,
        );

        setError(
          result.error.message ||
            "Failed to save medical record.",
        );

        return;
      }


      toast.success(
        medical
          ? "Medical updated."
          : "Medical created.",
        medical
          ? "Medical record updated successfully."
          : "Medical record created successfully.",
      );


      onSuccess();

    } catch (error) {

      console.error(
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save medical record.",
      );

    } finally {

      setLoading(false);

    }

  }


  return (
    <UniversalSheet
      open={open}
      onOpenChange={
        onOpenChange
      }
      title={
        medical
          ? "Edit Medical"
          : "Add Medical"
      }
      description={
        medical
          ? "Update the candidate medical record."
          : "Create a new candidate medical record."
      }
      onSubmit={
        handleSubmit
      }
      submitLabel={
        medical
          ? "Update Medical"
          : "Create Medical"
      }
      loading={
        loading
      }
      disabled={
        !candidateId ||
        loadingCandidates
      }
      hasChanges={
        hasChanges
      }
    >

      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}


      {/* ==================================================
          CANDIDATE INFORMATION
          ================================================== */}

      <FormSection
        title="Candidate Information"
        description="Select the candidate for this medical record."
      >

        <div className="space-y-4">

          <div className="space-y-2">

            <Label>
              Candidate
            </Label>


            <Popover
              open={
                candidateOpen
              }
              onOpenChange={
                setCandidateOpen
              }
            >

              <PopoverTrigger
                asChild
              >

                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={
                    candidateOpen
                  }
                  disabled={
                    loading ||
                    loadingCandidates ||
                    Boolean(medical)
                  }
                  className="w-full justify-between font-normal"
                >

                  {selectedCandidate ? (
                    <span className="truncate">
                      {
                        selectedCandidate.name
                      }{" "}
                      —{" "}
                      {
                        selectedCandidate.passport_no
                      }
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {loadingCandidates
                        ? "Loading candidates..."
                        : "Select candidate"}
                    </span>
                  )}

                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />

                </Button>

              </PopoverTrigger>


              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
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
                        (
                          candidate,
                        ) => (

                          <CommandItem
                            key={
                              candidate.id
                            }
                            value={`${candidate.name} ${candidate.passport_no}`}
                            onSelect={() => {

                              setCandidateId(
                                candidate.id,
                              );

                              setCandidateOpen(
                                false,
                              );

                              setError("");

                            }}
                          >

                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                candidateId ===
                                  candidate.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />


                            <div className="flex min-w-0 flex-col">

                              <span className="truncate font-medium">
                                {
                                  candidate.name
                                }
                              </span>

                              <span className="truncate text-xs text-muted-foreground">
                                Passport:{" "}
                                {
                                  candidate.passport_no
                                }
                              </span>

                            </div>

                          </CommandItem>

                        ),
                      )}

                    </CommandGroup>

                  </CommandList>

                </Command>

              </PopoverContent>

            </Popover>

          </div>

        </div>

      </FormSection>


      {/* ==================================================
          MEDICAL INFORMATION
          ================================================== */}

      <FormSection
        title="Medical Information"
        description="Enter the medical examination and current status."
      >

        <div className="space-y-4">

          {/* Medical Date */}

          <div className="space-y-2">

            <Label htmlFor="medical-date">
              Medical Date
            </Label>

            <Input
              id="medical-date"
              type="date"
              value={
                medicalDate
              }
              onChange={(
                event,
              ) =>
                setMedicalDate(
                  event.target.value,
                )
              }
              disabled={
                loading
              }
            />

          </div>


          {/* Status */}

          <div className="space-y-2">

            <Label>
              Status
            </Label>

            <Select
              value={
                status
              }
              onValueChange={(
                value,
              ) => {

                const nextStatus =
                  value as MedicalStatus;

                setStatus(
                  nextStatus,
                );

                if (
                  nextStatus !==
                  "fit"
                ) {
                  setFitDate("");
                }

              }}
              disabled={
                loading
              }
            >

              <SelectTrigger>

                <SelectValue />

              </SelectTrigger>


              <SelectContent>

                <SelectItem value="new">
                  New
                </SelectItem>

                <SelectItem value="fit">
                  Fit
                </SelectItem>

                <SelectItem value="unfit">
                  Unfit
                </SelectItem>

                <SelectItem value="expired">
                  Expired
                </SelectItem>

              </SelectContent>

            </Select>

          </div>


          {/* Fit Date */}

          {status === "fit" && (

            <div className="space-y-2">

              <Label htmlFor="fit-date">
                Fit Date
              </Label>

              <Input
                id="fit-date"
                type="date"
                value={
                  fitDate
                }
                onChange={(
                  event,
                ) =>
                  setFitDate(
                    event.target.value,
                  )
                }
                disabled={
                  loading
                }
              />

            </div>

          )}

        </div>

      </FormSection>

    </UniversalSheet>
  );
}