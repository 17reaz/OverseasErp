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
  createTradeTest,
  updateTradeTest,
  type TradeTest,
} from "../takamul-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface TradeTestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: TradeTest | null;
  candidates: CandidateOption[];
  onSuccess?: (record: TradeTest) => void;
}

interface FormState {
  candidate_id: string;
  test_center: string;
  test_date: string;
  result: "pending" | "pass" | "fail";
  certificate_no: string;
  expiry_date: string;
  status: "scheduled" | "completed" | "expired" | "cancelled";
  remarks: string;
}

const DEFAULT_FORM: FormState = {
  candidate_id: "",
  test_center: "",
  test_date: "",
  result: "pending",
  certificate_no: "",
  expiry_date: "",
  status: "scheduled",
  remarks: "",
};

export function TradeTestForm({
  open,
  onOpenChange,
  record,
  candidates,
  onSuccess,
}: TradeTestFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
   * DIRTY STATE
   * ======================================================= */

  const [dirty, setDirty] = useState(false);

  const isEdit = Boolean(record);

  useEffect(() => {
    if (!open) return;

    if (record) {
      setForm({
        candidate_id: record.candidate_id,
        test_center: record.test_center ?? "",
        test_date: record.test_date ?? "",
        result: record.result ?? "pending",
        certificate_no: record.certificate_no ?? "",
        expiry_date: record.expiry_date ?? "",
        status: record.status ?? "scheduled",
        remarks: record.remarks ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }

    setError("");
    setDirty(false);
  }, [open, record]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setDirty(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError("Please select a candidate.");
      return;
    }

    if (!form.test_center.trim()) {
      setError("Please enter the test center.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        test_center: form.test_center.trim(),
        test_date: form.test_date || null,
        result: form.result,
        certificate_no: form.certificate_no.trim() || null,
        expiry_date: form.expiry_date || null,
        status: form.status,
        remarks: form.remarks.trim() || null,
      };

      let savedRecord: TradeTest;

      if (record) {
        savedRecord = await updateTradeTest(record.id, input);
      } else {
        savedRecord = await createTradeTest({
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
        err instanceof Error ? err.message : "Failed to save trade test record.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Trade Test" : "Create Trade Test"}
      description={
        isEdit
          ? "Update the trade test record details."
          : "Record a new candidate trade test evaluation."
      }
      hasChanges={dirty}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Test" : "Create Test"}
      loading={saving}
      disabled={!form.candidate_id}
    >
      <div className="flex flex-col gap-5">
        {/* Candidate */}
        <div className="space-y-2">
          <Label htmlFor="tt-candidate">
            Candidate <span className="text-destructive">*</span>
          </Label>
          <select
            id="tt-candidate"
            value={form.candidate_id}
            onChange={(e) => updateField("candidate_id", e.target.value)}
            disabled={isEdit || saving}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select candidate</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.passport_no}
              </option>
            ))}
          </select>
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Candidate cannot be changed after creation.
            </p>
          )}
        </div>

        {/* Test Center */}
        <div className="space-y-2">
          <Label htmlFor="tt-center">
            Test Center <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tt-center"
            value={form.test_center}
            onChange={(e) => updateField("test_center", e.target.value)}
            placeholder="Enter test center name"
            disabled={saving}
          />
        </div>

        {/* Test Date */}
        <div className="space-y-2">
          <Label htmlFor="tt-date">Test Date</Label>
          <Input
            id="tt-date"
            type="date"
            value={form.test_date}
            onChange={(e) => updateField("test_date", e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Result & Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Result</Label>
            <Select
              value={form.result}
              onValueChange={(val: FormState["result"]) => updateField("result", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(val: FormState["status"]) => updateField("status", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Certificate No */}
        <div className="space-y-2">
          <Label htmlFor="tt-cert">Certificate No</Label>
          <Input
            id="tt-cert"
            value={form.certificate_no}
            onChange={(e) => updateField("certificate_no", e.target.value)}
            placeholder="Certificate number if passed"
            disabled={saving}
          />
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="tt-expiry">Expiry Date</Label>
          <Input
            id="tt-expiry"
            type="date"
            value={form.expiry_date}
            onChange={(e) => updateField("expiry_date", e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="tt-remarks">Remarks</Label>
          <Textarea
            id="tt-remarks"
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            placeholder="Add remarks..."
            rows={3}
            disabled={saving}
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}
