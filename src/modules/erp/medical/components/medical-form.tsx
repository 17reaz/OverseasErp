import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
// import যোগ হলো
import {
  Checkbox,
} from "@/components/ui/checkbox";
import {
  Check,
  ChevronsUpDown,
  Lock,
} from "lucide-react";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  UniversalSheet,
} from "../../shared/forms/universal-sheet";

import {
  FormSection,
} from "../../shared/forms/form-section";

import {
  cn,
} from "@/lib/utils";

import {
  createMedical,
  updateMedical,
  type Medical,
  type MedicalCandidate,
  type MedicalStatus,
} from "../medical-service";


interface MedicalFormProps {
  open: boolean;

  medical: Medical | null;

  selectedCandidate:
    | MedicalCandidate
    | null;

  candidates:
    MedicalCandidate[];

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: () => void;
}


export function MedicalForm({
  open,
  medical,
  selectedCandidate,
  candidates,
  onOpenChange,
  onSuccess,
}: MedicalFormProps) {

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
    loading,
    setLoading,
  ] = useState(false);
  // নতুন state (loading state-এর ঠিক পরে)
const [
  advanceStage,
  setAdvanceStage,
] = useState(true);
  const [
    error,
    setError,
  ] = useState("");

  /*
   * New → Fit confirmation
   */
  const [
    showFitConfirmation,
    setShowFitConfirmation,
  ] = useState(false);


  /*
   * =========================================================
   * CANDIDATE LOCK
   *
   * Candidate is locked when:
   *
   * 1. Editing existing medical
   * 2. Creating from Medicalable table
   * =========================================================
   */

  const candidateLocked =
    Boolean(
      medical ||
      selectedCandidate,
    );


  /*
   * =========================================================
   * RESET / LOAD FORM
   * =========================================================
   */

  useEffect(() => {

    if (!open) {
      return;
    }


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

    } else if (
      selectedCandidate
    ) {

      setCandidateId(
        selectedCandidate.id,
      );

      setMedicalDate(
        "",
      );

      setFitDate(
        "",
      );

      setStatus(
        "new",
      );

    } else {

      /*
       * Add Medical from toolbar.
       *
       * Candidate remains searchable.
       */

      setCandidateId(
        "",
      );

      setMedicalDate(
        "",
      );

      setFitDate(
        "",
      );

      setStatus(
        "new",
      );

    }


    setCandidateOpen(
      false,
    );

    setError("");

    setShowFitConfirmation(
      false,
    );

  }, [
    medical,
    selectedCandidate,
    open,
  ]);


  /*
   * =========================================================
   * CURRENT CANDIDATE
   * =========================================================
   */

  const currentCandidate =
  useMemo(
    () =>
      candidates.find(
        (candidate) =>
          candidate.id ===
          candidateId,
      ) ??
      selectedCandidate ??
      medical?.candidate ??
      null,

    [
      candidates,
      candidateId,
      selectedCandidate,
      medical,
    ],
  );


  /*
   * =========================================================
   * HAS CHANGES
   * =========================================================
   */

  const hasChanges =
    Boolean(
      candidateId ||
      medicalDate ||
      fitDate ||
      status !== "new",
    );


  /*
   * =========================================================
   * STATUS CHANGE
   *
   * New → Fit requires confirmation.
   * =========================================================
   */

  function handleStatusChange(
    value: string,
  ) {

    const nextStatus =
      value as MedicalStatus;


    /*
     * New → Fit
     *
     * Do not change the actual
     * form state until confirmed.
     */

    if (
      status === "new" &&
      nextStatus === "fit"
    ) {

      setShowFitConfirmation(
        true,
      );

      return;
    }


    setStatus(
      nextStatus,
    );


    /*
     * Fit Date only belongs
     * to Fit status.
     */

    if (
      nextStatus !== "fit"
    ) {

      setFitDate(
        "",
      );

    }


    setError("");

  }


  /*
   * =========================================================
   * CONFIRM NEW → FIT
   * =========================================================
   */

  function handleConfirmFit() {

    setStatus(
      "fit",
    );


    /*
     * Automatically set today's
     * date when candidate becomes Fit.
     */

    setFitDate(
      new Date()
        .toISOString()
        .slice(0, 10),
    );


    setError("");

    setShowFitConfirmation(
      false,
    );

  }


  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    /*
     * Candidate required
     */

    if (!candidateId) {

      setError(
        "Candidate is required.",
      );

      return;
    }


    /*
     * Fit requires Fit Date
     */

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

      setLoading(
        true,
      );

      setError("");


      const input = {

        /*
         * Candidate is intentionally
         * locked after record creation.
         */

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
        advance_stage:
    medical
      ? undefined
      : advanceStage,

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


      if (
        result.error
      ) {

        throw result.error;

      }


      onSuccess();

    } catch (
      submitError
    ) {

      console.error(
        "Failed to save medical:",
        submitError,
      );


      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Failed to save medical record.",
      );

    } finally {

      setLoading(
        false,
      );

    }

  }


  return (
    <>
      <UniversalSheet

        open={
          open
        }

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
          !candidateId
        }

        hasChanges={
          hasChanges
        }
      >

        {/* =====================================================
            ERROR
            ===================================================== */}

        {error && (

          <div
            className="
              rounded-md
              border
              border-destructive/30
              bg-destructive/10
              px-3
              py-2
              text-sm
              text-destructive
            "
          >
            {error}
          </div>

        )}


        {/* =====================================================
            CANDIDATE INFORMATION
            ===================================================== */}

        <FormSection

          title="Candidate Information"

          description={
            candidateLocked
              ? "Candidate is locked for this medical record."
              : "Select the candidate for this medical record."
          }
        >

          <div
            className="
              space-y-2
            "
          >

            <Label>
              Candidate
            </Label>


            {/* =================================================
                LOCKED CANDIDATE
                ================================================= */}

            {candidateLocked ? (

              <div
                className="
                  flex
                  min-h-10
                  w-full
                  items-center
                  justify-between
                  rounded-md
                  border
                  bg-muted/40
                  px-3
                  py-2
                "
              >

                <div
                  className="
                    min-w-0
                  "
                >

                  {currentCandidate ? (

                    <>
                      <p
                        className="
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {
                          currentCandidate.name
                        }
                      </p>

                      <p
                        className="
                          truncate
                          text-xs
                          text-muted-foreground
                        "
                      >
                        Passport:{" "}
                        {
                          currentCandidate.passport_no
                        }
                      </p>
                    </>

                  ) : (

                    <p
                      className="
                        text-sm
                        text-muted-foreground
                      "
                    >
                      Candidate
                    </p>

                  )}

                </div>


                <Lock
                  className="
                    ml-3
                    h-4
                    w-4
                    shrink-0
                    text-muted-foreground
                  "
                />

              </div>

            ) : (

              /* =================================================
                 SEARCHABLE CANDIDATE
                 ================================================= */

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
                      loading
                    }

                    className="
                      w-full
                      justify-between
                      font-normal
                    "
                  >

                    {currentCandidate ? (

                      <span
                        className="
                          truncate
                        "
                      >
                        {
                          currentCandidate.name
                        }
                        {" — "}
                        {
                          currentCandidate.passport_no
                        }
                      </span>

                    ) : (

                      <span
                        className="
                          text-muted-foreground
                        "
                      >
                        Select candidate
                      </span>

                    )}


                    <ChevronsUpDown
                      className="
                        ml-2
                        h-4
                        w-4
                        shrink-0
                        opacity-50
                      "
                    />

                  </Button>

                </PopoverTrigger>


                <PopoverContent

                  align="start"

                  className="
                    w-[var(--radix-popover-trigger-width)]
                    p-0
                  "
                >

                  <Command>

                    <CommandInput
                      placeholder="
                        Search name or passport...
                      "
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

                                setError(
                                  "",
                                );

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


                              <div>

                                <p
                                  className="
                                    text-sm
                                    font-medium
                                  "
                                >
                                  {
                                    candidate.name
                                  }
                                </p>


                                <p
                                  className="
                                    text-xs
                                    text-muted-foreground
                                  "
                                >
                                  Passport:{" "}
                                  {
                                    candidate.passport_no
                                  }
                                </p>

                              </div>

                            </CommandItem>

                          ),
                        )}

                      </CommandGroup>

                    </CommandList>

                  </Command>

                </PopoverContent>

              </Popover>

            )}

          </div>
            
{!medical && (

  <label className="mt-3 flex items-start gap-2 text-sm">

    <Checkbox
      checked={advanceStage}
      onCheckedChange={(checked) =>
        setAdvanceStage(checked === true)
      }
    />

    <span>
      Update candidate stage to Medical
      <span className="block text-xs text-muted-foreground">
      </span>
    </span>

  </label>

)}
        </FormSection>


        {/* =====================================================
            MEDICAL INFORMATION
            ===================================================== */}

        <FormSection

          title="Medical Information"

          description="
            Enter medical examination details.
          "
        >

          <div
            className="
              space-y-4
            "
          >

            {/* =================================================
                MEDICAL DATE
                ================================================= */}

            <div
              className="
                space-y-2
              "
            >

              <Label
                htmlFor="medical-date"
              >
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


            {/* =================================================
                STATUS
                ================================================= */}

            <div
              className="
                space-y-2
              "
            >

              <Label>
                Status
              </Label>


              <Select

                value={
                  status
                }

                onValueChange={
                  handleStatusChange
                }

                disabled={
                  loading
                }
              >

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>


                <SelectContent>

                  <SelectItem
                    value="new"
                  >
                    New
                  </SelectItem>


                  <SelectItem
                    value="fit"
                  >
                    Fit
                  </SelectItem>


                  <SelectItem
                    value="unfit"
                  >
                    Unfit
                  </SelectItem>


                  <SelectItem
                    value="expired"
                  >
                    Expired
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>


            {/* =================================================
                FIT DATE
                ================================================= */}

            {status === "fit" && (

              <div
                className="
                  space-y-2
                "
              >

                <Label
                  htmlFor="fit-date"
                >
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


                <p
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Fit date is automatically
                  set when a New medical is
                  confirmed as Fit.
                </p>

              </div>

            )}

          </div>

        </FormSection>

      </UniversalSheet>


      {/* =======================================================
          NEW → FIT CONFIRMATION
          ======================================================= */}

      <AlertDialog

        open={
          showFitConfirmation
        }

        onOpenChange={
          setShowFitConfirmation
        }
      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Confirm Medical Fit
            </AlertDialogTitle>


            <AlertDialogDescription>

              Are you sure you want to
              mark{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >
                {
                  currentCandidate?.name ??
                  "this candidate"
                }
              </span>

              {" "}as Fit?

              <br />

              This will move the medical
              record from{" "}
              <span
                className="
                  font-medium
                  text-foreground
                "
              >
                New
              </span>
              {" "}to{" "}
              <span
                className="
                  font-medium
                  text-foreground
                "
              >
                Fit
              </span>
              {" "}and set the Fit Date
              automatically.

            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>


            <AlertDialogAction
              onClick={
                handleConfirmFit
              }
            >
              Confirm Fit
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </>
  );
}