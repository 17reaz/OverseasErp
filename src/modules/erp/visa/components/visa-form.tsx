import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Check,
  ChevronsUpDown,
  Lock,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

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

import { cn } from "@/lib/utils";

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
  candidate_id: string;
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

  const [candidateOpen, setCandidateOpen] =
    useState(false);

  const isEdit =
    Boolean(record);

  /* =======================================================
     CURRENT CANDIDATE
  ======================================================= */

  const currentCandidate = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.id === form.candidate_id,
      ) ?? null,
    [candidates, form.candidate_id],
  );

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

    setCandidateOpen(false);

    setError("");
  }, [
    open,
    record,
  ]);

  /* =======================================================
     AVAILABLE MOFAS
     ---------------------------------------------------
     candidate onujayi filter kora hocche, ar existing
     record er mofa_id filter theke bad porleo (kono
     karone) seta jeno list e thake, noyle select box e
     dekhabe na / change kora jabe na.
  ======================================================= */

  const availableMofas = useMemo(() => {
    if (!form.candidate_id) return [];

    const filtered = mofas.filter(
      (mofa) =>
        mofa.candidate_id === form.candidate_id,
    );

    if (
      form.mofa_id &&
      !filtered.some(
        (mofa) => mofa.id === form.mofa_id,
      )
    ) {
      const current = mofas.find(
        (mofa) => mofa.id === form.mofa_id,
      );

      if (current) {
        filtered.push(current);
      }
    }

    return filtered;
  }, [
    mofas,
    form.candidate_id,
    form.mofa_id,
  ]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
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

  const agencyOptions =
    agencies.map(
      (agency) => ({
        value: agency.id,
        label: agency.name,
      }),
    );

  const mofaOptions =
    availableMofas.map(
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
        description={
          isEdit
            ? "Candidate is locked for this visa record."
            : "Select the candidate for this visa record."
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Candidate
          </label>

          {isEdit ? (
            <div className="flex min-h-10 w-full items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                {currentCandidate ? (
                  <>
                    <p className="truncate text-sm font-medium">
                      {currentCandidate.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Passport: {currentCandidate.passport_no}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Candidate
                  </p>
                )}
              </div>

              <Lock className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ) : (
            <Popover open={candidateOpen} onOpenChange={setCandidateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={candidateOpen}
                  disabled={saving}
                  className="w-full justify-between font-normal"
                >
                  {currentCandidate ? (
                    <span className="truncate">
                      {currentCandidate.name} — {currentCandidate.passport_no}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select candidate
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
                  <CommandInput placeholder="Search name or passport..." />

                  <CommandList>
                    <CommandEmpty>No candidate found.</CommandEmpty>

                    <CommandGroup>
                      {candidates.map((candidate) => (
                        <CommandItem
                          key={candidate.id}
                          value={`${candidate.name} ${candidate.passport_no}`}
                          onSelect={() => {
                            updateField("candidate_id", candidate.id);
                            updateField("mofa_id", "");
                            setCandidateOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.candidate_id === candidate.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />

                          <div>
                            <p className="text-sm font-medium">
                              {candidate.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Passport: {candidate.passport_no}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
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
            placeholder={
              form.candidate_id
                ? "Select MOFA (optional)"
                : "Select candidate first"
            }
            value={form.mofa_id}
            onValueChange={(value) =>
              updateField(
                "mofa_id",
                value,
              )
            }
            disabled={
              saving ||
              !form.candidate_id
            }
            options={mofaOptions}
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