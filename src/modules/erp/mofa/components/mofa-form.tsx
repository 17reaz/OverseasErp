import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

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

import { toast } from "@/components/shared/toast/toast";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

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
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/* =========================================================
 * CONSTANTS
 * ========================================================= */

const NONE_VALUE = "__none";

const emptyForm: MofaInput = {
  candidate_id: "",
  medical_id: null,
  agency_id: null,
  application_number: "",
  application_date: "",
  trade: "",
  stage: "new",
};

const stageOptions: { value: MofaStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "medupdated", label: "Medical Updated" },
  { value: "approved", label: "Approved" },
  { value: "canceled", label: "Canceled" },
];

/* =========================================================
 * HELPERS
 * ========================================================= */

/** Stages that cannot be saved without a medical record. */
function stageRequiresMedical(stage: MofaStage) {
  return stage === "medupdated" || stage === "approved";
}

function getMedicalLabel(medical: MofaMedical) {
  const date = medical.medical_date
    ? new Date(medical.medical_date).toLocaleDateString()
    : "No date";

  const fitDate = medical.fit_date
    ? new Date(medical.fit_date).toLocaleDateString()
    : null;

  return [date, medical.status.toUpperCase(), fitDate ? `Fit: ${fitDate}` : null]
    .filter(Boolean)
    .join(" • ");
}

interface FieldProps {
  label: string;
  htmlFor: string;
  labelRight?: ReactNode;
  children: ReactNode;
}

function Field({ label, htmlFor, labelRight, children }: FieldProps) {
  return (
    <div className="space-y-2">
      {labelRight ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={htmlFor}>{label}</Label>
          {labelRight}
        </div>
      ) : (
        <Label htmlFor={htmlFor}>{label}</Label>
      )}

      {children}
    </div>
  );
}

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
  const [form, setForm] = useState<MofaInput>(emptyForm);

  const [medicals, setMedicals] = useState<MofaMedical[]>([]);
  const [medicalLoading, setMedicalLoading] = useState(false);

  const [agencies, setAgencies] = useState<MofaAgency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const isEditing = Boolean(mofa);

  const currentCandidate = useMemo(() => {
    if (selectedCandidate) {
      return selectedCandidate;
    }

    if (!form.candidate_id) {
      return null;
    }

    return (
      candidates.find((candidate) => candidate.id === form.candidate_id) ?? null
    );
  }, [selectedCandidate, form.candidate_id, candidates]);

  /* =======================================================
   * RESET FORM
   * ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mofa) {
      setForm({
        candidate_id: mofa.candidate_id,
        medical_id: mofa.medical_id,
        agency_id: mofa.agency_id,
        application_number: mofa.application_number ?? "",
        application_date: mofa.application_date ?? "",
        trade: mofa.trade ?? "",
        stage: mofa.stage,
      });
    } else {
      setForm({
        ...emptyForm,
        candidate_id: selectedCandidate?.id ?? "",
      });
    }

    setDirty(false);
  }, [open, mofa, selectedCandidate]);

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
        setAgenciesLoading(true);

        const { data, error } = await getMofaAgencies();

        if (error) {
          throw error;
        }

        if (active) {
          setAgencies(data ?? []);
        }
      } catch (error) {
        console.error("Failed to load agencies:", error);

        if (active) {
          toast.error("Failed to load agencies.", "Please try again.");
        }
      } finally {
        if (active) {
          setAgenciesLoading(false);
        }
      }
    }

    void loadAgencies();

    return () => {
      active = false;
    };
  }, [open]);

  /* =======================================================
   * LOAD MEDICALS (medical is optional)
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
        setMedicalLoading(true);

        const { data, error } = await getCandidateMedicals(form.candidate_id);

        if (error) {
          throw error;
        }

        if (active) {
          setMedicals(data ?? []);
        }
      } catch (error) {
        console.error("Failed to load medical records:", error);

        if (active) {
          setMedicals([]);
          toast.error("Failed to load medical records.", "Please try again.");
        }
      } finally {
        if (active) {
          setMedicalLoading(false);
        }
      }
    }

    void loadMedicals();

    return () => {
      active = false;
    };
  }, [open, form.candidate_id]);

  /* =======================================================
   * CHANGE HANDLERS
   * ======================================================= */

  function updateField<K extends keyof MofaInput>(
    field: K,
    value: MofaInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  }

  function handleCandidateChange(candidateId: string) {
    setForm((current) => ({
      ...current,
      candidate_id: candidateId,

      // Medical belongs to the candidate: clear it when candidate changes.
      medical_id: null,
    }));

    setDirty(true);
  }

  /* =======================================================
   * VALIDATION
   * ======================================================= */

  function validate(): string | null {
    if (!form.candidate_id) {
      return "Please select a candidate.";
    }

    // Medical is optional, except for "medupdated" and "approved".
    if (stageRequiresMedical(form.stage) && !form.medical_id) {
      return "A medical record is required for this stage.";
    }

    return null;
  }

  /* =======================================================
   * SUBMIT
   * ======================================================= */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      toast.error("Cannot save MOFA.", validationError);
      return;
    }

    try {
      setSaving(true);

      const input: MofaInput = {
        candidate_id: form.candidate_id,
        medical_id: form.medical_id || null,
        agency_id: form.agency_id || null,
        application_number: form.application_number?.trim() || null,
        application_date: form.application_date || null,
        trade: form.trade?.trim() || null,
        stage: form.stage,
      };

      const result =
        isEditing && mofa
          ? await updateMofa(mofa.id, input)
          : await createMofa(input);

      if (result.error) {
        throw result.error;
      }

      toast.success(
        isEditing ? "MOFA updated." : "MOFA created.",
        isEditing
          ? "The MOFA record was updated successfully."
          : "The MOFA record was created successfully.",
      );

      setDirty(false);
      onSuccess();
    } catch (error) {
      // Keep the real Supabase error visible in the console.
      console.error("MOFA save error:", error);

      toast.error(
        isEditing ? "Failed to update MOFA." : "Failed to create MOFA.",
        error instanceof Error
          ? error.message
          : "Please check the information and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
   * RENDER
   *
   * IMPORTANT:
   * - UniversalSheet already owns the <form>, so do NOT
   *   create another <form> here.
   * - UniversalSheet uses `hasChanges`, NOT `dirty`.
   * - Do NOT pass className; the shared UniversalSheet
   *   contract is intentionally left unchanged.
   * ======================================================= */

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit MOFA" : "Create MOFA"}
      description={
        isEditing
          ? "Update the MOFA application details."
          : "Create a new MOFA application for a candidate."
      }
      hasChanges={dirty}
      onSubmit={handleSubmit}
    >
      {/* CANDIDATE */}
      <Field label="Candidate" htmlFor="mofa-candidate">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              disabled={saving}
              className="w-full justify-between font-normal"
            >
              {currentCandidate ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{currentCandidate.name}</span>

                  {currentCandidate.passport_no && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {currentCandidate.passport_no}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Select candidate</span>
              )}

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
          >
            <Command>
              <CommandInput placeholder="Search candidate or passport..." />

              <CommandList>
                <CommandEmpty>No candidate found.</CommandEmpty>

                <CommandGroup>
                  {candidates.map((candidate) => (
                    <CommandItem
                      key={candidate.id}
                      value={`${candidate.name} ${candidate.passport_no ?? ""}`}
                      onSelect={() => handleCandidateChange(candidate.id)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          form.candidate_id === candidate.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />

                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{candidate.name}</span>

                        {candidate.passport_no && (
                          <span className="text-xs text-muted-foreground">
                            {candidate.passport_no}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {currentCandidate && (
          <p className="text-xs text-muted-foreground">
            Passport:{" "}
            <span className="font-medium text-foreground">
              {currentCandidate.passport_no}
            </span>

            {currentCandidate.agent?.name && (
              <>
                {" • "}
                Agent: {currentCandidate.agent.name}
              </>
            )}
          </p>
        )}
      </Field>

      {/* MEDICAL */}
      <Field
        label="Medical"
        htmlFor="mofa-medical"
        labelRight={
          <span className="text-xs text-muted-foreground">Optional</span>
        }
      >
        <Select
          value={form.medical_id ?? NONE_VALUE}
          onValueChange={(value) =>
            updateField("medical_id", value === NONE_VALUE ? null : value)
          }
          disabled={saving || !form.candidate_id || medicalLoading}
        >
          <SelectTrigger id="mofa-medical">
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
            <SelectItem value={NONE_VALUE}>No medical</SelectItem>

            {medicals.map((medical) => (
              <SelectItem key={medical.id} value={medical.id}>
                {getMedicalLabel(medical)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground">
          MOFA can be created without a medical record. Medical is required for
          Medical Updated and Approved stages.
        </p>
      </Field>

      {/* APPLICATION NUMBER */}
      <Field
        label="Application Number"
        htmlFor="mofa-application-number"
        labelRight={
          <span className="text-xs text-muted-foreground">Optional</span>
        }
      >
        <Input
          id="mofa-application-number"
          value={form.application_number ?? ""}
          onChange={(event) =>
            updateField("application_number", event.target.value)
          }
          placeholder="Enter application number"
          disabled={saving}
        />
      </Field>

      {/* APPLICATION DATE */}
      <Field label="Application Date" htmlFor="mofa-application-date">
        <Input
          id="mofa-application-date"
          type="date"
          value={form.application_date ?? ""}
          onChange={(event) =>
            updateField("application_date", event.target.value)
          }
          disabled={saving}
        />
      </Field>

      {/* TRADE */}
      <Field label="Trade" htmlFor="mofa-trade">
        <Input
          id="mofa-trade"
          value={form.trade ?? ""}
          onChange={(event) => updateField("trade", event.target.value)}
          placeholder="Enter trade"
          disabled={saving}
        />
      </Field>

      {/* AGENCY */}
      <Field label="Agency" htmlFor="mofa-agency">
        <Select
          value={form.agency_id ?? NONE_VALUE}
          onValueChange={(value) =>
            updateField("agency_id", value === NONE_VALUE ? null : value)
          }
          disabled={saving || agenciesLoading}
        >
          <SelectTrigger id="mofa-agency">
            <SelectValue
              placeholder={
                agenciesLoading ? "Loading agencies..." : "Select agency"
              }
            />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={NONE_VALUE}>No agency</SelectItem>

            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id}>
                <div className="flex items-center gap-2">
                  <span>{agency.name}</span>

                  {agency.code && (
                    <span className="text-muted-foreground">
                      ({agency.code})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* STAGE */}
      <Field label="Stage" htmlFor="mofa-stage">
        <Select
          value={form.stage}
          onValueChange={(value) => updateField("stage", value as MofaStage)}
          disabled={saving}
        >
          <SelectTrigger id="mofa-stage">
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>

          <SelectContent>
            {stageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {stageRequiresMedical(form.stage) && (
          <p className="text-xs text-amber-600">
            A medical record is required for this stage.
          </p>
        )}
      </Field>
    </UniversalSheet>
  );
}
