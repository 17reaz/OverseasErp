import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  FormDate,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/modules/erp/shared/ui/form-field";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";
import { FormSection } from "@/modules/erp/shared/forms/form-section";

import {
  createVisa,
  updateVisa,
  type Visa,
} from "../visa-service";

/* =========================================================
   TYPES
========================================================= */

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface AgencyOption {
  id: string;
  name: string;
}

interface MofaOption {
  id: string;
  application_number: string;
}

interface VisaFormProps {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  record?: Visa | null;

  candidates: CandidateOption[];

  agencies: AgencyOption[];

  mofas: MofaOption[];

  onSuccess?: (
    record: Visa,
  ) => void;
}

interface FormState {
  candidate_id: string;
  mofa_id: string;
  visa_no: string;
  visa_date: string;
  expiry_date: string;
  visa_type: string;
  status: string;
  agency_id: string;
  remarks: string;
}

/* =========================================================
   DEFAULT
========================================================= */

const DEFAULT_FORM: FormState = {
  candidate_id: "",
  mofa_id: "",
  visa_no: "",
  visa_date: "",
  expiry_date: "",
  visa_type: "employment",
  status: "processing",
  agency_id: "",
  remarks: "",
};

/* =========================================================
   COMPONENT
========================================================= */

export function VisaForm({
  open,
  onOpenChange,
  record,
  candidates,
  agencies,
  mofas,
  onSuccess,
}: VisaFormProps) {
  const [form, setForm] =
    useState<FormState>(
      DEFAULT_FORM,
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEdit =
    Boolean(record);

  /* =======================================================
     DIRTY STATE
  ======================================================= */

  const hasChanges =
    form.candidate_id !== "" ||
    form.mofa_id !== "" ||
    form.visa_no !== "" ||
    form.visa_date !== "" ||
    form.expiry_date !== "" ||
    form.visa_type !==
      DEFAULT_FORM.visa_type ||
    form.status !==
      DEFAULT_FORM.status ||
    form.agency_id !== "" ||
    form.remarks !== "";

  /* =======================================================
     LOAD RECORD
  ======================================================= */

  useEffect(() => {
    if (!open) return;

    if (record) {
      setForm({
        candidate_id:
          record.candidate_id,

        mofa_id:
          record.mofa_id ?? "",

        visa_no:
          record.visa_no ?? "",

        visa_date:
          record.visa_date ?? "",

        expiry_date:
          record.expiry_date ?? "",

        visa_type:
          record.visa_type ??
          "employment",

        status:
          record.status ??
          "processing",

        agency_id:
          record.agency_id ?? "",

        remarks:
          record.remarks ?? "",
      });
    } else {
      setForm(
        DEFAULT_FORM,
      );
    }

    setError("");
  }, [
    open,
    record,
  ]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  function updateField<
    K extends keyof FormState,
  >(
    field: K,
    value: FormState[K],
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    );
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError(
        "Please select a candidate.",
      );
      return;
    }

    if (!form.visa_no.trim()) {
      setError(
        "Please enter the visa number.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        mofa_id:
          form.mofa_id || null,

        visa_no:
          form.visa_no.trim(),

        visa_date:
          form.visa_date || null,

        expiry_date:
          form.expiry_date || null,

        visa_type:
          form.visa_type.trim() ||
          "employment",

        status:
          form.status.trim() ||
          "processing",

        agency_id:
          form.agency_id || null,

        remarks:
          form.remarks.trim() ||
          null,
      };

      let savedRecord: Visa;

      if (record) {
        savedRecord =
          await updateVisa(
            record.id,
            input,
          );
      } else {
        savedRecord =
          await createVisa({
            candidate_id:
              form.candidate_id,

            ...input,
          });
      }

      onSuccess?.(
        savedRecord,
      );

      onOpenChange(false);

      setForm(
        DEFAULT_FORM,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save visa record.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     OPTIONS
  ======================================================= */

  const candidateOptions =
    candidates.map(
      (candidate) => ({
        value: candidate.id,

        label:
          `${candidate.name} — ${candidate.passport_no}`,
      }),
    );

  const agencyOptions =
    agencies.map(
      (agency) => ({
        value: agency.id,
        label: agency.name,
      }),
    );

  const mofaOptions =
    mofas.map(
      (mofa) => ({
        value: mofa.id,
        label:
          mofa.application_number,
      }),
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <UniversalSheet
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          onOpenChange(next);
        }
      }}
      title={
        isEdit
          ? "Edit Visa"
          : "Create Visa"
      }
      description={
        isEdit
          ? "Update the visa record details."
          : "Record a new candidate visa."
      }
      onSubmit={handleSubmit}
      submitLabel={
        isEdit
          ? "Update Visa"
          : "Create Visa"
      }
      loading={saving}
      disabled={
        saving ||
        !form.candidate_id ||
        !form.visa_no.trim()
      }
      hasChanges={
        hasChanges
      }
    >
      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ===================================================
          CANDIDATE
      =================================================== */}

      <FormSection
        title="Candidate Information"
        description="Select the candidate for this visa record."
      >
        <FormSelect
          label="Candidate"
          placeholder="Select candidate"
          value={
            form.candidate_id
          }
          onValueChange={(
            value,
          ) =>
            updateField(
              "candidate_id",
              value,
            )
          }
          disabled={
            isEdit || saving
          }
          required
          options={
            candidateOptions
          }
        />
      </FormSection>

      {/* ===================================================
          VISA INFORMATION
      =================================================== */}

      <FormSection
        title="Visa Information"
        description="Basic visa information and processing status."
      >
        <div className="space-y-4">
          <FormInput
            id="visa-no"
            label="Visa No"
            value={
              form.visa_no
            }
            onChange={(
              event,
            ) =>
              updateField(
                "visa_no",
                event.target
                  .value,
              )
            }
            placeholder="Enter visa number"
            disabled={saving}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="visa-type"
              label="Visa Type"
              value={
                form.visa_type
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "visa_type",
                  event.target
                    .value,
                )
              }
              placeholder="e.g. employment"
              disabled={saving}
            />

            <FormInput
              id="visa-status"
              label="Status"
              value={
                form.status
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "status",
                  event.target
                    .value,
                )
              }
              placeholder="e.g. processing, issued"
              disabled={saving}
            />
          </div>
        </div>
      </FormSection>

      {/* ===================================================
          VISA DATES
      =================================================== */}

      <FormSection
        title="Visa Dates"
        description="Visa issue and expiry information."
      >
        <div className="grid grid-cols-2 gap-4">
          <FormDate
            id="visa-date"
            label="Visa Date"
            value={
              form.visa_date
            }
            onChange={(
              event,
            ) =>
              updateField(
                "visa_date",
                event.target
                  .value,
              )
            }
            disabled={saving}
          />

          <FormDate
            id="visa-expiry"
            label="Expiry Date"
            value={
              form.expiry_date
            }
            onChange={(
              event,
            ) =>
              updateField(
                "expiry_date",
                event.target
                  .value,
              )
            }
            disabled={saving}
          />
        </div>
      </FormSection>

      {/* ===================================================
          AGENCY & MOFA
      =================================================== */}

      <FormSection
        title="Agency & MOFA"
        description="Optional agency and MOFA information."
      >
        <div className="space-y-4">
          <FormSelect
            label="Agency"
            placeholder="Select agency (optional)"
            value={
              form.agency_id
            }
            onValueChange={(
              value,
            ) =>
              updateField(
                "agency_id",
                value,
              )
            }
            disabled={saving}
            options={
              agencyOptions
            }
          />

          <FormSelect
            label="MOFA Application"
            placeholder="Select MOFA (optional)"
            value={
              form.mofa_id
            }
            onValueChange={(
              value,
            ) =>
              updateField(
                "mofa_id",
                value,
              )
            }
            disabled={saving}
            options={
              mofaOptions
            }
          />
        </div>
      </FormSection>

      {/* ===================================================
          REMARKS
      =================================================== */}

      <FormSection
        title="Remarks"
        description="Additional notes for this visa record."
      >
        <FormTextarea
          id="visa-remarks"
          label="Remarks"
          value={
            form.remarks
          }
          onChange={(
            event,
          ) =>
            updateField(
              "remarks",
              event.target
                .value,
            )
          }
          placeholder="Add remarks..."
          rows={3}
          disabled={saving}
        />
      </FormSection>
    </UniversalSheet>
  );
}