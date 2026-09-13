import {
  Check,
  ChevronsUpDown,
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

import {
  cn,
} from "@/lib/utils";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { UniversalSheet } from "../../shared/forms/universal-sheet";

import {
  createPoliceClearance,
  updatePoliceClearance,
  type PoliceClearance,
} from "../police-clearance-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface PoliceClearanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: PoliceClearance | null;
  candidates: CandidateOption[];
  onSuccess?: (record: PoliceClearance) => void;
}

interface FormState {
  candidate_id: string;
  received_date: string;
  verified: boolean;
  verified_date: string;
  remarks: string;
}

const DEFAULT_FORM: FormState = {
  candidate_id: "",
  received_date: "",
  verified: false,
  verified_date: "",
  remarks: "",
};

export function PoliceClearanceForm({
  open,
  onOpenChange,
  record,
  candidates,
  onSuccess,
}: PoliceClearanceFormProps) {
  const [form, setForm] =
    useState<FormState>(DEFAULT_FORM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
   * DIRTY STATE
   * ======================================================= */

  const [dirty, setDirty] = useState(false);

  const isEdit = Boolean(record);
const [candidateOpen, setCandidateOpen] = useState(false);
const currentCandidate =
  candidates.find(
    (candidate) =>
      candidate.id === form.candidate_id,
  ) ?? null;
  useEffect(() => {
  if (!open) {
    return;
  }

  if (record) {
    setForm({
      candidate_id: record.candidate_id,
      received_date:
        record.received_date ?? "",
      verified: record.verified,
      verified_date:
        record.verified_date ?? "",
      remarks: record.remarks ?? "",
    });
  } else {
    setForm(DEFAULT_FORM);
  }

  setCandidateOpen(false);
  setError("");
  setDirty(false);
}, [open, record]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setDirty(true);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError("Please select a candidate.");
      return;
    }

    if (form.verified && !form.verified_date) {
      setError(
        "Please select the verification date.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        received_date:
          form.received_date || null,

        verified: form.verified,

        verified_date: form.verified
          ? form.verified_date || null
          : null,

        remarks:
          form.remarks.trim() || null,
      };

      let savedRecord: PoliceClearance;

      if (record) {
        savedRecord =
          await updatePoliceClearance(
            record.id,
            input,
          );
      } else {
        savedRecord =
          await createPoliceClearance({
            candidate_id:
              form.candidate_id,
            ...input,
          });
      }

      onSuccess?.(savedRecord);

      setDirty(false);

      onOpenChange(false);

      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save police clearance.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? "Edit Police Clearance"
          : "Create Police Clearance"
      }
      description={
        isEdit
          ? "Update the police clearance record."
          : "Record a new hard-copy police clearance certificate."
      }
      hasChanges={dirty}
      onSubmit={handleSubmit}
      submitLabel={
        isEdit ? "Update PCC" : "Create PCC"
      }
      loading={saving}
      disabled={!form.candidate_id}
    >
      <div className="flex flex-col gap-5">
        {/* Candidate */}
<div className="space-y-2">
  <Label htmlFor="pcc-candidate">
    Candidate{" "}
    <span className="text-destructive">
      *
    </span>
  </Label>

  <Popover
    open={candidateOpen}
    onOpenChange={setCandidateOpen}
  >
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={candidateOpen}
        disabled={isEdit || saving}
        className="w-full justify-between font-normal"
      >
        {currentCandidate ? (
          <span className="truncate">
            {currentCandidate.name} —{" "}
            {currentCandidate.passport_no}
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
          <CommandEmpty>
            No candidate found.
          </CommandEmpty>

          <CommandGroup>
            {candidates.map((candidate) => (
              <CommandItem
                key={candidate.id}
                value={`${candidate.name} ${candidate.passport_no}`}
                onSelect={() => {
                  updateField(
                    "candidate_id",
                    candidate.id,
                  );

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

  {isEdit && (
    <p className="text-xs text-muted-foreground">
      Candidate cannot be changed after
      the PCC record is created.
    </p>
  )}
</div>
        {/* Received Date */}
        <div className="space-y-2">
          <Label htmlFor="pcc-received-date">
            Received Date
          </Label>

          <Input
            id="pcc-received-date"
            type="date"
            value={form.received_date}
            onChange={(event) =>
              updateField(
                "received_date",
                event.target.value,
              )
            }
            disabled={saving}
          />

          <p className="text-xs text-muted-foreground">
            Date the physical PCC was received.
          </p>
        </div>

        {/* Verified */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="pcc-verified">
              Verified
            </Label>

            <p className="text-xs text-muted-foreground">
              Mark after manual checking.
            </p>
          </div>

          <Switch
            id="pcc-verified"
            checked={form.verified}
            onCheckedChange={(checked) => {
              updateField(
                "verified",
                checked,
              );

              if (!checked) {
                updateField(
                  "verified_date",
                  "",
                );
              }
            }}
            disabled={saving}
          />
        </div>

        {/* Verified Date */}
        {form.verified && (
          <div className="space-y-2">
            <Label htmlFor="pcc-verified-date">
              Verification Date{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Input
              id="pcc-verified-date"
              type="date"
              value={form.verified_date}
              onChange={(event) =>
                updateField(
                  "verified_date",
                  event.target.value,
                )
              }
              disabled={saving}
            />
          </div>
        )}

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="pcc-remarks">
            Remarks
          </Label>

          <Textarea
            id="pcc-remarks"
            placeholder="Add remarks..."
            value={form.remarks}
            onChange={(event) =>
              updateField(
                "remarks",
                event.target.value,
              )
            }
            rows={4}
            disabled={saving}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}
