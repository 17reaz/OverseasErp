import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  }, [open, record]);

  function updateField<K extends keyof FingerFormState>(
    field: K,
    value: FingerFormState[K],
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

  function handleOpenChange(nextOpen: boolean) {
    if (saving) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEdit
              ? "Edit Finger Record"
              : "Create Finger Record"}
          </SheetTitle>

          <SheetDescription>
            {isEdit
              ? "Update the fingerprint record details."
              : "Create a new fingerprint record for a candidate."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 px-4 pb-6"
        >
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

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleOpenChange(false)
              }
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                saving ||
                !form.candidate_id
              }
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Finger"
                  : "Create Finger"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}