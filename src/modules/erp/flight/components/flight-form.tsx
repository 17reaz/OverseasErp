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
  createFlight,
  updateFlight,
  type Flight,
} from "../flight-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface VisaOption {
  id: string;
  visa_no: string;
}

interface FlightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Flight | null;
  candidates: CandidateOption[];
  visas: VisaOption[];
  onSuccess?: (record: Flight) => void;
}

interface FormState {
  candidate_id: string;
  visa_id: string;
  flight_date: string;
  flight_no: string;
  airline: string;
  departure_city: string;
  arrival_city: string;
  status: "scheduled" | "departed" | "cancelled" | "rescheduled";
  remarks: string;
}

const DEFAULT_FORM: FormState = {
  candidate_id: "",
  visa_id: "",
  flight_date: "",
  flight_no: "",
  airline: "",
  departure_city: "",
  arrival_city: "",
  status: "scheduled",
  remarks: "",
};

export function FlightForm({
  open,
  onOpenChange,
  record,
  candidates,
  visas,
  onSuccess,
}: FlightFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(record);

  useEffect(() => {
    if (!open) return;

    if (record) {
      setForm({
        candidate_id: record.candidate_id,
        visa_id: record.visa_id ?? "",
        flight_date: record.flight_date ?? "",
        flight_no: record.flight_no ?? "",
        airline: record.airline ?? "",
        departure_city: record.departure_city ?? "",
        arrival_city: record.arrival_city ?? "",
        status: record.status ?? "scheduled",
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

    setSaving(true);
    setError("");

    try {
      const input = {
        visa_id: form.visa_id || null,
        flight_date: form.flight_date || null,
        flight_no: form.flight_no.trim() || null,
        airline: form.airline.trim() || null,
        departure_city: form.departure_city.trim() || null,
        arrival_city: form.arrival_city.trim() || null,
        status: form.status,
        remarks: form.remarks.trim() || null,
      };

      let savedRecord: Flight;

      if (record) {
        savedRecord = await updateFlight(record.id, input);
      } else {
        savedRecord = await createFlight({
          candidate_id: form.candidate_id,
          ...input,
        });
      }

      onSuccess?.(savedRecord);
      onOpenChange(false);
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save flight record.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Flight Schedule" : "Create Flight Schedule"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update the flight record details." : "Record a new candidate flight schedule."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-6 mt-4">
          {/* Candidate */}
          <div className="space-y-2">
            <Label htmlFor="flight-candidate">
              Candidate <span className="text-destructive">*</span>
            </Label>
            <select
              id="flight-candidate"
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

          {/* Flight No & Airline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flight-no">Flight No</Label>
              <Input
                id="flight-no"
                value={form.flight_no}
                onChange={(e) => updateField("flight_no", e.target.value)}
                placeholder="e.g. BG-012"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flight-airline">Airline</Label>
              <Input
                id="flight-airline"
                value={form.airline}
                onChange={(e) => updateField("airline", e.target.value)}
                placeholder="e.g. Biman Bangladesh"
                disabled={saving}
              />
            </div>
          </div>

          {/* Flight Date & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flight-date">Flight Date</Label>
              <Input
                id="flight-date"
                type="date"
                value={form.flight_date}
                onChange={(e) => updateField("flight_date", e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val: any) => updateField("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="departed">Departed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Departure & Arrival Cities */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flight-dep">Departure City</Label>
              <Input
                id="flight-dep"
                value={form.departure_city}
                onChange={(e) => updateField("departure_city", e.target.value)}
                placeholder="e.g. Dhaka"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flight-arr">Arrival City</Label>
              <Input
                id="flight-arr"
                value={form.arrival_city}
                onChange={(e) => updateField("arrival_city", e.target.value)}
                placeholder="e.g. Riyadh"
                disabled={saving}
              />
            </div>
          </div>

          {/* Visa */}
          <div className="space-y-2">
            <Label htmlFor="flight-visa">Visa Link</Label>
            <select
              id="flight-visa"
              value={form.visa_id}
              onChange={(e) => updateField("visa_id", e.target.value)}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select visa (optional)</option>
              {visas.map((v) => (
                <option key={v.id} value={v.id}>
                  Visa: {v.visa_no}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="flight-remarks">Remarks</Label>
            <Textarea
              id="flight-remarks"
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
              {saving ? "Saving..." : isEdit ? "Update Flight" : "Create Flight"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}