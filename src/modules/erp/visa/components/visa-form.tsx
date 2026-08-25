import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";
import { FormSection } from "@/modules/erp/shared/forms/form-section";

import {
  createVisa,
  updateVisa,
  type Visa,
} from "../visa-service";

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
  onOpenChange: (open: boolean) => void;
  record?: Visa | null;
  candidates: CandidateOption[];
  agencies: AgencyOption[];
  mofas: MofaOption[];
  onSuccess?: (record: Visa) => void;
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
    useState<FormState>(DEFAULT_FORM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(record);

  const hasChanges =
    form.candidate_id !== "" ||
    form.mofa_id !== "" ||
    form.visa_no !== "" ||
    form.visa_date !== "" ||
    form.expiry_date !== "" ||
    form.visa_type !== DEFAULT_FORM.visa_type ||
    form.status !== DEFAULT_FORM.status ||
    form.agency_id !== "" ||
    form.remarks !== "";

  useEffect(() => {
    if (!open) return;

    if (record) {
      setForm({
        candidate_id: record.candidate_id,
        mofa_id: record.mofa_id ?? "",
        visa_no: record.visa_no ?? "",
        visa_date: record.visa_date ?? "",
        expiry_date: record.expiry_date ?? "",
        visa_type: record.visa_type ?? "employment",
        status: record.status ?? "processing",
        agency_id: record.agency_id ?? "",
        remarks: record.remarks ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }

    setError("");
  }, [open, record]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError("Please select a candidate.");
      return;
    }

    if (!form.visa_no.trim()) {
      setError("Please enter the visa number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        mofa_id: form.mofa_id || null,
        visa_no: form.visa_no.trim(),
        visa_date: form.visa_date || null,
        expiry_date: form.expiry_date || null,
        visa_type:
          form.visa_type.trim() || "employment",
        status:
          form.status.trim() || "processing",
        agency_id: form.agency_id || null,
        remarks: form.remarks.trim() || null,
      };

      let savedRecord: Visa;

      if (record) {
        savedRecord = await updateVisa(
          record.id,
          input,
        );
      } else {
        savedRecord = await createVisa({
          candidate_id: form.candidate_id,
          ...input,
        });
      }

      onSuccess?.(savedRecord);

      onOpenChange(false);

      setForm(DEFAULT_FORM);
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

  return (
    <UniversalSheet
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          onOpenChange(next);
        }
      }}
      title={isEdit ? "Edit Visa" : "Create Visa"}
      description={
        isEdit
          ? "Update the visa record details."
          : "Record a new candidate visa."
      }
      onSubmit={handleSubmit}
      submitLabel={
        isEdit ? "Update Visa" : "Create Visa"
      }
      loading={saving}
      disabled={
        saving ||
        !form.candidate_id ||
        !form.visa_no.trim()
      }
      hasChanges={hasChanges}
    >
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <FormSection
        title="Candidate Information"
        description="Select the candidate for this visa record."
      >
        <div className="space-y-2">
          <Label htmlFor="visa-candidate">
            Candidate{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <select
            id="visa-candidate"
            value={form.candidate_id}
            onChange={(event) =>
              updateField(
                "candidate_id",
                event.target.value,
              )
            }
            disabled={isEdit || saving}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">
              Select candidate
            </option>

            {candidates.map((candidate) => (
              <option
                key={candidate.id}
                value={candidate.id}
              >
                {candidate.name} —{" "}
                {candidate.passport_no}
              </option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection
        title="Visa Information"
        description="Basic visa information and processing status."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visa-no">
              Visa No{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Input
              id="visa-no"
              value={form.visa_no}
              onChange={(event) =>
                updateField(
                  "visa_no",
                  event.target.value,
                )
              }
              placeholder="Enter visa number"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visa-type">
                Visa Type
              </Label>

              <Input
                id="visa-type"
                value={form.visa_type}
                onChange={(event) =>
                  updateField(
                    "visa_type",
                    event.target.value,
                  )
                }
                placeholder="e.g. employment"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visa-status">
                Status
              </Label>

              <Input
                id="visa-status"
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value,
                  )
                }
                placeholder="e.g. processing, issued"
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Visa Dates"
        description="Visa issue and expiry information."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="visa-date">
              Visa Date
            </Label>

            <Input
              id="visa-date"
              type="date"
              value={form.visa_date}
              onChange={(event) =>
                updateField(
                  "visa_date",
                  event.target.value,
                )
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visa-expiry">
              Expiry Date
            </Label>

            <Input
              id="visa-expiry"
              type="date"
              value={form.expiry_date}
              onChange={(event) =>
                updateField(
                  "expiry_date",
                  event.target.value,
                )
              }
              disabled={saving}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Agency & MOFA"
        description="Optional agency and MOFA information."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visa-agency">
              Agency
            </Label>

            <select
              id="visa-agency"
              value={form.agency_id}
              onChange={(event) =>
                updateField(
                  "agency_id",
                  event.target.value,
                )
              }
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">
                Select agency (optional)
              </option>

              {agencies.map((agency) => (
                <option
                  key={agency.id}
                  value={agency.id}
                >
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visa-mofa">
              MOFA Application
            </Label>

            <select
              id="visa-mofa"
              value={form.mofa_id}
              onChange={(event) =>
                updateField(
                  "mofa_id",
                  event.target.value,
                )
              }
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">
                Select MOFA (optional)
              </option>

              {mofas.map((mofa) => (
                <option
                  key={mofa.id}
                  value={mofa.id}
                >
                  {mofa.application_number}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Remarks"
        description="Additional notes for this visa record."
      >
        <Textarea
          id="visa-remarks"
          value={form.remarks}
          onChange={(event) =>
            updateField(
              "remarks",
              event.target.value,
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