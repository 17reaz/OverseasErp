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
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(record);

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

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        visa_type: form.visa_type.trim() || "employment",
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

  return (
    <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Visa" : "Create Visa"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update the visa record details." : "Record a new candidate visa."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-6 mt-4">
          {/* Candidate */}
          <div className="space-y-2">
            <Label htmlFor="visa-candidate">
              Candidate <span className="text-destructive">*</span>
            </Label>
            <select
              id="visa-candidate"
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
          </div>

          {/* Visa Number */}
          <div className="space-y-2">
            <Label htmlFor="visa-no">
              Visa No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="visa-no"
              value={form.visa_no}
              onChange={(e) => updateField("visa_no", e.target.value)}
              placeholder="Enter visa number"
              disabled={saving}
            />
          </div>

          {/* Visa Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visa-type">Visa Type</Label>
              <Input
                id="visa-type"
                value={form.visa_type}
                onChange={(e) => updateField("visa_type", e.target.value)}
                placeholder="e.g. employment"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visa-status">Status</Label>
              <Input
                id="visa-status"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                placeholder="e.g. processing, issued"
                disabled={saving}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visa-date">Visa Date</Label>
              <Input
                id="visa-date"
                type="date"
                value={form.visa_date}
                onChange={(e) => updateField("visa_date", e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visa-expiry">Expiry Date</Label>
              <Input
                id="visa-expiry"
                type="date"
                value={form.expiry_date}
                onChange={(e) => updateField("expiry_date", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Agency */}
          <div className="space-y-2">
            <Label htmlFor="visa-agency">Agency</Label>
            <select
              id="visa-agency"
              value={form.agency_id}
              onChange={(e) => updateField("agency_id", e.target.value)}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select agency (optional)</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* MOFA */}
          <div className="space-y-2">
            <Label htmlFor="visa-mofa">MOFA Application</Label>
            <select
              id="visa-mofa"
              value={form.mofa_id}
              onChange={(e) => updateField("mofa_id", e.target.value)}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select MOFA (optional)</option>
              {mofas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.application_number}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="visa-remarks">Remarks</Label>
            <Textarea
              id="visa-remarks"
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

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.candidate_id}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Update Visa" : "Create Visa"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}