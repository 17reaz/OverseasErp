import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

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
  toast,
} from "@/components/shared/toast/toast";

import {
  createMofa,
  getCandidateMedicals,
  getMofaAgencies,
  updateMofa,
  type Mofa,
  type MofaAgency,
  type MofaCandidate,
  type MofaInput,
  type MofaMedical,
  type MofaStage,
} from "../mofa-service";


/* =========================================================
 * PROPS
 * ========================================================= */

interface MofaFormProps {
  open: boolean;

  mofa: Mofa | null;

  candidates: MofaCandidate[];

  selectedCandidate?: MofaCandidate | null;

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: () => void;
}


/* =========================================================
 * DEFAULT FORM
 * ========================================================= */

const emptyForm: MofaInput = {
  candidate_id: "",
  medical_id: null,
  agency_id: null,
  application_number: "",
  application_date: "",
  trade: "",
  stage: "new",
};


/* =========================================================
 * STAGE OPTIONS
 * ========================================================= */

const stageOptions: {
  value: MofaStage;
  label: string;
}[] = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "medupdated",
    label: "Medical Updated",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "canceled",
    label: "Canceled",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "invalid",
    label: "Invalid",
  },
];


/* =========================================================
 * FORM
 * ========================================================= */

export function MofaForm({
  open,
  mofa,
  candidates,
  selectedCandidate,
  onOpenChange,
  onSuccess,
}: MofaFormProps) {

  /* =======================================================
   * FORM STATE
   * ======================================================= */

  const [
    form,
    setForm,
  ] = useState<MofaInput>(
    emptyForm,
  );


  /* =======================================================
   * MEDICALS
   * ======================================================= */

  const [
    medicals,
    setMedicals,
  ] = useState<MofaMedical[]>([]);

  const [
    medicalLoading,
    setMedicalLoading,
  ] = useState(false);


  /* =======================================================
   * AGENCIES
   * ======================================================= */

  const [
    agencies,
    setAgencies,
  ] = useState<MofaAgency[]>([]);

  const [
    agenciesLoading,
    setAgenciesLoading,
  ] = useState(false);


  /* =======================================================
   * SUBMIT
   * ======================================================= */

  const [
    saving,
    setSaving,
  ] = useState(false);


  /* =======================================================
   * DIRTY STATE
   * ======================================================= */

  const [
    dirty,
    setDirty,
  ] = useState(false);


  /* =======================================================
   * EDITING
   * ======================================================= */

  const isEditing =
    Boolean(mofa);


  /* =======================================================
   * SELECTED CANDIDATE
   * ======================================================= */

  const currentCandidate =
    useMemo(
      () => {

        if (
          selectedCandidate
        ) {
          return selectedCandidate;
        }

        if (
          !form.candidate_id
        ) {
          return null;
        }

        return (
          candidates.find(
            (candidate) =>
              candidate.id ===
              form.candidate_id,
          ) ?? null
        );

      },
      [
        selectedCandidate,
        form.candidate_id,
        candidates,
      ],
    );


  /* =======================================================
   * RESET FORM
   * ======================================================= */

  useEffect(() => {

    if (!open) {
      return;
    }

    if (mofa) {

      setForm({
        candidate_id:
          mofa.candidate_id,

        medical_id:
          mofa.medical_id,

        agency_id:
          mofa.agency_id,

        application_number:
          mofa.application_number ??
          "",

        application_date:
          mofa.application_date ??
          "",

        trade:
          mofa.trade ??
          "",

        stage:
          mofa.stage,
      });

    } else {

      setForm({
        ...emptyForm,

        candidate_id:
          selectedCandidate?.id ??
          "",
      });

    }

    setDirty(false);

  }, [
    open,
    mofa,
    selectedCandidate,
  ]);


  /* =======================================================
   * LOAD AGENCIES
   * ======================================================= */

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
        } = await getMofaAgencies();

        if (error) {
          throw error;
        }

        if (active) {

          setAgencies(
            data ?? [],
          );

        }

      } catch (error) {

        console.error(
          "Failed to load agencies:",
          error,
        );

        if (active) {

          toast.error(
            "Failed to load agencies.",
            "Please try again.",
          );

        }

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


  /* =======================================================
   * LOAD MEDICALS
   *
   * Medical is optional.
   * ======================================================= */

  useEffect(() => {

    if (!open) {
      return;
    }

    if (!form.candidate_id) {

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
            form.candidate_id,
          );

        if (error) {
          throw error;
        }

        if (active) {

          setMedicals(
            data ?? [],
          );

        }

      } catch (error) {

        console.error(
          "Failed to load medical records:",
          error,
        );

        if (active) {

          setMedicals([]);

          toast.error(
            "Failed to load medical records.",
            "Please try again.",
          );

        }

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
    form.candidate_id,
  ]);


  /* =======================================================
   * CHANGE HELPER
   * ======================================================= */

  function updateField<
    K extends keyof MofaInput
  >(
    field: K,
    value: MofaInput[K],
  ) {

    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setDirty(true);

  }


  /* =======================================================
   * CANDIDATE CHANGE
   * ======================================================= */

  function handleCandidateChange(
    candidateId: string,
  ) {

    setForm(
      (current) => ({
        ...current,

        candidate_id:
          candidateId,

        /*
         * Medical belongs to candidate.
         *
         * When candidate changes,
         * clear previous medical.
         */

        medical_id:
          null,
      }),
    );

    setDirty(true);

  }


  /* =======================================================
   * STAGE CHANGE
   * ======================================================= */

  function handleStageChange(
    stage: MofaStage,
  ) {

    updateField(
      "stage",
      stage,
    );

  }


  /* =======================================================
   * MEDICAL LABEL
   * ======================================================= */

  function getMedicalLabel(
    medical: MofaMedical,
  ) {

    const date =
      medical.medical_date
        ? new Date(
            medical.medical_date,
          ).toLocaleDateString()
        : "No date";

    const fitDate =
      medical.fit_date
        ? new Date(
            medical.fit_date,
          ).toLocaleDateString()
        : null;

    return [
      date,
      medical.status.toUpperCase(),
      fitDate
        ? `Fit: ${fitDate}`
        : null,
    ]
      .filter(Boolean)
      .join(" • ");

  }


  /* =======================================================
   * VALIDATION
   * ======================================================= */

  function validate(): string | null {

    if (!form.candidate_id) {

      return "Please select a candidate.";

    }

    if (
      !form.application_number.trim()
    ) {

      return "Application number is required.";

    }

    /*
     * Medical is optional for MOFA.
     *
     * Medical is required only for:
     *
     * medupdated
     * approved
     */

    if (
      (
        form.stage ===
          "medupdated" ||
        form.stage ===
          "approved"
      ) &&
      !form.medical_id
    ) {

      return (
        "A medical record is required for this stage."
      );

    }

    return null;

  }


  /* =======================================================
   * SUBMIT
   * ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    const validationError =
      validate();

    if (validationError) {

      toast.error(
        "Cannot save MOFA.",
        validationError,
      );

      return;

    }

    try {

      setSaving(true);

      const input: MofaInput = {

        candidate_id:
          form.candidate_id,

        medical_id:
          form.medical_id ||
          null,

        agency_id:
          form.agency_id ||
          null,

        application_number:
          form.application_number.trim(),

        application_date:
          form.application_date ||
          null,

        trade:
          form.trade?.trim() ||
          null,

        stage:
          form.stage,

      };

      const result =
        isEditing && mofa
          ? await updateMofa(
              mofa.id,
              input,
            )
          : await createMofa(
              input,
            );

      if (result.error) {
        throw result.error;
      }

      toast.success(
        isEditing
          ? "MOFA updated."
          : "MOFA created.",
        isEditing
          ? "The MOFA record was updated successfully."
          : "The MOFA record was created successfully.",
      );

      setDirty(false);

      onSuccess();

    } catch (error) {

      console.error(
        "MOFA save error:",
        error,
      );

      /*
       * Keep the real Supabase
       * error visible in console.
       */

      toast.error(
        isEditing
          ? "Failed to update MOFA."
          : "Failed to create MOFA.",
        error instanceof Error
          ? error.message
          : "Please check the information and try again.",
      );

    } finally {

      setSaving(false);

    }

  }


  /* =======================================================
   * CLOSE
   * ======================================================= */

  function handleOpenChange(
    nextOpen: boolean,
  ) {

    onOpenChange(
      nextOpen,
    );

  }


  /* =======================================================
   * RENDER
   *
   * IMPORTANT:
   *
   * UniversalSheet already owns
   * the <form>.
   *
   * Therefore we MUST NOT create
   * another <form> here.
   * ======================================================= */

  return (
    <UniversalSheet

      open={
        open
      }

      onOpenChange={
        handleOpenChange
      }

      title={
        isEditing
          ? "Edit MOFA"
          : "Create MOFA"
      }

      description={
        isEditing
          ? "Update the MOFA application details."
          : "Create a new MOFA application for a candidate."
      }

      /*
       * IMPORTANT:
       * UniversalSheet uses hasChanges,
       * NOT dirty.
       */
      hasChanges={
        dirty
      }

      /*
       * UniversalSheet already supports
       * submit handling.
       */
      onSubmit={
        handleSubmit
      }

      /*
       * Do NOT pass className here.
       * The shared UniversalSheet contract
       * is intentionally left unchanged.
       */

    >

      {/* =================================================
       * CANDIDATE
       * ================================================= */}

      <div
        className="
          space-y-2
        "
      >

        <Label
          htmlFor="mofa-candidate"
        >
          Candidate
        </Label>


        <Select

          value={
            form.candidate_id
          }

          onValueChange={
            handleCandidateChange
          }

          disabled={
            saving
          }

        >

          <SelectTrigger
            id="mofa-candidate"
          >

            <SelectValue
              placeholder="
                Select candidate
              "
            />

          </SelectTrigger>


          <SelectContent>

            {candidates.length ===
              0 ? (

              <SelectItem
                value="__empty"
                disabled
              >
                No candidates found
              </SelectItem>

            ) : (

              candidates.map(
                (
                  candidate,
                ) => (

                  <SelectItem
                    key={
                      candidate.id
                    }
                    value={
                      candidate.id
                    }
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <span>
                        {
                          candidate.name
                        }
                      </span>

                      <span
                        className="
                          text-muted-foreground
                        "
                      >
                        •{" "}
                        {
                          candidate.passport_no
                        }
                      </span>

                    </div>

                  </SelectItem>

                ),
              )

            )}

          </SelectContent>

        </Select>


        {currentCandidate && (

          <p
            className="
              text-xs
              text-muted-foreground
            "
          >

            Passport:{" "}

            <span
              className="
                font-medium
                text-foreground
              "
            >
              {
                currentCandidate.passport_no
              }
            </span>

            {currentCandidate.agent?.name && (
              <>
                {" • "}
                Agent:{" "}
                {
                  currentCandidate.agent.name
                }
              </>
            )}

          </p>

        )}

      </div>


      {/* =================================================
       * MEDICAL
       * ================================================= */}

      <div
        className="
          space-y-2
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <Label
            htmlFor="mofa-medical"
          >
            Medical
          </Label>

          <span
            className="
              text-xs
              text-muted-foreground
            "
          >
            Optional
          </span>

        </div>


        <Select

          value={
            form.medical_id ??
            "__none"
          }

          onValueChange={
            (value) => {

              updateField(
                "medical_id",
                value === "__none"
                  ? null
                  : value,
              );

            }
          }

          disabled={
            saving ||
            !form.candidate_id ||
            medicalLoading
          }

        >

          <SelectTrigger
            id="mofa-medical"
          >

            <SelectValue
              placeholder={
                !form.candidate_id
                  ? "Select candidate first"
                  : medicalLoading
                    ? "Loading medical records..."
                    : "Select medical"
              }
            />

          </SelectTrigger>


          <SelectContent>

            <SelectItem
              value="__none"
            >
              No medical
            </SelectItem>


            {medicals.map(
              (
                medical,
              ) => (

                <SelectItem
                  key={
                    medical.id
                  }
                  value={
                    medical.id
                  }
                >
                  {
                    getMedicalLabel(
                      medical,
                    )
                  }
                </SelectItem>

              ),
            )}

          </SelectContent>

        </Select>


        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          MOFA can be created without
          a medical record. Medical is
          required for Medical Updated
          and Approved stages.
        </p>

      </div>


      {/* =================================================
       * APPLICATION NUMBER
       * ================================================= */}

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


        <Input

          id="mofa-application-number"

          value={
            form.application_number
          }

          onChange={
            (event) =>
              updateField(
                "application_number",
                event.target.value,
              )
          }

          placeholder="
            Enter application number
          "

          disabled={
            saving
          }

        />

      </div>


      {/* =================================================
       * APPLICATION DATE
       * ================================================= */}

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

          id="mofa-application-date"

          type="date"

          value={
            form.application_date ??
            ""
          }

          onChange={
            (event) =>
              updateField(
                "application_date",
                event.target.value,
              )
          }

          disabled={
            saving
          }

        />

      </div>


      {/* =================================================
       * TRADE
       * ================================================= */}

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
            form.trade ??
            ""
          }

          onChange={
            (event) =>
              updateField(
                "trade",
                event.target.value,
              )
          }

          placeholder="
            Enter trade
          "

          disabled={
            saving
          }

        />

      </div>


      {/* =================================================
       * AGENCY
       * ================================================= */}

      <div
        className="
          space-y-2
        "
      >

        <Label
          htmlFor="mofa-agency"
        >
          Agency
        </Label>


        <Select

          value={
            form.agency_id ??
            "__none"
          }

          onValueChange={
            (value) =>
              updateField(
                "agency_id",
                value === "__none"
                  ? null
                  : value,
              )
          }

          disabled={
            saving ||
            agenciesLoading
          }

        >

          <SelectTrigger
            id="mofa-agency"
          >

            <SelectValue
              placeholder={
                agenciesLoading
                  ? "Loading agencies..."
                  : "Select agency"
              }
            />

          </SelectTrigger>


          <SelectContent>

            <SelectItem
              value="__none"
            >
              No agency
            </SelectItem>


            {agencies.map(
              (
                agency,
              ) => (

                <SelectItem
                  key={
                    agency.id
                  }
                  value={
                    agency.id
                  }
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <span>
                      {
                        agency.name
                      }
                    </span>

                    {agency.code && (
                      <span
                        className="
                          text-muted-foreground
                        "
                      >
                        (
                        {
                          agency.code
                        }
                        )
                      </span>
                    )}

                  </div>

                </SelectItem>

              ),
            )}

          </SelectContent>

        </Select>

      </div>


      {/* =================================================
       * STAGE
       * ================================================= */}

      <div
        className="
          space-y-2
        "
      >

        <Label
          htmlFor="mofa-stage"
        >
          Stage
        </Label>


        <Select

          value={
            form.stage
          }

          onValueChange={
            (value) =>
              handleStageChange(
                value as MofaStage,
              )
          }

          disabled={
            saving
          }

        >

          <SelectTrigger
            id="mofa-stage"
          >

            <SelectValue
              placeholder="
                Select stage
              "
            />

          </SelectTrigger>


          <SelectContent>

            {stageOptions.map(
              (
                option,
              ) => (

                <SelectItem
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </SelectItem>

              ),
            )}

          </SelectContent>

        </Select>


        {(
          form.stage ===
            "medupdated" ||
          form.stage ===
            "approved"
        ) && (

          <p
            className="
              text-xs
              text-amber-600
            "
          >
            A medical record is required
            for this stage.
          </p>

        )}

      </div>

    </UniversalSheet>
  );
}