import { useEffect, useMemo, useState, type FormEvent } from "react";

import { AlertCircle, Check, ChevronsUpDown, Lock } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { cn } from "@/lib/utils";

import {
  FormDate,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/modules/erp/shared/ui/form-field";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";
import { FormSection } from "@/modules/erp/shared/forms/form-section";

import { createVisa, updateVisa, type Visa } from "../visa-service";

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
  application_number: string | null;
}

interface VisaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Visa | null;
  candidates: CandidateOption[];
  agencies: AgencyOption[];
  mofas: MofaOption[];
  prefill?: {
    candidate_id: string;
    mofa_id: string;
  } | null;
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

interface Option {
  value: string;
  label: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const VISA_TYPE_OPTIONS: readonly Option[] = [
  { value: "amel_id", label: "Amel ID" },
  { value: "one_year", label: "1 Year" },
  { value: "mahara", label: "Mahara" },
  { value: "ewan", label: "Ewan" },
  { value: "initial", label: "Initial" },
  { value: "sasko", label: "Sasko" },
];

const VISA_STATUS_OPTIONS: readonly Option[] = [
  { value: "processing", label: "Processing" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "delivered", label: "Delivered" },
];

const DEFAULT_FORM: FormState = {
  candidate_id: "",
  mofa_id: "",
  visa_no: "",
  visa_date: "",
  expiry_date: "",
  visa_type: "amel_id",
  status: "processing",
  agency_id: "",
  remarks: "",
};

/* =========================================================
   OPTION TOGGLE GROUP
   ---------------------------------------------------------
   Visa Type ar Status duto jaygay ekii UI chilo (raw
   <button> diye banano), ekhon ekta shadcn ToggleGroup
   component ey merge kora hoyeche.
========================================================= */

interface OptionToggleGroupProps {
  id: string;
  label: string;
  value: string;
  options: readonly Option[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

function OptionToggleGroup({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: OptionToggleGroupProps) {
  return (
    <div className="space-y-2">
      <Label id={`${id}-label`}>{label}</Label>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        // Radix single toggle selected item e abar click korle "" pathay.
        // Age-r moto selection jeno na jay, tai empty value ignore kora hocche.
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        className="grid w-full grid-cols-3 gap-1.5"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={cn(
              "h-8 w-full rounded-md border px-2 text-xs font-medium",
              "data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
            )}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

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
  prefill,
  onSuccess,
}: VisaFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [advanceStage, setAdvanceStage] = useState(true);

  const isEdit = Boolean(record);

  /* =======================================================
     CURRENT CANDIDATE
  ======================================================= */

  const currentCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.id === form.candidate_id) ??
      null,
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
    form.visa_type !== DEFAULT_FORM.visa_type ||
    form.status !== DEFAULT_FORM.status ||
    form.agency_id !== "" ||
    form.remarks !== "";

  /* =======================================================
     LOAD RECORD
  ======================================================= */

  useEffect(() => {
    if (!open) return;

    if (record) {
      setForm({
        candidate_id: record.candidate_id,
        mofa_id: record.mofa_id ?? "",
        visa_no: record.visa_no ?? "",
        visa_date: record.visa_date ?? "",
        expiry_date: record.expiry_date ?? "",
        visa_type: record.visa_type ?? "amel_id",
        status: record.status ?? "processing",
        agency_id: record.agency_id ?? "",
        remarks: record.remarks ?? "",
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        candidate_id: prefill?.candidate_id ?? DEFAULT_FORM.candidate_id,
        mofa_id: prefill?.mofa_id ?? DEFAULT_FORM.mofa_id,
      });
    }

    setCandidateOpen(false);
    setError("");
  }, [open, record, prefill]);

  /* =======================================================
     AVAILABLE MOFAS
     ---------------------------------------------------
     Candidate onujayi filter kora hocche. Existing record
     er mofa_id filter theke bad porleo seta jeno list e
     thake, noyle select box e dekhabe na / change kora
     jabe na.
  ======================================================= */

  const availableMofas = useMemo(() => {
    if (!form.candidate_id) return [];

    const filtered = mofas.filter(
      (mofa) => mofa.candidate_id === form.candidate_id,
    );

    if (form.mofa_id && !filtered.some((mofa) => mofa.id === form.mofa_id)) {
      const current = mofas.find((mofa) => mofa.id === form.mofa_id);

      if (current) {
        filtered.push(current);
      }
    }

    return filtered;
  }, [mofas, form.candidate_id, form.mofa_id]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError("Please select a candidate.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        mofa_id: form.mofa_id || null,
        visa_no: form.visa_no.trim() || null,
        visa_date: form.visa_date || null,
        expiry_date: form.expiry_date || null,
        visa_type: form.visa_type || "amel_id",
        status: form.status.trim() || "processing",
        agency_id: form.agency_id || null,
        remarks: form.remarks.trim() || null,
      };

      let savedRecord: Visa;

      if (record) {
        savedRecord = await updateVisa(record.id, input);
      } else {
        savedRecord = await createVisa({
          candidate_id: form.candidate_id,
          ...input,
          advance_stage: advanceStage,
        });
      }

      onSuccess?.(savedRecord);
      onOpenChange(false);
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save visa record.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     OPTIONS
  ======================================================= */

  const agencyOptions = agencies.map((agency) => ({
    value: agency.id,
    label: agency.name,
  }));

  const mofaOptions = availableMofas.map((mofa) => ({
    value: mofa.id,
    label: mofa.application_number ?? "No application number",
  }));

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
      title={isEdit ? "Edit Visa" : "Create Visa"}
      description={
        isEdit
          ? "Update the visa record details."
          : "Record a new candidate visa."
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Visa" : "Create Visa"}
      loading={saving}
      disabled={saving || !form.candidate_id}
      hasChanges={hasChanges}
    >
      {/* ERROR */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* CANDIDATE */}
      <FormSection
        title="Candidate"
        description={
          isEdit
            ? "The candidate can't be changed on an existing visa."
            : "Choose who this visa is for."
        }
      >
        <div className="space-y-2">
          <Label htmlFor="visa-candidate">
            Candidate
            {!isEdit && <span className="text-destructive">*</span>}
          </Label>

          {isEdit ? (
            <div
              id="visa-candidate"
              className="flex min-h-10 w-full items-center justify-between rounded-md border bg-muted/40 px-3 py-2"
            >
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
                  <p className="text-sm text-muted-foreground">Candidate</p>
                )}
              </div>

              <Lock className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ) : (
            <Popover open={candidateOpen} onOpenChange={setCandidateOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="visa-candidate"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={candidateOpen}
                  disabled={saving}
                  className="h-auto min-h-10 w-full justify-between py-2 font-normal"
                >
                  {currentCandidate ? (
                    <span className="min-w-0 truncate text-left">
                      {currentCandidate.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {currentCandidate.passport_no}
                      </span>
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
                              "mr-2 h-4 w-4 shrink-0",
                              form.candidate_id === candidate.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {candidate.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
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

        {!isEdit && (
          <div className="mt-4 flex items-start gap-2.5">
            <Checkbox
              id="visa-advance-stage"
              checked={advanceStage}
              onCheckedChange={(checked) => setAdvanceStage(checked === true)}
              disabled={saving}
              className="mt-0.5"
            />

            <div className="space-y-1">
              <Label
                htmlFor="visa-advance-stage"
                className="cursor-pointer leading-none"
              >
                Move candidate to Visa stage
              </Label>
              <p className="text-xs text-muted-foreground">
                The candidate's stage updates automatically after the visa is
                created.
              </p>
            </div>
          </div>
        )}
      </FormSection>

      {/* VISA INFORMATION */}
      <FormSection
        title="Visa Information"
        description="Visa number, type and current status."
      >
        <div className="space-y-4">
          <FormInput
            id="visa-no"
            label="Visa No"
            value={form.visa_no}
            onChange={(event) => updateField("visa_no", event.target.value)}
            placeholder="Enter visa number (optional)"
            disabled={saving}
          />

          <OptionToggleGroup
            id="visa-type"
            label="Visa Type"
            value={form.visa_type}
            options={VISA_TYPE_OPTIONS}
            disabled={saving}
            onChange={(value) => updateField("visa_type", value)}
          />

          <OptionToggleGroup
            id="visa-status"
            label="Status"
            value={form.status}
            options={VISA_STATUS_OPTIONS}
            disabled={saving}
            onChange={(value) => updateField("status", value)}
          />
        </div>
      </FormSection>

      {/* VISA DATES */}
      <FormSection
        title="Visa Dates"
        description="When the visa was issued and when it expires."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormDate
            id="visa-date"
            label="Visa Date"
            value={form.visa_date}
            onChange={(event) => updateField("visa_date", event.target.value)}
            disabled={saving}
          />

          <FormDate
            id="visa-expiry"
            label="Expiry Date"
            value={form.expiry_date}
            onChange={(event) =>
              updateField("expiry_date", event.target.value)
            }
            disabled={saving}
          />
        </div>
      </FormSection>

      {/* AGENCY & MOFA */}
      <FormSection
        title="Agency & MOFA"
        description="Optional. Link an agency and a MOFA application."
      >
        <div className="space-y-4">
          <FormSelect
            label="Agency"
            placeholder="Select agency (optional)"
            value={form.agency_id}
            onValueChange={(value) => updateField("agency_id", value)}
            disabled={saving}
            options={agencyOptions}
          />

          <FormSelect
            label="MOFA Application"
            placeholder={
              form.candidate_id
                ? "Select MOFA (optional)"
                : "Select candidate first"
            }
            value={form.mofa_id}
            onValueChange={(value) => updateField("mofa_id", value)}
            disabled={saving || !form.candidate_id}
            options={mofaOptions}
          />
        </div>
      </FormSection>

      {/* REMARKS */}
      <FormSection
        title="Remarks"
        description="Anything else worth noting about this visa."
      >
        <FormTextarea
          id="visa-remarks"
          label="Remarks"
          value={form.remarks}
          onChange={(event) => updateField("remarks", event.target.value)}
          placeholder="Add remarks..."
          rows={3}
          disabled={saving}
        />
      </FormSection>
    </UniversalSheet>
  );
}
