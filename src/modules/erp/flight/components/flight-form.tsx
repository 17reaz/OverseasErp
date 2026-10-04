import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Check,
  ChevronsUpDown,
  ChevronDown,
  Plane,
  ShieldCheck,
} from "lucide-react";

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

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { UniversalSheet } from "../../shared/forms/universal-sheet";

import {
  createFlight,
  updateFlight,
  type Flight,
} from "../flight-service";

import { completeCandidate } from "../../candidates/candidate-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface VisaOption {
  id: string;
  visa_no: string;
  candidate_id: string;
}

interface FlightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Flight | null;
  candidates: CandidateOption[];
  visas: VisaOption[];
  onSuccess?: (record: Flight) => void;
  onComplete?: (candidateId: string) => void;
}

interface FormState {
  candidate_id: string;
  visa_id: string;

  flight_date: string;
  flight_no: string;
  airline: string;
  departure_city: string;
  arrival_city: string;

  status:
    | "scheduled"
    | "departed"
    | "cancelled"
    | "rescheduled";

  needs_iqama: boolean;

  iqama_status:
    | "pending"
    | "completed"
    | "cancelled"
    | null;

  iqama_number: string;
  iqama_date: string;
  iqama_expiry_date: string;
  iqama_remarks: string;

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

  needs_iqama: false,
  iqama_status: null,
  iqama_number: "",
  iqama_date: "",
  iqama_expiry_date: "",
  iqama_remarks: "",

  remarks: "",
};

export function FlightForm({
  open,
  onOpenChange,
  record,
  candidates,
  visas,
  onSuccess,
  onComplete,
}: FlightFormProps) {
  const [form, setForm] =
    useState<FormState>(DEFAULT_FORM);

  const [saving, setSaving] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
   * DIRTY STATE
   * ======================================================= */

  const [dirty, setDirty] =
    useState(false);

  const isEdit = Boolean(record);

  /* =======================================================
   * COLLAPSIBLE SECTIONS
   * ======================================================= */

  const [flightDetailsOpen, setFlightDetailsOpen] =
    useState(true);

  const [iqamaDetailsOpen, setIqamaDetailsOpen] =
    useState(false);

  /* =======================================================
   * DERIVED STATE
   * ======================================================= */

  const isDeparted =
    form.status === "departed";

  const iqamaRequired =
    form.needs_iqama === true;

  const iqamaCompleted =
    form.iqama_status === "completed";

  const canMarkComplete =
    isEdit &&
    isDeparted &&
    (
      !iqamaRequired ||
      iqamaCompleted
    );

  /* =======================================================
   * LOAD FORM
   * ======================================================= */

  useEffect(() => {
    if (!open) return;

    if (record) {
      const departed =
        record.status === "departed";

      const needsIqama =
        record.needs_iqama ?? false;

      setForm({
        candidate_id:
          record.candidate_id,

        visa_id:
          record.visa_id ?? "",

        flight_date:
          record.flight_date ?? "",

        flight_no:
          record.flight_no ?? "",

        airline:
          record.airline ?? "",

        departure_city:
          record.departure_city ?? "",

        arrival_city:
          record.arrival_city ?? "",

        status:
          record.status ?? "scheduled",

        needs_iqama:
          needsIqama,

        iqama_status:
          record.iqama_status ?? null,

        iqama_number:
          record.iqama_number ?? "",

        iqama_date:
          record.iqama_date ?? "",

        iqama_expiry_date:
          record.iqama_expiry_date ?? "",

        iqama_remarks:
          record.iqama_remarks ?? "",

        remarks:
          record.remarks ?? "",
      });

      /*
       * Existing departed flight:
       *
       * Flight details collapsed
       * Iqama opened if required
       */
      setFlightDetailsOpen(!departed);

      setIqamaDetailsOpen(
        departed && needsIqama,
      );
    } else {
      /*
       * New flight:
       *
       * Flight details open
       * Iqama details closed
       */
      setForm(DEFAULT_FORM);

      setFlightDetailsOpen(true);
      setIqamaDetailsOpen(false);
    }

    setError("");
    setDirty(false);
  }, [open, record]);

  /* =======================================================
   * FIELD UPDATE
   * ======================================================= */

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

  /* =======================================================
   * STATUS CHANGE
   * ======================================================= */

  function handleStatusChange(
    value: FormState["status"],
  ) {
    updateField("status", value);

    /*
     * When flight becomes departed:
     *
     * Flight details collapse
     * Iqama opens if required
     */
    if (value === "departed") {
      setFlightDetailsOpen(false);

      if (form.needs_iqama) {
        setIqamaDetailsOpen(true);
      }
    } else {
      /*
       * Going back from departed:
       * show flight details again.
       */
      setFlightDetailsOpen(true);
    }
  }

  /* =======================================================
   * IQAMA REQUIRED TOGGLE
   * ======================================================= */

  function handleIqamaToggle(
    checked: boolean,
  ) {
    setForm((previous) => ({
      ...previous,

      needs_iqama: checked,

      iqama_status: checked
        ? previous.iqama_status ?? "pending"
        : null,

      iqama_number: checked
        ? previous.iqama_number
        : "",

      iqama_date: checked
        ? previous.iqama_date
        : "",

      iqama_expiry_date: checked
        ? previous.iqama_expiry_date
        : "",

      iqama_remarks: checked
        ? previous.iqama_remarks
        : "",
    }));

    setDirty(true);

    /*
     * When user enables Iqama on a departed
     * flight, immediately open the details.
     */
    if (
      checked &&
      form.status === "departed"
    ) {
      setIqamaDetailsOpen(true);
    }

    /*
     * When disabled, close details.
     */
    if (!checked) {
      setIqamaDetailsOpen(false);
    }
  }

  /* =======================================================
   * MARK CANDIDATE COMPLETE
   * ======================================================= */

  async function handleMarkComplete() {
    if (!form.candidate_id) {
      setError(
        "Candidate could not be identified.",
      );
      return;
    }

    if (!isDeparted) {
      setError(
        "Candidate can only be completed after flight departure.",
      );
      return;
    }

    if (
      form.needs_iqama &&
      form.iqama_status !== "completed"
    ) {
      setError(
        "Iqama must be completed before the candidate can be completed.",
      );
      return;
    }

    const candidate =
      candidates.find(
        (item) =>
          item.id === form.candidate_id,
      );

    const candidateName =
      candidate?.name ??
      "this candidate";

    const confirmed =
      window.confirm(
        `Mark ${candidateName} as Complete?\n\nThis will change the candidate's main status to Complete.`,
      );

    if (!confirmed) {
      return;
    }

    setCompleting(true);
    setError("");

    try {
      /*
       * IMPORTANT:
       *
       * Main candidate completion comes from
       * candidate-service.
       *
       * We are NOT changing flight status here.
       */
      await completeCandidate(
        form.candidate_id,
      );

      /*
       * Let parent know that candidate has
       * been completed.
       */
      onComplete?.(
        form.candidate_id,
      );

      /*
       * Completion is a separate candidate
       * workflow action, so don't call
       * onSuccess with a fake Flight record.
       */
      setDirty(false);

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark candidate as complete.",
      );
    } finally {
      setCompleting(false);
    }
  }

  /* =======================================================
   * SUBMIT
   * ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.candidate_id) {
      setError(
        "Please select a candidate.",
      );
      return;
    }

    /*
     * Iqama can only be completed
     * after departure.
     */
    if (
      form.needs_iqama &&
      form.iqama_status === "completed" &&
      form.status !== "departed"
    ) {
      setError(
        "Iqama can only be completed after the candidate has departed.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        visa_id:
          form.visa_id || null,

        flight_date:
          form.flight_date || null,

        flight_no:
          form.flight_no.trim() || null,

        airline:
          form.airline.trim() || null,

        departure_city:
          form.departure_city.trim() || null,

        arrival_city:
          form.arrival_city.trim() || null,

        status:
          form.status,

        /* =================================================
         * IQAMA
         * ================================================= */

        needs_iqama:
          form.needs_iqama,

        iqama_status:
          form.needs_iqama
            ? form.iqama_status ??
              "pending"
            : null,

        iqama_number:
          form.needs_iqama
            ? form.iqama_number.trim() ||
              null
            : null,

        iqama_date:
          form.needs_iqama
            ? form.iqama_date ||
              null
            : null,

        iqama_expiry_date:
          form.needs_iqama
            ? form.iqama_expiry_date ||
              null
            : null,

        iqama_remarks:
          form.needs_iqama
            ? form.iqama_remarks.trim() ||
              null
            : null,

        remarks:
          form.remarks.trim() ||
          null,
      };

      let savedRecord: Flight;

      /* =================================================
       * UPDATE
       * ================================================= */

      if (record) {
        savedRecord =
          await updateFlight(
            record.id,
            input,
          );
      }

      /* =================================================
       * CREATE
       * ================================================= */

      else {
        savedRecord =
          await createFlight({
            candidate_id:
              form.candidate_id,

            ...input,
          });
      }

      /* =================================================
       * SUCCESS
       * ================================================= */

      onSuccess?.(savedRecord);

      setDirty(false);

      onOpenChange(false);

      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save flight record.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? "Edit Flight Schedule"
          : "Create Flight Schedule"
      }
      description={
        isEdit
          ? "Update the flight record details."
          : "Record a new candidate flight schedule."
      }
      hasChanges={dirty}
      onSubmit={handleSubmit}
      submitLabel={
        isEdit
          ? "Update Flight"
          : "Create Flight"
      }
      loading={saving}
      disabled={
        !form.candidate_id ||
        completing
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            {canMarkComplete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleMarkComplete}
                disabled={
                  saving ||
                  completing
                }
              >
                <ShieldCheck className="mr-2 h-4 w-4" />

                {completing
                  ? "Completing..."
                  : "Mark as Complete"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={
                saving ||
                completing
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                !form.candidate_id ||
                saving ||
                completing
              }
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Flight"
                  : "Create Flight"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">

        {/* =================================================
         * CANDIDATE
         * ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="flight-candidate">
            Candidate{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={
                  isEdit ||
                  saving ||
                  completing
                }
                className="w-full justify-between font-normal"
              >
                {form.candidate_id
                  ? (() => {
                      const candidate =
                        candidates.find(
                          (item) =>
                            item.id ===
                            form.candidate_id,
                        );

                      return candidate ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate">
                            {candidate.name}
                          </span>

                          <span className="shrink-0 text-xs text-muted-foreground">
                            {
                              candidate.passport_no
                            }
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
                <CommandInput
                  placeholder="Search candidate or passport..."
                />

                <CommandList>
                  <CommandEmpty>
                    No candidate found.
                  </CommandEmpty>

                  <CommandGroup>
                    {candidates.map(
                      (candidate) => (
                        <CommandItem
                          key={candidate.id}
                          value={`${candidate.name} ${candidate.passport_no}`}
                          onSelect={() => {
                            setForm(
                              (previous) => ({
                                ...previous,
                                candidate_id:
                                  candidate.id,
                                visa_id: "",
                              }),
                            );

                            setDirty(true);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              form.candidate_id ===
                              candidate.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />

                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">
                              {
                                candidate.name
                              }
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {
                                candidate.passport_no
                              }
                            </span>
                          </div>
                        </CommandItem>
                      ),
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* =================================================
         * FLIGHT DETAILS
         * ================================================= */}

        <Collapsible
          open={flightDetailsOpen}
          onOpenChange={
            setFlightDetailsOpen
          }
        >
          <div className="rounded-lg border">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Plane className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-medium">
                      Flight Details
                    </div>

                    {!flightDetailsOpen &&
                      isDeparted && (
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {form.flight_no ||
                              "No flight no"}
                          </span>

                          {form.airline && (
                            <>
                              <span>•</span>

                              <span>
                                {
                                  form.airline
                                }
                              </span>
                            </>
                          )}

                          {form.departure_city &&
                            form.arrival_city && (
                              <>
                                <span>•</span>

                                <span>
                                  {
                                    form.departure_city
                                  }{" "}
                                  →{" "}
                                  {
                                    form.arrival_city
                                  }
                                </span>
                              </>
                            )}
                        </div>
                      )}
                  </div>
                </div>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    flightDetailsOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-5 border-t p-4">

                {/* FLIGHT NO + AIRLINE */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flight-no">
                      Flight No
                    </Label>

                    <Input
                      id="flight-no"
                      value={
                        form.flight_no
                      }
                      onChange={(event) =>
                        updateField(
                          "flight_no",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. BG-012"
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flight-airline">
                      Airline
                    </Label>

                    <Input
                      id="flight-airline"
                      value={
                        form.airline
                      }
                      onChange={(event) =>
                        updateField(
                          "airline",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Biman Bangladesh"
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>
                </div>

                {/* FLIGHT DATE + STATUS */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flight-date">
                      Flight Date
                    </Label>

                    <Input
                      id="flight-date"
                      type="date"
                      value={
                        form.flight_date
                      }
                      onChange={(event) =>
                        updateField(
                          "flight_date",
                          event.target.value,
                        )
                      }
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Status
                    </Label>

                    <Select
                      value={
                        form.status
                      }
                      onValueChange={
                        handleStatusChange
                      }
                      disabled={
                        saving ||
                        completing
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="scheduled">
                          Scheduled
                        </SelectItem>

                        <SelectItem value="departed">
                          Departed
                        </SelectItem>

                        <SelectItem value="cancelled">
                          Cancelled
                        </SelectItem>

                        <SelectItem value="rescheduled">
                          Rescheduled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DEPARTURE + ARRIVAL */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flight-dep">
                      Departure City
                    </Label>

                    <Input
                      id="flight-dep"
                      value={
                        form.departure_city
                      }
                      onChange={(event) =>
                        updateField(
                          "departure_city",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Dhaka"
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flight-arr">
                      Arrival City
                    </Label>

                    <Input
                      id="flight-arr"
                      value={
                        form.arrival_city
                      }
                      onChange={(event) =>
                        updateField(
                          "arrival_city",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Riyadh"
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>
                </div>

                {/* VISA */}

                <div className="space-y-2">
                  <Label htmlFor="flight-visa">
                    Visa Link
                  </Label>

                  <select
                    id="flight-visa"
                    value={
                      form.visa_id
                    }
                    onChange={(event) =>
                      updateField(
                        "visa_id",
                        event.target.value,
                      )
                    }
                    disabled={
                      saving ||
                      completing
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select visa (optional)
                    </option>

                    {visas
                      .filter(
                        (visa) =>
                          visa.candidate_id ===
                          form.candidate_id,
                      )
                      .map((visa) => (
                        <option
                          key={visa.id}
                          value={visa.id}
                        >
                          Visa:{" "}
                          {visa.visa_no}
                        </option>
                      ))}
                  </select>
                </div>

                {/* IQAMA REQUIRED */}

                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="flight-needs-iqama"
                      type="checkbox"
                      checked={
                        form.needs_iqama
                      }
                      onChange={(event) =>
                        handleIqamaToggle(
                          event.target.checked,
                        )
                      }
                      disabled={
                        saving ||
                        completing
                      }
                      className="mt-1 h-4 w-4 rounded border-input"
                    />

                    <div className="space-y-1">
                      <Label
                        htmlFor="flight-needs-iqama"
                        className="cursor-pointer"
                      >
                        Iqama Required
                      </Label>

                      <p className="text-xs text-muted-foreground">
                        Enable this if the
                        candidate needs Iqama
                        after departure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* =================================================
         * IQAMA DETAILS
         * ================================================= */}

        {form.needs_iqama && (
          <Collapsible
            open={iqamaDetailsOpen}
            onOpenChange={
              setIqamaDetailsOpen
            }
          >
            <div className="rounded-lg border bg-muted/20">

              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="font-medium">
                        Iqama Details
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        Status:{" "}
                        <span className="capitalize">
                          {
                            form.iqama_status ??
                            "pending"
                          }
                        </span>
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      iqamaDetailsOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-4 border-t p-4">

                  {/* IQAMA NUMBER + DATE */}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="iqama-number">
                        Iqama Number
                      </Label>

                      <Input
                        id="iqama-number"
                        value={
                          form.iqama_number
                        }
                        onChange={(event) =>
                          updateField(
                            "iqama_number",
                            event.target.value,
                          )
                        }
                        placeholder="Enter Iqama number"
                        disabled={
                          saving ||
                          completing
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iqama-date">
                        Iqama Date
                      </Label>

                      <Input
                        id="iqama-date"
                        type="date"
                        value={
                          form.iqama_date
                        }
                        onChange={(event) =>
                          updateField(
                            "iqama_date",
                            event.target.value,
                          )
                        }
                        disabled={
                          saving ||
                          completing
                        }
                      />
                    </div>
                  </div>

                  {/* EXPIRY */}

                  <div className="space-y-2">
                    <Label htmlFor="iqama-expiry">
                      Iqama Expiry Date
                    </Label>

                    <Input
                      id="iqama-expiry"
                      type="date"
                      value={
                        form.iqama_expiry_date
                      }
                      onChange={(event) =>
                        updateField(
                          "iqama_expiry_date",
                          event.target.value,
                        )
                      }
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>

                  {/* IQAMA STATUS */}

                  <div className="space-y-2">
                    <Label>
                      Iqama Status
                    </Label>

                    <Select
                      value={
                        form.iqama_status ??
                        "pending"
                      }
                      onValueChange={(
                        value:
                          | "pending"
                          | "completed"
                          | "cancelled",
                      ) =>
                        updateField(
                          "iqama_status",
                          value,
                        )
                      }
                      disabled={
                        saving ||
                        completing ||
                        form.iqama_status ===
                          "completed"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="pending">
                          Pending
                        </SelectItem>

                        <SelectItem
                          value="completed"
                          disabled={
                            form.status !==
                            "departed"
                          }
                        >
                          Completed
                        </SelectItem>

                        <SelectItem value="cancelled">
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {form.status !==
                      "departed" && (
                      <p className="text-xs text-muted-foreground">
                        Iqama can only be
                        marked completed
                        after the flight is
                        departed.
                      </p>
                    )}
                  </div>

                  {/* IQAMA REMARKS */}

                  <div className="space-y-2">
                    <Label htmlFor="iqama-remarks">
                      Iqama Remarks
                    </Label>

                    <Textarea
                      id="iqama-remarks"
                      value={
                        form.iqama_remarks
                      }
                      onChange={(event) =>
                        updateField(
                          "iqama_remarks",
                          event.target.value,
                        )
                      }
                      placeholder="Add Iqama remarks..."
                      rows={2}
                      disabled={
                        saving ||
                        completing
                      }
                    />
                  </div>

                  {/* Iqama pending notice */}

                  {isDeparted &&
                    form.iqama_status !==
                      "completed" && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                        Complete the Iqama
                        before marking the
                        candidate as complete.
                      </div>
                    )}

                  {/* Iqama completed notice */}

                  {isDeparted &&
                    form.iqama_status ===
                      "completed" && (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                        Iqama completed.
                        You can now mark the
                        candidate as complete.
                      </div>
                    )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* =================================================
         * MARK AS COMPLETE CARD
         * ================================================= */}

        {canMarkComplete && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Workflow Ready to Complete
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {form.needs_iqama
                    ? "Flight departed and Iqama is completed."
                    : "Flight has departed and no Iqama is required."}
                </p>

                <Button
                  type="button"
                  className="mt-3"
                  onClick={
                    handleMarkComplete
                  }
                  disabled={
                    saving ||
                    completing
                  }
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />

                  {completing
                    ? "Completing..."
                    : "Mark as Complete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
         * REMARKS
         * ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="flight-remarks">
            Remarks
          </Label>

          <Textarea
            id="flight-remarks"
            value={form.remarks}
            onChange={(event) =>
              updateField(
                "remarks",
                event.target.value,
              )
            }
            placeholder="Add remarks..."
            rows={3}
            disabled={
              saving ||
              completing
            }
          />
        </div>

        {/* =================================================
         * ERROR
         * ================================================= */}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}