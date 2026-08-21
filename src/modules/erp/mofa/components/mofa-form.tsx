import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  FileText,
  Loader2,
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
  Textarea,
} from "@/components/ui/textarea";

import {
  cn,
} from "@/lib/utils";

import {
  UniversalSheet,
} from "@/modules/erp/shared/ui/universal-sheet";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  createMofa,
  getAgencies,
  getCandidateMedicals,
  type Mofa,
  type MofaCandidate,
  type MofaInput,
  type MofaMedical,
  type MofaStage,
  updateMofa,
} from "../mofa-service";


interface AgencyOption {
  id: string;
  name: string;
  code: string | null;
}


interface MofaFormProps {
  open: boolean;

  mofa: Mofa | null;

  selectedCandidate?: MofaCandidate | null;

  candidates: MofaCandidate[];

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: () => void;
}


export function MofaForm({
  open,
  mofa,
  selectedCandidate = null,
  candidates,
  onOpenChange,
  onSuccess,
}: MofaFormProps) {

  const isEditing =
    Boolean(mofa);


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


  const [
    candidateSearch,
    setCandidateSearch,
  ] = useState("");


  const [
    candidateOpen,
    setCandidateOpen,
  ] = useState(false);


  const [
    agencies,
    setAgencies,
  ] = useState<AgencyOption[]>(
    [],
  );


  const [
    medicals,
    setMedicals,
  ] = useState<MofaMedical[]>(
    [],
  );


  const [
    medicalLoading,
    setMedicalLoading,
  ] = useState(false);


  const [
    agenciesLoading,
    setAgenciesLoading,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  /*
   * =========================================================
   * SELECTED CANDIDATE
   * =========================================================
   */

  const currentCandidate =
    useMemo(() => {

      if (selectedCandidate) {
        return selectedCandidate;
      }

      if (!candidateId) {
        return null;
      }

      return (
        candidates.find(
          (candidate) =>
            candidate.id ===
            candidateId,
        ) ?? null
      );

    }, [
      selectedCandidate,
      candidateId,
      candidates,
    ]);


  /*
   * =========================================================
   * RESET / POPULATE FORM
   * =========================================================
   */

  useEffect(() => {

    if (!open) {
      return;
    }


    if (mofa) {

      setCandidateId(
        mofa.candidate_id,
      );

      setMedicalId(
        mofa.medical_id,
      );

      setApplicationNumber(
        mofa.application_number,
      );

      setApplicationDate(
        mofa.application_date,
      );

      setTrade(
        mofa.trade,
      );

      setAgencyId(
        mofa.agency_id,
      );

      setStage(
        mofa.stage,
      );

      return;
    }


    setCandidateId(
      selectedCandidate?.id ??
      "",
    );

    setMedicalId(
      null,
    );

    setApplicationNumber(
      "",
    );

    setApplicationDate(
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        ),
    );

    setTrade(
      "",
    );

    setAgencyId(
      null,
    );

    setStage(
      "new",
    );

    setCandidateSearch(
      "",
    );

  }, [
    open,
    mofa,
    selectedCandidate,
  ]);


  /*
   * =========================================================
   * LOAD AGENCIES
   * =========================================================
   */

  useEffect(() => {

    if (!open) {
      return;
    }


    let active = true;


    async function loadAgencies() {

      try {

        setAgenciesLoading(
          true,
        );

        const {
          data,
          error,
        } =
          await getAgencies();

        if (error) {
          throw error;
        }

        if (active) {

          setAgencies(
            (data ?? []) as AgencyOption[],
          );

        }

      } catch (error) {

        console.error(
          error,
        );

        toast.error(
          "Failed to load agencies.",
          "Please try again.",
        );

      } finally {

        if (active) {

          setAgenciesLoading(
            false,
          );

        }

      }

    }


    void loadAgencies();


    return () => {
      active = false;
    };

  }, [
    open,
  ]);


  /*
   * =========================================================
   * LOAD MEDICALS
   * =========================================================
   */

  useEffect(() => {

    if (!open || !candidateId) {

      setMedicals([]);

      return;
    }


    let active = true;


    async function loadMedicals() {

      try {

        setMedicalLoading(
          true,
        );

        const {
          data,
          error,
        } =
          await getCandidateMedicals(
            candidateId,
          );

        if (error) {
          throw error;
        }

        if (active) {

          setMedicals(
            (data ?? []) as MofaMedical[],
          );

        }

      } catch (error) {

        console.error(
          error,
        );

        if (active) {

          setMedicals(
            [],
          );

        }

        toast.error(
          "Failed to load medical records.",
          "Please try again.",
        );

      } finally {

        if (active) {

          setMedicalLoading(
            false,
          );

        }

      }

    }


    void loadMedicals();


    return () => {
      active = false;
    };

  }, [
    open,
    candidateId,
  ]);


  /*
   * =========================================================
   * CANDIDATE SEARCH
   * =========================================================
   */

  const filteredCandidates =
    useMemo(() => {

      const query =
        candidateSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return candidates;
      }

      return candidates.filter(
        (candidate) =>
          candidate.name
            ?.toLowerCase()
            .includes(query) ||
          candidate.passport_no
            ?.toLowerCase()
            .includes(query),
      );

    }, [
      candidates,
      candidateSearch,
    ]);


  /*
   * =========================================================
   * SELECT CANDIDATE
   * =========================================================
   */

  function handleCandidateSelect(
    candidate: MofaCandidate,
  ) {

    setCandidateId(
      candidate.id,
    );

    setMedicalId(
      null,
    );

    setCandidateSearch(
      "",
    );

    setCandidateOpen(
      false,
    );

  }


  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  async function handleSubmit(
    event?: React.FormEvent,
  ) {

    event?.preventDefault();


    if (!candidateId) {

      toast.error(
        "Candidate required.",
        "Select a candidate first.",
      );

      return;
    }


    if (!applicationNumber.trim()) {

      toast.error(
        "Application number required.",
        "Enter the MOFA application number.",
      );

      return;
    }


    if (!applicationDate) {

      toast.error(
        "Application date required.",
        "Select the application date.",
      );

      return;
    }


    if (!trade.trim()) {

      toast.error(
        "Trade required.",
        "Enter the trade.",
      );

      return;
    }


    /*
     * Medical ছাড়া MOFA হলে invalid.
     *
     * Existing invalid record edit করার সময়
     * stage automatically change করা হচ্ছে না,
     * user explicitly stage select করতে পারবে.
     */

    const finalStage: MofaStage =
      !medicalId &&
      !isEditing
        ? "invalid"
        : stage;


    const input: MofaInput = {

      candidate_id:
        candidateId,

      medical_id:
        medicalId,

      application_number:
        applicationNumber.trim(),

      application_date:
        applicationDate,

      trade:
        trade.trim(),

      agency_id:
        agencyId,

      stage:
        finalStage,

    };


    try {

      setSubmitting(
        true,
      );


      if (isEditing && mofa) {

        const {
          error,
        } =
          await updateMofa(
            mofa.id,
            input,
          );

        if (error) {
          throw error;
        }


        toast.success(
          "MOFA updated.",
          "The MOFA record was updated successfully.",
        );

      } else {

        const {
          error,
        } =
          await createMofa(
            mofa?.tenant_id ?? "",
            input,
          );

        if (error) {
          throw error;
        }


        toast.success(
          "MOFA created.",
          finalStage ===
            "invalid"
            ? "The MOFA was saved as invalid because no medical was connected."
            : "The MOFA record was created successfully.",
        );

      }


      onSuccess();

    } catch (error) {

      console.error(
        error,
      );

      toast.error(
        isEditing
          ? "Failed to update MOFA."
          : "Failed to create MOFA.",
        "Please check the information and try again.",
      );

    } finally {

      setSubmitting(
        false,
      );

    }

  }


  /*
   * =========================================================
   * SHEET SUBMIT WRAPPER
   * =========================================================
   */

  function handleSheetSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {

    void handleSubmit(
      event,
    );

  }


  return (
    <UniversalSheet
      open={open}
      onOpenChange={
        submitting
          ? undefined
          : onOpenChange
      }
      title={
        isEditing
          ? "Edit MOFA"
          : "Create MOFA"
      }
      description={
        isEditing
          ? "Update the MOFA application information."
          : "Create a new MOFA application."
      }
      onSubmit={
        handleSheetSubmit
      }
      submitLabel={
        isEditing
          ? "Update MOFA"
          : "Create MOFA"
      }
      submitting={
        submitting
      }
    >

      <div
        className="
          space-y-6
        "
      >

        {/* ==================================================
            CANDIDATE
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Candidate
          </Label>


          {currentCandidate ? (

            <div
              className="
                rounded-md
                border
                bg-muted/20
                p-3
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
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
                      currentCandidate.name
                    }
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-muted-foreground
                    "
                  >
                    {
                      currentCandidate.passport_no
                    }
                  </p>

                </div>


                {!selectedCandidate &&
                  !isEditing && (

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCandidateId(
                        "",
                      )
                    }
                  >
                    Change
                  </Button>

                )}

              </div>

            </div>

          ) : (

            <div
              className="
                relative
              "
            >

              <Button
                type="button"
                variant="outline"
                className="
                  w-full
                  justify-between
                  font-normal
                "
                onClick={() =>
                  setCandidateOpen(
                    (value) =>
                      !value,
                  )
                }
              >

                <span
                  className="
                    flex
                    items-center
                    gap-2
                    text-muted-foreground
                  "
                >

                  <FileText
                    className="
                      h-4
                      w-4
                    "
                  />

                  Select candidate

                </span>


                <ChevronsUpDown
                  className="
                    h-4
                    w-4
                    opacity-50
                  "
                />

              </Button>


              {candidateOpen && (

                <div
                  className="
                    absolute
                    z-50
                    mt-1
                    w-full
                    rounded-md
                    border
                    bg-background
                    shadow-md
                  "
                >

                  <div
                    className="
                      border-b
                      p-2
                    "
                  >

                    <Input
                      autoFocus
                      value={
                        candidateSearch
                      }
                      onChange={(event) =>
                        setCandidateSearch(
                          event.target.value,
                        )
                      }
                      placeholder="
                        Search name or passport...
                      "
                    />

                  </div>


                  <div
                    className="
                      max-h-60
                      overflow-y-auto
                      p-1
                    "
                  >

                    {filteredCandidates.length ===
                    0 ? (

                      <p
                        className="
                          p-3
                          text-center
                          text-sm
                          text-muted-foreground
                        "
                      >
                        No candidates found.
                      </p>

                    ) : (

                      filteredCandidates.map(
                        (
                          candidate,
                        ) => (

                          <button
                            key={
                              candidate.id
                            }
                            type="button"
                            className="
                              flex
                              w-full
                              items-center
                              justify-between
                              rounded-sm
                              px-3
                              py-2
                              text-left
                              hover:bg-muted
                            "
                            onClick={() =>
                              handleCandidateSelect(
                                candidate,
                              )
                            }
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
                                  candidate.name
                                }
                              </p>


                              <p
                                className="
                                  text-xs
                                  text-muted-foreground
                                "
                              >
                                {
                                  candidate.passport_no
                                }
                              </p>

                            </div>


                            {candidate.id ===
                              candidateId && (

                              <Check
                                className="
                                  h-4
                                  w-4
                                "
                              />

                            )}

                          </button>

                        ),
                      )

                    )}

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* ==================================================
            MEDICAL
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Medical
          </Label>


          <div
            className="
              rounded-md
              border
              p-3
            "
          >

            {medicalLoading ? (

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-muted-foreground
                "
              >

                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                />

                Loading medical records...

              </div>

            ) : medicals.length ===
              0 ? (

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-muted-foreground
                "
              >

                <Stethoscope
                  className="
                    h-4
                    w-4
                  "
                />

                No medical record.

              </div>

            ) : (

              <div
                className="
                  space-y-2
                "
              >

                <button
                  type="button"
                  className={cn(
                    `
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-md
                      border
                      p-3
                      text-left
                      transition-colors
                    `,
                    medicalId ===
                      null
                      ? "bg-muted/40"
                      : "hover:bg-muted/40",
                  )}
                  onClick={() =>
                    setMedicalId(
                      null,
                    )
                  }
                >

                  <div>

                    <p
                      className="
                        text-sm
                        font-medium
                      "
                    >
                      No Medical
                    </p>

                    <p
                      className="
                        text-xs
                        text-muted-foreground
                      "
                    >
                      Save as invalid MOFA
                    </p>

                  </div>


                  {medicalId ===
                    null && (

                    <Check
                      className="
                        h-4
                        w-4
                      "
                    />

                  )}

                </button>


                {medicals.map(
                  (
                    medical,
                  ) => (

                    <button
                      key={
                        medical.id
                      }
                      type="button"
                      className={cn(
                        `
                          flex
                          w-full
                          items-center
                          justify-between
                          rounded-md
                          border
                          p-3
                          text-left
                          transition-colors
                          hover:bg-muted/40
                        `,
                        medicalId ===
                          medical.id &&
                          "bg-muted/40",
                      )}
                      onClick={() =>
                        setMedicalId(
                          medical.id,
                        )
                      }
                    >

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        "
                      >

                        <Stethoscope
                          className="
                            h-4
                            w-4
                            shrink-0
                            text-muted-foreground
                          "
                        />


                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              text-sm
                              font-medium
                            "
                          >
                            Medical
                          </p>


                          <p
                            className="
                              text-xs
                              text-muted-foreground
                            "
                          >
                            {medical.status}
                            {" • "}
                            {
                              medical.medical_date ??
                              "No date"
                            }
                          </p>

                        </div>

                      </div>


                      {medicalId ===
                        medical.id && (

                        <Check
                          className="
                            h-4
                            w-4
                          "
                        />

                      )}

                    </button>

                  ),
                )}

              </div>

            )}

          </div>

        </div>


        {/* ==================================================
            APPLICATION NUMBER
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label htmlFor="mofa-application-number">
            Application Number
          </Label>


          <Input
            id="mofa-application-number"
            value={
              applicationNumber
            }
            onChange={(event) =>
              setApplicationNumber(
                event.target.value,
              )
            }
            placeholder="
              Enter application number
            "
            disabled={
              submitting
            }
          />

        </div>


        {/* ==================================================
            APPLICATION DATE
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label htmlFor="mofa-application-date">
            Application Date
          </Label>


          <div
            className="
              relative
            "
          >

            <CalendarDays
              className="
                pointer-events-none
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
              id="mofa-application-date"
              type="date"
              value={
                applicationDate
              }
              onChange={(event) =>
                setApplicationDate(
                  event.target.value,
                )
              }
              className="
                pl-9
              "
              disabled={
                submitting
              }
            />

          </div>

        </div>


        {/* ==================================================
            TRADE
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label htmlFor="mofa-trade">
            Trade
          </Label>


          <Input
            id="mofa-trade"
            value={trade}
            onChange={(event) =>
              setTrade(
                event.target.value,
              )
            }
            placeholder="
              Enter trade
            "
            disabled={
              submitting
            }
          />

        </div>


        {/* ==================================================
            AGENCY
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Agency
          </Label>


          <select
            value={
              agencyId ?? ""
            }
            onChange={(event) =>
              setAgencyId(
                event.target.value ||
                  null,
              )
            }
            disabled={
              submitting ||
              agenciesLoading
            }
            className="
              flex
              h-9
              w-full
              rounded-md
              border
              border-input
              bg-background
              px-3
              py-1
              text-sm
              shadow-sm
              outline-none
              focus:ring-1
              focus:ring-ring
            "
          >

            <option value="">
              {agenciesLoading
                ? "Loading agencies..."
                : "Select agency"}
            </option>


            {agencies.map(
              (
                agency,
              ) => (

                <option
                  key={
                    agency.id
                  }
                  value={
                    agency.id
                  }
                >
                  {agency.name}
                  {agency.code
                    ? ` (${agency.code})`
                    : ""}
                </option>

              ),
            )}

          </select>

        </div>


        {/* ==================================================
            STAGE
            ================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <Label>
            Stage
          </Label>


          <select
            value={stage}
            onChange={(event) =>
              setStage(
                event.target
                  .value as MofaStage,
              )
            }
            disabled={
              submitting
            }
            className="
              flex
              h-9
              w-full
              rounded-md
              border
              border-input
              bg-background
              px-3
              py-1
              text-sm
              shadow-sm
              outline-none
              focus:ring-1
              focus:ring-ring
            "
          >

            <option value="new">
              New
            </option>

            <option value="medupdated">
              Medical Updated
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="canceled">
              Canceled
            </option>

            <option value="expired">
              Expired
            </option>

            <option value="invalid">
              Invalid
            </option>

          </select>

        </div>


        {/* ==================================================
            INFORMATION
            ================================================== */}

        <div
          className="
            rounded-md
            border
            bg-muted/20
            p-3
          "
        >

          <p
            className="
              text-xs
              leading-5
              text-muted-foreground
            "
          >
            A MOFA without a connected Medical
            is saved as{" "}
            <strong>
              invalid
            </strong>
            . Once a Medical is connected,
            the MOFA can be moved to{" "}
            <strong>
              Medical Updated
            </strong>
            and used for the Visa stage.
          </p>

        </div>

      </div>

    </UniversalSheet>
  );
}