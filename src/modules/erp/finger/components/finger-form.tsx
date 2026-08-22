import { useEffect, useState } from "react";
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
} from "../finger-service";

import type {
  FingerRecord,
  FingerStatus,
  FingerType,
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

const DEFAULT_FORM = {
  candidate_id: "",
  finger_date: "",
  finger_type: "fresh" as FingerType,
  status: "pending" as FingerStatus,
  remarks: "",
};

export function FingerForm({
  open,
  onOpenChange,
  record,
  candidates,
  onSuccess,
}: FingerFormProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
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

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError("Please select a candidate.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let savedRecord: FingerRecord;

      if (isEdit && record) {
        savedRecord = await updateFingerRecord(record.id, {
          finger_date: form.finger_date || null,
          finger_type: form.finger_type,
          status: form.status,
          remarks: form.remarks.trim() || null,
        });
      } else {
        savedRecord = await createFingerRecord({
          candidate_id: form.candidate_id,
          finger_date: form.finger_date || null,
          finger_type: form.finger_type,
          status: form.status,
          remarks: form.remarks.trim() || null,
        });
      }

      onSuccess?.(savedRecord);
      onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit Finger Record" : "Create Finger Record"}
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
            <Label htmlFor="candidate">
              Candidate <span className="text-destructive">*</span>
            </Label>

            <Select
              value={form.candidate_id}
              onValueChange={(value) =>
                updateField("candidate_id", value)
              }
              disabled={isEdit}
            >
              <SelectTrigger id="candidate">
                <SelectValue placeholder="Select candidate" />
              </SelectTrigger>

              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem
                    key={candidate.id}
                    value={candidate.id}
                  >
                    {candidate.name} — {candidate.passport_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Candidate cannot be changed after the record is created.
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
                updateField("finger_date", event.target.value)
              }
            />
          </div>

          {/* Finger Type */}
          <div className="space-y-2">
            <Label>Finger Type</Label>

            <Select
              value={form.finger_type}
              onValueChange={(value) =>
                updateField("finger_type", value as FingerType)
              }
            >
              <SelectTrigger>
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
            <Label>Status</Label>

            <Select
              value={form.status}
              onValueChange={(value) =>
                updateField("status", value as FingerStatus)
              }
            >
              <SelectTrigger>
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
            <Label htmlFor="remarks">
              Remarks
            </Label>

            <Textarea
              id="remarks"
              placeholder="Add remarks..."
              value={form.remarks}
              onChange={(event) =>
                updateField("remarks", event.target.value)
              }
              rows={4}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
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