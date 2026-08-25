import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UniversalSheet } from "../../shared/forms/universal-sheet";

import {
  createFingerRecord,
  updateFingerRecord,
  type FingerRecord,
  type FingerStatus,
  type FingerType,
} from "../finger-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface FingerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: FingerRecord | null;
  candidates: CandidateOption[];
  onSuccess?: (record: FingerRecord) => void;
}

interface FingerFormState {
  candidate_id: string;
  finger_date: string;
  finger_type: FingerType;
  status: FingerStatus;
  remarks: string;
}

const DEFAULT_FORM: FingerFormState = {
  candidate_id: "",
  finger_date: "",
  finger_type: "fresh",
  status: "pending",
  remarks: "",
};

export function FingerForm({
  open,
  onOpenChange,
  record,
  candidates,
  onSuccess,
}: FingerFormProps) {
  const [form, setForm] =
    useState<FingerFormState>(DEFAULT_FORM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
   * DIRTY STATE
   * ======================================================= */

  const [dirty, setDirty] = useState(false);

  const isEdit = Boolean(record);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      setForm({
        candidate_id: record.candidate_id,
        finger_date: record.finger_date ?? "",
        finger_type: record.finger_type,
        status: record.status,
        remarks: record.remarks ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }

    setError("");
    setDirty(false);
  }, [open, record]);

  function updateField<K extends keyof FingerFormState>(
    field: K,
    value: FingerFormState[K],
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
        finger_date: form.finger_date || null,
        finger_type: form.finger_type,
        status: form.status,
        remarks: form.remarks.trim() || null,
      };

      let savedRecord: FingerRecord;

      if (record) {
        savedRecord = await updateFingerRecord(
          record.id,
          input,
        );
      } else {
        savedRecord = await createFingerRecord({
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
          : "Failed to save finger record.",
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
          ? "Edit Finger Record"
          : "Create Finger Record"
      }
      description={
        isEdit
          ? "Update the fingerprint record details."
          : "Create a new fingerprint record for a candidate."
      }
      hasChanges={dirty}
      onSubmit={handleSubmit}
      submitLabel={
        isEdit ? "Update Finger" : "Create Finger"
      }
      loading={saving}
      disabled={!form.candidate_id}
    >
      <div className="flex flex-col gap-5">
        {/* Candidate */}
        <div className="space-y-2">
          <Label htmlFor="finger-candidate">
            Candidate{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <Select
            value={form.candidate_id}
            onValueChange={(value) =>
              updateField(
                "candidate_id",
                value,
              )
            }
            disabled={isEdit || saving}
          >
            <SelectTrigger id="finger-candidate">
              <SelectValue placeholder="Select candidate" />
            </SelectTrigger>

            <SelectContent>
              {candidates.length === 0 ? (
                <SelectItem
                  value="__no_candidates__"
                  disabled
                >
                  No candidates found
                </SelectItem>
              ) : (
                candidates.map((candidate) => (
                  <SelectItem
                    key={candidate.id}
                    value={candidate.id}
                  >
                    {candidate.name} —{" "}
                    {candidate.passport_no}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Candidate cannot be changed after the
              finger record is created.
            </p>
          )}
        </div>

        {/* Finger Date */}
        <div className="space-y-2">
          <Label htmlFor="finger-date">
            Finger Date
          </Label>

          <Input
            id="finger-date"
            type="date"
            value={form.finger_date}
            onChange={(event) =>
              updateField(
                "finger_date",
                event.target.value,
              )
            }
            disabled={saving}
          />
        </div>

        {/* Finger Type */}
        <div className="space-y-2">
          <Label htmlFor="finger-type">
            Finger Type
          </Label>

          <Select
            value={form.finger_type}
            onValueChange={(value) =>
              updateField(
                "finger_type",
                value as FingerType,
              )
            }
            disabled={saving}
          >
            <SelectTrigger id="finger-type">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="fresh">
                Fresh
              </SelectItem>

              <SelectItem value="existing">
                Existing
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="finger-status">
            Status
          </Label>

          <Select
            value={form.status}
            onValueChange={(value) =>
              updateField(
                "status",
                value as FingerStatus,
              )
            }
            disabled={saving}
          >
            <SelectTrigger id="finger-status">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="pending">
                Pending
              </SelectItem>

              <SelectItem value="scheduled">
                Scheduled
              </SelectItem>

              <SelectItem value="completed">
                Completed
              </SelectItem>

              <SelectItem value="failed">
                Failed
              </SelectItem>

              <SelectItem value="cancelled">
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="finger-remarks">
            Remarks
          </Label>

          <Textarea
            id="finger-remarks"
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
