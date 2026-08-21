
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  Check,
  ChevronsUpDown,
  FileText,
  Lock,
  Stethoscope,
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
  UniversalSheet,
} from "@/modules/erp/shared/ui/universal-sheet";

import {
  FormSection,
} from "@/modules/erp/shared/forms/form-section";

import {
  cn,
} from "@/lib/utils";

import {
  createMofa,
  getAgencies,
  getCandidateMedicals,
  type Mofa,
  type MofaAgency,
  type MofaCandidate,
  type MofaInput,
  type MofaMedical,
  type MofaStage,
  updateMofa,
} from "../mofa-service";


interface MofaFormProps {
  open: boolean;

  mofa: Mofa | null;

  tenantId: string;

  candidates: MofaCandidate[];

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: (
    mofa: Mofa,
  ) => void;
}


export function MofaForm({
  open,
  mofa,
  tenantId,
  candidates,
  onOpenChange,
  onSuccess,
}: MofaFormProps) {

  /*
   * =========================================================
   * FORM STATE
   * =========================================================
   */

  const [
    candidateId,
    setCandidateId,
  ] = useState("");

  const [
    medicalId,
    setMedicalId,
  ] = useState<string | null>(
    null,
  );

  const [
    applicationNumber,
    setApplicationNumber,
  ] = useState("");

  const [
    applicationDate,
    setApplicationDate,
  ] = useState("");

  const [
    trade,
    setTrade,
  ] = useState("");

  const [
    agencyId,
    setAgencyId,
  ] = useState<string | null>(
    null,
  );

  const [
    stage,
    setStage,
  ] = useState<MofaStage>(
    "new",
  );


  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    medicalLoading,
    setMedicalLoading,
  ] = useState(false);

  const [
    agencyLoading,
    setAgencyLoading,
  ] = useState(false);


  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const [
    medicals,
    setMedicals,
  ] = useState<MofaMedical[]>(
    [],
  );

  const [
    agencies,
    setAgencies,
  ] = useState<MofaAgency[]>(
    [],
  );


  /*
   * =========================================================
   * UI STATE
   * =========================================================
   */

  const [
    candidateOpen,
    setCandidateOpen,
  ] = useState(false);

  const [
    medicalOpen,
    setMedicalOpen,
  ] = useState(false);

  const [
    agencyOpen,
    setAgencyOpen,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /*
   * =========================================================
   * EDIT MODE
   * =========================================================
   */

  const isEditing =
    Boolean(mofa);


  /*
   * =========================================================
   * CANDIDATE LOCK
   *
   * Existing MOFA candidate must not be changed.
   *
   * New MOFA can select candidate.
   * =========================================================
   */

  const candidateLocked =
    Boolean(mofa);


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
        null,
      [
        candidates,
        candidateId,
      ],
    );


  /*
   * =========================================================
   * CURRENT MEDICAL
   * =========================================================
   */

  const currentMedical =
    useMemo(
      () =>
        medicals.find(
          (medical) =>
            medical.id ===
            medicalId,
        ) ??
        null,
      [
        medicals,
        medicalId,
      ],
    );


  /*
   * =========================================================
   * CURRENT AGENCY
   * =========================================================
   */

  const currentAgency =
    useMemo(
      () =>
        agencies.find(
          (agency) =>
            agency.id ===
            agencyId,
        ) ??
        null,
      [
        agencies,
        agencyId,
      ],
    );


  /*
   * =========================================================
   * LOAD AGENCIES
   *
   * Agency list is independent from candidate.
   * =========================================================
   */

  useEffect(() => {

    if (!open) {
      return;
    }

    let cancelled = false;


    async function loadAgencies() {

      try {

        setAgencyLoading(
          true,
        );

        const {
          data,
          error: agencyError,
        } =
          await getAgencies();


        if (agencyError) {
          throw agencyError;
        }


        if (!cancelled) {

          setAgencies(
            data ?? [],
          );

        }

      } catch (loadError) {

        console.error(
          loadError,
        );


        if (!cancelled) {

          setError(
            "Failed to load agencies.",
          );

        }

      } finally {

        if (!cancelled) {

          setAgencyLoading(
            false,
          );

        }

      }

    }


    void loadAgencies();


    return () => {
      cancelled = true;
    };

  }, [open]);


  /*
   * =========================================================
   * LOAD MEDICALS
   *
   * Whenever candidate changes:
   *
   * Candidate
   *    ↓
   * Medicals
   *
   * Same Medical can later be used by multiple MOFA.
   * =========================================================
   */

  useEffect(() => {

    if (!open || !candidateId) {

      setMedicals([]);

      return;

    }


    let cancelled = false;


    async function loadMedicals() {

      try {

        setMedicalLoading(
          true,
        );


        const {
          data,
          error: medicalError,
        } =
          await getCandidateMedicals(
            candidateId,
          );


        if (medicalError) {
          throw medicalError;
        }


        if (!cancelled) {

          setMedicals(
            data ?? [],
          );

        }

      } catch (loadError) {

        console.error(
          loadError,
        );


        if (!cancelled) {

          setMedicals([]);

          setError(
            "Failed to load medical records.",
          );

        }

      } finally {

        if (!cancelled) {

          setMedicalLoading(
            false,
          );

        }

      }

    }


    void loadMedicals();


    return () => {
      cancelled = true;
    };

  }, [
    open,
    candidateId,
  ]);


  /*
   * =========================================================
   * RESET / LOAD EXISTING RECORD
   * =========================================================
   */

  useEffect(() => {

    if (!open) {
      return;
    }


    setError("");


    if (mofa) {

      setCandidateId(
        mofa.candidate_id,
      );

      setMedicalId(
        mofa.medical_id ??
          null,
      );

      setApplicationNumber(
        mofa.application_number ??
          "",
      );

      setApplicationDate(
        mofa.application_date ??
          "",
      );

      setTrade(
        mofa.trade ??
          "",
      );

      setAgencyId(
        mofa.agency_id ??
          null,
      );

      setStage(
        mofa.stage,
      );

    } else {

      setCandidateId("");

      setMedicalId(
        null,
      );

      setApplicationNumber(
        "",
      );

      setApplicationDate(
        new Date()
          .toISOString()
          .slice(0, 10),
      );

      setTrade("");

      setAgencyId(
        null,
      );

      setStage(
        "new",
      );

    }


    setCandidateOpen(
      false,
    );

    setMedicalOpen(
      false,
    );

    setAgencyOpen(
      false,
    );

  }, [
    open,
    mofa,
  ]);


  /*
   * =========================================================
   * WHEN CANDIDATE CHANGES
   *
   * Old Medical must not remain selected.
   * =========================================================
   */

  function handleCandidateSelect(
    nextCandidateId: string,
  ) {

    setCandidateId(
      nextCandidateId,
    );

    setMedicalId(
      null,
    );

    setError("");

    setCandidateOpen(
      false,
    );

  }


  /*
   * =========================================================
   * MEDICAL OPTIONS
   *
   * New / Fit / etc can be displayed.
   *
   * For Med Updated stage we require a Medical.
   * =========================================================
   */

  const fitMedicals =
    medicals.filter(
      (medical) =>
        medical.status ===
          "fit" ||
        medical.status ===
          "new",
    );


  /*
   * =========================================================
   * UNSAVED CHANGES
   * =========================================================
   */

  const hasChanges =
    mofa
      ? (
          candidateId !==
            mofa.candidate_id ||

          medicalId !==
            (mofa.medical_id ??
              null) ||

          applicationNumber.trim() !==
            (mofa.application_number ??
              "") ||

          applicationDate !==
            (mofa.application_date ??
              "") ||

          trade.trim() !==
            (mofa.trade ??
              "") ||

          agencyId !==
            (mofa.agency_id ??
              null) ||

          stage !==
            mofa.stage
        )
      : (
          candidateId !== "" ||
          medicalId !== null ||
          applicationNumber.trim() !== "" ||
          applicationDate !==
            new Date()
              .toISOString()
              .slice(0, 10) ||
          trade.trim() !== "" ||
          agencyId !== null ||
          stage !== "new"
        );


  /*
   * =========================================================
   * SUBMIT VALIDATION
   * =========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setError("");


    /*
     * Candidate
     */

    if (!candidateId) {

      setError(
        "Candidate is required.",
      );

      return;
    }


    /*
     * Application number
     */

    const trimmedApplicationNumber =
      applicationNumber.trim();


    if (
      !trimmedApplicationNumber
    ) {

      setError(
        "Application number is required.",
      );

      return;
    }


    /*
     * Application date
     */

    if (!applicationDate) {

      setError(
        "Application date is required.",
      );

      return;
    }


    /*
     * Trade
     */

    const trimmedTrade =
      trade.trim();


    if (!trimmedTrade) {

      setError(
        "Trade is required.",
      );

      return;
    }


    /*
     * =======================================================
     * MEDICAL RULE
     *
     * new:
     *     Medical optional.
     *
     * medupdated:
     *     Medical mandatory.
     *
     * approved:
     *     Medical should exist because this MOFA
     *     is being used for visa.
     *
     * invalid:
     *     Medical is intentionally not required.
     * =======================================================
     */

    if (
      stage ===
        "medupdated" &&
      !medicalId
    ) {

      setError(
        "Medical is required before marking MOFA as Med Updated.",
      );

      return;
    }


    if (
      stage ===
        "approved" &&
      !medicalId
    ) {

      setError(
        "A linked medical record is required before approving this MOFA.",
      );

      return;
    }


    /*
     * =======================================================
     * MEDICAL VALIDATION
     *
     * Selected Medical must belong to selected Candidate.
     * =======================================================
     */

    if (
      medicalId &&
      !currentMedical
    ) {

      setError(
        "Selected medical record is no longer available.",
      );

      return;
    }


    /*
     * =======================================================
     * SAVE
     * =======================================================
     */

    const input: MofaInput = {

      candidate_id:
        candidateId,

      medical_id:
        medicalId,

      application_number:
        trimmedApplicationNumber,

      application_date:
        applicationDate,

      trade:
        trimmedTrade,

      agency_id:
        agencyId,

      stage,
    };


    try {

      setLoading(
        true,
      );


      const result =
        isEditing && mofa
          ? await updateMofa(
              mofa.id,
              input,
            )
          : await createMofa(
              tenantId,
              input,
            );


      if (result.error) {
        throw result.error;
      }


      if (!result.data) {

        throw new Error(
          "MOFA record was not returned after saving.",
        );

      }


      onSuccess(
        result.data,
      );

    } catch (saveError) {

      console.error(
        "Failed to save MOFA:",
        saveError,
      );


      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save MOFA record.",
      );

    } finally {

      setLoading(
        false,
      );

    }

  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <UniversalSheet

      open={
        open
      }

      onOpenChange={
        onOpenChange
      }

      title={
        isEditing
          ? "Edit MOFA"
          : "Create MOFA"
      }

      description={
        isEditing
          ? "Update the MOFA application record."
          : "Create a new MOFA application record."
      }

      onSubmit={
        handleSubmit
      }

      submitLabel={
        isEditing
          ? "Update MOFA"
          : "Create MOFA"
      }

      loading={
        loading
      }

      disabled={
        !candidateId ||
        !applicationNumber.trim() ||
        !applicationDate ||
        !trade.trim()
      }

      hasChanges={
        hasChanges
      }
    >

      {/* ====================================================
          ERROR
          ==================================================== */}

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


      {/* ====================================================
          CANDIDATE
          ==================================================== */}

      <FormSection

        title="Candidate"

        description={
          candidateLocked
            ? "Candidate is locked for this MOFA record."
            : "Select the candidate for this MOFA application."
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


          {candidateLocked ? (

            <div
              className="
                flex
                min-h-10
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

                <p
                  className="
                    truncate
                    text-sm
                    font-medium
                  "
                >
                  {
                    mofa?.candidate?.name ??
                    currentCandidate?.name ??
                    "Unknown candidate"
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
                    mofa?.candidate?.passport_no ??
                    currentCandidate?.passport_no ??
                    "—"
                  }
                </p>

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
                  className="
                    w-full
                    justify-between
                    font-normal
                  "
                  disabled={
                    loading
                  }
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
                      Search candidate...
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

                            value={`
                              ${candidate.name}
                              ${candidate.passport_no}
                            `}

                            onSelect={() =>
                              handleCandidateSelect(
                                candidate.id,
                              )
                            }
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


                            <div
                              className="
                                min-w-0
                              "
                            >

                              <p
                                className="
                                  truncate
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
                                  truncate
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

      </FormSection>


      {/* ====================================================
          MEDICAL
          ==================================================== */}

      <FormSection

        title="Medical"

        description="
          MOFA may initially exist without a medical.
          Link a medical when the MOFA becomes Med Updated.
        "
      >

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Medical Record
          </Label>


          <Popover

            open={
              medicalOpen
            }

            onOpenChange={
              setMedicalOpen
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
                  medicalOpen
                }
                disabled={
                  !candidateId ||
                  medicalLoading ||
                  loading
                }
                className="
                  w-full
                  justify-between
                  font-normal
                "
              >

                {currentMedical ? (

                  <span
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2
                    "
                  >

                    <Stethoscope
                      className="
                        h-4
                        w-4
                        shrink-0
                      "
                    />

                    <span
                      className="
                        truncate
                      "
                    >
                      Medical{" "}
                      {currentMedical.medical_date ??
                        "Record"}
                      {" — "}
                      {
                        currentMedical.status
                      }
                    </span>

                  </span>

                ) : (

                  <span
                    className="
                      text-muted-foreground
                    "
                  >
                    {medicalLoading
                      ? "Loading medicals..."
                      : candidateId
                        ? "Select medical or leave empty"
                        : "Select candidate first"}
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
                    Search medical...
                  "
                />


                <CommandList>

                  <CommandEmpty>
                    No medical record found.
                  </CommandEmpty>


                  <CommandGroup>

                    <CommandItem

                      value="no medical none"

                      onSelect={() => {

                        setMedicalId(
                          null,
                        );

                        setMedicalOpen(
                          false,
                        );

                      }}
                    >

                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          medicalId ===
                            null
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />

                      No Medical

                    </CommandItem>


                    {fitMedicals.map(
                      (
                        medical,
                      ) => (

                        <CommandItem

                          key={
                            medical.id
                          }

                          value={`
                            ${medical.medical_date ?? ""}
                            ${medical.status}
                            ${medical.id}
                          `}

                          onSelect={() => {

                            setMedicalId(
                              medical.id,
                            );

                            setMedicalOpen(
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
                              medicalId ===
                                medical.id
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
                              Medical{" "}
                              {
                                medical.medical_date ??
                                "—"
                              }
                            </p>


                            <p
                              className="
                                text-xs
                                text-muted-foreground
                              "
                            >
                              Status:{" "}
                              {
                                medical.status
                              }

                              {medical.fit_date && (
                                <>
                                  {" · Fit: "}
                                  {
                                    medical.fit_date
                                  }
                                </>
                              )}
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


          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            Leave empty when this MOFA is only being
            recorded and has no medical linked yet.
          </p>

        </div>

      </FormSection>


      {/* ====================================================
          APPLICATION
          ==================================================== */}

      <FormSection

        title="Application"

        description="
          Enter the MOFA application information.
        "
      >

        <div
          className="
            space-y-4
          "
        >

          <div
            className="
              space-y-2
            "
          >

            <Label
              htmlFor="mofa-application-number"
            >
              Application Number
            </Label>


            <div
              className="
                relative
              "
            >

              <FileText
                className="
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-muted-foreground
                "
              />


              <Input
                id="
                  mofa-application-number
                "
                value={
                  applicationNumber
                }
                onChange={(
                  event,
                ) =>
                  setApplicationNumber(
                    event.target.value,
                  )
                }
                placeholder="
                  Enter application number
                "
                disabled={
                  loading
                }
                className="
                  pl-9
                "
              />

            </div>

          </div>


          <div
            className="
              space-y-2
            "
          >

            <Label
              htmlFor="mofa-application-date"
            >
              Application Date
            </Label>


            <Input
              id="
                mofa-application-date
              "
              type="date"
              value={
                applicationDate
              }
              onChange={(
                event,
              ) =>
                setApplicationDate(
                  event.target.value,
                )
              }
              disabled={
                loading
              }
            />

          </div>


          <div
            className="
              space-y-2
            "
          >

            <Label
              htmlFor="mofa-trade"
            >
              Trade
            </Label>


            <Input
              id="mofa-trade"
              value={
                trade
              }
              onChange={(
                event,
              ) =>
                setTrade(
                  event.target.value,
                )
              }
              placeholder="
                Enter trade
              "
              disabled={
                loading
              }
            />

          </div>

        </div>

      </FormSection>


      {/* ====================================================
          AGENCY
          ==================================================== */}

      <FormSection

        title="Agency"

        description="
          Select the agency responsible for this MOFA.
        "
      >

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Agency
          </Label>


          <Popover

            open={
              agencyOpen
            }

            onOpenChange={
              setAgencyOpen
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
                  agencyOpen
                }
                disabled={
                  agencyLoading ||
                  loading
                }
                className="
                  w-full
                  justify-between
                  font-normal
                "
              >

                {currentAgency ? (

                  <span
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2
                    "
                  >

                    <Building2
                      className="
                        h-4
                        w-4
                        shrink-0
                      "
                    />

                    <span
                      className="
                        truncate
                      "
                    >
                      {
                        currentAgency.name
                      }

                      {currentAgency.code && (
                        <>
                          {" — "}
                          {
                            currentAgency.code
                          }
                        </>
                      )}
                    </span>

                  </span>

                ) : (

                  <span
                    className="
                      text-muted-foreground
                    "
                  >
                    {agencyLoading
                      ? "Loading agencies..."
                      : "Select agency"}
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
                    Search agency...
                  "
                />


                <CommandList>

                  <CommandEmpty>
                    No agency found.
                  </CommandEmpty>


                  <CommandGroup>

                    <CommandItem

                      value="no agency none"

                      onSelect={() => {

                        setAgencyId(
                          null,
                        );

                        setAgencyOpen(
                          false,
                        );

                      }}
                    >

                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          agencyId ===
                            null
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />

                      No Agency

                    </CommandItem>


                    {agencies.map(
                      (
                        agency,
                      ) => (

                        <CommandItem

                          key={
                            agency.id
                          }

                          value={`
                            ${agency.name}
                            ${agency.code ?? ""}
                          `}

                          onSelect={() => {

                            setAgencyId(
                              agency.id,
                            );

                            setAgencyOpen(
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
                              agencyId ===
                                agency.id
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
                                agency.name
                              }
                            </p>


                            {agency.code && (

                              <p
                                className="
                                  text-xs
                                  text-muted-foreground
                                "
                              >
                                {
                                  agency.code
                                }
                              </p>

                            )}

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

      </FormSection>


      {/* ====================================================
          STAGE
          ==================================================== */}

      <FormSection

        title="MOFA Stage"

        description="
          Stage controls how this MOFA record can move
          through the visa workflow.
        "
      >

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Stage
          </Label>


          <Select
            value={
              stage
            }
            onValueChange={(
              value,
            ) =>
              setStage(
                value as MofaStage,
              )
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
                value="medupdated"
              >
                Med Updated
              </SelectItem>


              <SelectItem
                value="approved"
              >
                Approved
              </SelectItem>


              <SelectItem
                value="canceled"
              >
                Canceled
              </SelectItem>


              <SelectItem
                value="expired"
              >
                Expired
              </SelectItem>


              <SelectItem
                value="invalid"
              >
                Invalid
              </SelectItem>

            </SelectContent>

          </Select>


          {stage ===
            "medupdated" && (

            <p
              className="
                text-xs
                text-muted-foreground
              "
            >
              Med Updated requires a linked
              medical record.
            </p>

          )}


          {stage ===
            "approved" && (

            <p
              className="
                text-xs
                text-muted-foreground
              "
            >
              Approved represents a MOFA that is
              ready to be used for the visa process.
            </p>

          )}


          {stage ===
            "invalid" && (

            <p
              className="
                text-xs
                text-muted-foreground
              "
            >
              Invalid can be used to keep a MOFA
              record that has no valid medical linkage.
            </p>

          )}

        </div>

      </FormSection>

    </UniversalSheet>
  );
}

