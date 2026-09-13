import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UniversalSheet } from "../../shared/forms/universal-sheet";

import {
  createBmetRecord,
  updateBmetRecord,
  type BmetRecord,
} from "../bmet-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface BmetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: BmetRecord | null;
  candidates: CandidateOption[];
  onSuccess?: (record: BmetRecord) => void;
}

interface BmetFormState {
  candidate_id: string;
  pdo: boolean;
  finger: boolean;
  nominee: boolean;
  bank: boolean;
  bmet: boolean;
  bmet_date: string;
}

const DEFAULT_FORM: BmetFormState = {
  candidate_id: "",
  pdo: false,
  finger: false,
  nominee: false,
  bank: false,
  bmet: false,
  bmet_date: "",
};

export function BmetForm({
  open,
  onOpenChange,
  record,
  candidates,
  onSuccess,
}: BmetFormProps) {
  const [form, setForm] =
    useState<BmetFormState>(DEFAULT_FORM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const isEdit = Boolean(record);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      setForm({
        candidate_id: record.candidate_id,
        pdo: record.pdo,
        finger: record.finger,
        nominee: record.nominee,
        bank: record.bank,
        bmet: record.bmet,
        bmet_date: record.bmet_date ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }

    setError("");
    setDirty(false);
  }, [open, record]);

  function updateField<K extends keyof BmetFormState>(
    field: K,
    value: BmetFormState[K],
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

    setSaving(true);
    setError("");

    try {
      const input = {
        pdo: form.pdo,
        finger: form.finger,
        nominee: form.nominee,
        bank: form.bank,
        bmet: form.bmet,
        bmet_date: form.bmet_date || null,
      };

      let savedRecord: BmetRecord;

      if (record) {
        savedRecord = await updateBmetRecord(
          record.id,
          input,
        );
      } else {
        savedRecord = await createBmetRecord({
          candidate_id: form.candidate_id,
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
          : "Failed to save BMET record.",
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
          ? "Edit BMET Record"
          : "Create BMET Record"
      }
      description={
        isEdit
          ? "Update the candidate's BMET information."
          : "Create a BMET checklist for a candidate."
      }
      hasChanges={dirty}
      onSubmit={handleSubmit}
      submitLabel={
        isEdit ? "Update BMET" : "Create BMET"
      }
      loading={saving}
      disabled={!form.candidate_id}
    >
      <div className="flex flex-col gap-6">
        {/* Candidate */}
        <div className="space-y-2">
          <Label htmlFor="bmet-candidate">
            Candidate{" "}
            <span className="text-destructive">*</span>
          </Label>

          <Popover>
  <PopoverTrigger asChild>
    <Button
      type="button"
      variant="outline"
      role="combobox"
      disabled={isEdit || saving}
      className="w-full justify-between font-normal"
    >
      {form.candidate_id
        ? (() => {
            const candidate = candidates.find(
              (item) => item.id === form.candidate_id,
            );

            return candidate ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate">
                  {candidate.name}
                </span>

                <span className="shrink-0 text-xs text-muted-foreground">
                  {candidate.passport_no}
                </span>
              </div>
            ) : (
              "Select candidate"
            );
          })()
        : (
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
      <CommandInput placeholder="Search candidate or passport..." />

      <CommandList>
        <CommandEmpty>
          No candidate found.
        </CommandEmpty>

        <CommandGroup>
          {candidates.map((candidate) => (
            <CommandItem
              key={candidate.id}
              value={`${candidate.name} ${candidate.passport_no}`}
              onSelect={() =>
                updateField("candidate_id", candidate.id)
              }
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  form.candidate_id === candidate.id
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              />

              <div className="flex min-w-0 flex-col">
                <span className="truncate">
                  {candidate.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  {candidate.passport_no}
                </span>
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
              Candidate cannot be changed after the
              BMET record is created.
            </p>
          )}
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <div>
            <Label>Checklist</Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Mark each requirement when completed.
            </p>
          </div>

          <div className="rounded-lg border">
            <ChecklistItem
              id="bmet-pdo"
              label="PDO"
              checked={form.pdo}
              disabled={saving}
              onCheckedChange={(checked) =>
                updateField("pdo", checked)
              }
            />

            <ChecklistItem
              id="bmet-finger"
              label="Finger"
              checked={form.finger}
              disabled={saving}
              onCheckedChange={(checked) =>
                updateField("finger", checked)
              }
            />

            <ChecklistItem
              id="bmet-nominee"
              label="Nominee"
              checked={form.nominee}
              disabled={saving}
              onCheckedChange={(checked) =>
                updateField("nominee", checked)
              }
            />

            <ChecklistItem
              id="bmet-bank"
              label="Bank"
              checked={form.bank}
              disabled={saving}
              onCheckedChange={(checked) =>
                updateField("bank", checked)
              }
            />

            <ChecklistItem
              id="bmet-bmet"
              label="BMET"
              checked={form.bmet}
              disabled={saving}
              onCheckedChange={(checked) =>
                updateField("bmet", checked)
              }
              last
            />
          </div>
        </div>

        {/* BMET Date */}
        <div className="space-y-2">
          <Label htmlFor="bmet-date">
            BMET Date
          </Label>

          <Input
            id="bmet-date"
            type="date"
            value={form.bmet_date}
            onChange={(event) =>
              updateField(
                "bmet_date",
                event.target.value,
              )
            }
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

interface ChecklistItemProps {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  last?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ChecklistItem({
  id,
  label,
  checked,
  disabled,
  last = false,
  onCheckedChange,
}: ChecklistItemProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 px-4 py-3",
        !last ? "border-b" : "",
      ].join(" ")}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) =>
          onCheckedChange(value === true)
        }
      />

      <Label
        htmlFor={id}
        className="cursor-pointer font-normal"
      >
        {label}
      </Label>
    </div>
  );
}