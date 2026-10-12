import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Loader2,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  createCandidate,
  type Candidate,
  type CandidateInput,
} from "./candidate-service";

import {
  createMedical,
  type MedicalStatus,
} from "../medical/medical-service";

import {
  createMofa,
  getMofaAgencies,
  type MofaAgency,
  type MofaStage,
} from "../mofa/mofa-service";

const steps = [
  {
    id: 1,
    title: "Candidate",
    description: "Basic information",
    icon: UserRound,
  },
  {
    id: 2,
    title: "Medical",
    description: "Medical registration",
    icon: Stethoscope,
  },
  {
    id: 3,
    title: "MOFA",
    description: "MOFA registration",
    icon: FileCheck,
  },
] as const;

const countryValues: Record<string, string> = {
  "saudi-arabia": "Saudi Arabia",
  qatar: "Qatar",
  uae: "United Arab Emirates",
  kuwait: "Kuwait",
  oman: "Oman",
  bahrain: "Bahrain",
  japan: "Japan",
  malaysia: "Malaysia",
};

export function CandidateRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Candidate
  const [name, setName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [savedCandidate, setSavedCandidate] =
    useState<Candidate | null>(null);

  // Medical
  const [medicalDate, setMedicalDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fitDate, setFitDate] = useState("");
  const [medicalStatus, setMedicalStatus] =
    useState<MedicalStatus>("new");
  const [savedMedicalId, setSavedMedicalId] = useState<string | null>(
    null,
  );

  // MOFA
  const [agencies, setAgencies] = useState<MofaAgency[]>([]);
  const [agencyId, setAgencyId] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [trade, setTrade] = useState("");
  const [mofaStage, setMofaStage] = useState<MofaStage>("new");

  // Shared state
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [medicalSaved, setMedicalSaved] = useState(false);
  const [mofaSaved, setMofaSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAgencies() {
      const result = await getMofaAgencies();

      if (cancelled) return;

      if (result.error) {
        console.error("Failed to load MOFA agencies:", result.error);
        return;
      }

      setAgencies(result.data ?? []);
    }

    void loadAgencies();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCandidateSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || savedCandidate) return;

    if (!name.trim() || !passportNo.trim() || !country) {
      setErrorMessage("Name, passport number and country are required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const input: CandidateInput = {
        name: name.trim(),
        passport_no: passportNo.trim().toUpperCase(),
        received_date: receivedDate || null,
        country: countryValues[country] ?? country,
        agent_id: null,
        current_stage: "candidate",
      };

      const result = await createCandidate(input);

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error("Candidate was not returned after saving.");
      }

      setSavedCandidate(result.data);
      setSuccessMessage("Candidate saved successfully.");
      setCurrentStep(2);
    } catch (error) {
      console.error("Candidate registration error:", error);

      const err = error as { message?: string; code?: string };
      const message = err.message || "Failed to save candidate.";

      setErrorMessage(
        err.code === "23505" ||
          message.toLowerCase().includes("duplicate") ||
          message.toLowerCase().includes("unique")
          ? "This passport number already exists."
          : message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMedicalSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!savedCandidate || saving || medicalSaved) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await createMedical({
        candidate_id: savedCandidate.id,
        medical_date: medicalDate || null,
        fit_date: medicalStatus === "fit" ? fitDate || null : null,
        status: medicalStatus,
      });

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error("Medical record was not returned after saving.");
      }

      setSavedMedicalId(result.data.id);
      setMedicalSaved(true);
      setSuccessMessage("Medical record saved successfully.");
      setCurrentStep(3);
    } catch (error) {
      console.error("Medical registration error:", error);

      const err = error as { message?: string };
      setErrorMessage(err.message || "Failed to save medical record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMofaSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!savedCandidate || saving || mofaSaved) return;

    if (
      (mofaStage === "medupdated" || mofaStage === "approved") &&
      !savedMedicalId
    ) {
      setErrorMessage(
        "Save a Medical record first before selecting this MOFA stage.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await createMofa({
        candidate_id: savedCandidate.id,
        medical_id: savedMedicalId,
        agency_id: agencyId || null,
        application_number: applicationNumber.trim() || null,
        application_date: applicationDate || null,
        trade: trade.trim() || null,
        stage: mofaStage,
      });

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error("MOFA record was not returned after saving.");
      }

      setMofaSaved(true);
      setSuccessMessage("MOFA record saved successfully.");
    } catch (error) {
      console.error("MOFA registration error:", error);

      const err = error as { message?: string };
      setErrorMessage(err.message || "Failed to save MOFA record.");
    } finally {
      setSaving(false);
    }
  }

  function goToStep(step: number) {
    if (step > 1 && !savedCandidate) {
      setErrorMessage("Save the candidate before continuing.");
      return;
    }

    if (step > 2 && !medicalSaved) {
      setErrorMessage("Save the Medical record before continuing.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setCurrentStep(step);
  }

  const statusLabel = mofaSaved
    ? "Registration Complete"
    : medicalSaved
      ? "Medical Saved"
      : savedCandidate
        ? "Candidate Saved"
        : "Draft";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {/* ───────── Fixed Header + Stepper ───────── */}
      <div className="sticky top-0 z-20 border-b bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/app/candidates" aria-label="Back to candidates">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  Candidate Registration
                </h1>
              </div>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Register a candidate and start the processing workflow.
              </p>
            </div>
          </div>

          <Badge
            variant={mofaSaved ? "default" : "secondary"}
            className="shrink-0"
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Stepper */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const active = currentStep === step.id;
            const completed =
              (step.id === 1 && !!savedCandidate) ||
              (step.id === 2 && medicalSaved) ||
              (step.id === 3 && mofaSaved);

            return (
              <button
                key={step.id}
                type="button"
                title={step.description}
                onClick={() => goToStep(step.id)}
                className={`flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : completed
                      ? "border-primary/30 bg-muted/40"
                      : "border-border hover:bg-muted/50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : completed
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Scrollable Content ───────── */}
      <div className="flex-1 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title} Information</CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "Enter the candidate's personal and passport information."}
              {currentStep === 2 &&
                "Enter medical details for the saved candidate."}
              {currentStep === 3 &&
                "Enter MOFA application details for the saved candidate."}
            </CardDescription>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {currentStep === 1 && (
              <form
                id="candidate-registration-form"
                onSubmit={handleCandidateSubmit}
                className="space-y-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="candidate-name">Candidate Name *</Label>
                    <Input
                      id="candidate-name"
                      placeholder="Enter full name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={saving || !!savedCandidate}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passport">Passport Number *</Label>
                    <Input
                      id="passport"
                      placeholder="Enter passport number"
                      value={passportNo}
                      onChange={(event) =>
                        setPassportNo(event.target.value.toUpperCase())
                      }
                      disabled={saving || !!savedCandidate}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="received-date">Received Date</Label>
                    <Input
                      id="received-date"
                      type="date"
                      value={receivedDate}
                      onChange={(event) => setReceivedDate(event.target.value)}
                      disabled={saving || !!savedCandidate}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select
                      value={country}
                      onValueChange={setCountry}
                      disabled={saving || !!savedCandidate}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saudi-arabia">
                          Saudi Arabia
                        </SelectItem>
                        <SelectItem value="qatar">Qatar</SelectItem>
                        <SelectItem value="uae">
                          United Arab Emirates
                        </SelectItem>
                        <SelectItem value="kuwait">Kuwait</SelectItem>
                        <SelectItem value="oman">Oman</SelectItem>
                        <SelectItem value="bahrain">Bahrain</SelectItem>
                        <SelectItem value="japan">Japan</SelectItem>
                        <SelectItem value="malaysia">Malaysia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Agent</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Agent selection not connected" />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration-notes">Notes</Label>
                    <Textarea
                      id="registration-notes"
                      placeholder="Additional information (optional)"
                      rows={3}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={saving || !!savedCandidate}
                    />
                    <p className="text-xs text-muted-foreground">
                      Notes are not stored by the current candidate service.
                    </p>
                  </div>
                </div>

                {savedCandidate && (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                    <p className="text-sm font-medium">Candidate saved</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {savedCandidate.name} · Passport:{" "}
                      {savedCandidate.passport_no}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Candidate SL: {savedCandidate.sl ?? "—"}
                    </p>
                  </div>
                )}
              </form>
            )}

            {currentStep === 2 && (
              <form
                id="medical-registration-form"
                onSubmit={handleMedicalSubmit}
                className="space-y-6"
              >
                <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                  <p className="text-sm font-medium">Selected Candidate</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {savedCandidate?.name} · {savedCandidate?.passport_no} · SL{" "}
                    {savedCandidate?.sl ?? "—"}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="medical-date">Medical Date</Label>
                    <Input
                      id="medical-date"
                      type="date"
                      value={medicalDate}
                      onChange={(event) => setMedicalDate(event.target.value)}
                      disabled={saving || medicalSaved}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Status *</Label>
                    <Select
                      value={medicalStatus}
                      onValueChange={(value) =>
                        setMedicalStatus(value as MedicalStatus)
                      }
                      disabled={saving || medicalSaved}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medical status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="fit">Fit</SelectItem>
                        <SelectItem value="unfit">Unfit</SelectItem>
                        <SelectItem value="slip">Slip</SelectItem>
                        <SelectItem value="under_review">
                          Under Review
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {medicalStatus === "fit" && (
                    <div className="space-y-2">
                      <Label htmlFor="fit-date">Fit Date</Label>
                      <Input
                        id="fit-date"
                        type="date"
                        value={fitDate}
                        onChange={(event) => setFitDate(event.target.value)}
                        disabled={saving || medicalSaved}
                      />
                    </div>
                  )}
                </div>

                {medicalSaved && (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
                    <p className="font-medium">Medical saved successfully</p>
                    <p className="mt-1 text-muted-foreground">
                      Medical ID: {savedMedicalId}
                    </p>
                  </div>
                )}
              </form>
            )}

            {currentStep === 3 && (
              <form
                id="mofa-registration-form"
                onSubmit={handleMofaSubmit}
                className="space-y-6"
              >
                <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                  <p className="text-sm font-medium">Selected Candidate</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {savedCandidate?.name} · {savedCandidate?.passport_no} · SL{" "}
                    {savedCandidate?.sl ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Medical ID: {savedMedicalId ?? "No Medical linked"}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mofa-number">Application Number</Label>
                    <Input
                      id="mofa-number"
                      placeholder="Enter application number"
                      value={applicationNumber}
                      onChange={(event) =>
                        setApplicationNumber(event.target.value)
                      }
                      disabled={saving || mofaSaved}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mofa-date">Application Date *</Label>
                    <Input
                      id="mofa-date"
                      type="date"
                      value={applicationDate}
                      onChange={(event) =>
                        setApplicationDate(event.target.value)
                      }
                      disabled={saving || mofaSaved}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mofa-trade">Trade</Label>
                    <Input
                      id="mofa-trade"
                      placeholder="Enter trade / profession"
                      value={trade}
                      onChange={(event) => setTrade(event.target.value)}
                      disabled={saving || mofaSaved}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Agency</Label>
                    <Select
                      value={agencyId || "__none"}
                      onValueChange={(value) =>
                        setAgencyId(value === "__none" ? "" : value)
                      }
                      disabled={saving || mofaSaved}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agency (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No agency</SelectItem>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                            {agency.code ? ` (${agency.code})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>MOFA Stage</Label>
                    <Select
                      value={mofaStage}
                      onValueChange={(value) =>
                        setMofaStage(value as MofaStage)
                      }
                      disabled={saving || mofaSaved}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="medupdated">
                          Medical Updated
                        </SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {mofaSaved && (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
                    <p className="font-medium">MOFA saved successfully</p>
                    <p className="mt-1 text-muted-foreground">
                      Candidate, Medical and MOFA registration steps are
                      complete.
                    </p>
                  </div>
                )}
              </form>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mt-6">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───────── Fixed Footer Actions ───────── */}
      <div className="sticky bottom-0 z-20 border-t bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setErrorMessage("");
              setSuccessMessage("");
              setCurrentStep((step) => Math.max(1, step - 1));
            }}
            disabled={currentStep === 1 || saving}
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/app/candidates">Cancel</Link>
            </Button>

            {currentStep === 1 && (
              <Button
                type="submit"
                form="candidate-registration-form"
                disabled={saving || !!savedCandidate}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving Candidate..." : "Save & Continue"}
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                type="submit"
                form="medical-registration-form"
                disabled={saving || medicalSaved || !savedCandidate}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving
                  ? "Saving Medical..."
                  : medicalSaved
                    ? "Medical Saved"
                    : "Save Medical & Continue"}
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                type="submit"
                form="mofa-registration-form"
                disabled={saving || mofaSaved || !savedCandidate}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving
                  ? "Saving MOFA..."
                  : mofaSaved
                    ? "Registration Complete"
                    : "Save MOFA"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}