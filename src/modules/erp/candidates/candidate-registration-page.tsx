import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Loader2,
  RefreshCw,
  Save,
  Stethoscope,
  Upload,
  UserRound,
  type LucideIcon,
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createCandidate,
  findCandidateByPassport,
  type Candidate,
  type CandidateInput,
  type ExistingCandidateInfo,
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

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

function normalizePassport(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function lookupPassport(value: string) {
  const result = await findCandidateByPassport(value);

  if (result.error) {
    // Not blocking: the DB unique constraint is the last line of defence.
    console.error("Passport lookup failed:", result.error);
    return null;
  }

  return result.data;
}

/* ─────────────────────────────────────────────────────────────
 * Dummy OCR (UI only). Replace buildDummyOcr() with the real OCR
 * call later. Everything below is fake data.
 * ───────────────────────────────────────────────────────────── */

type DocType = "passport" | "medical" | "mofa";

type OcrField = { label: string; value: string };

type ScanState = {
  status: "idle" | "scanning" | "done";
  progress: number;
  fileName?: string;
  fileSize?: number;
  confidence?: number;
  fields?: OcrField[];
};

type DummyIdentity = { name: string; passportNo: string };

type DummyOcrResult = {
  confidence: number;
  fields: OcrField[];
  medical?: { date: string; status: MedicalStatus; fitDate: string };
  mofa?: {
    applicationNumber: string;
    applicationDate: string;
    trade: string;
    agencyId: string;
  };
};

const idleScan: ScanState = { status: "idle", progress: 0 };

const dummyNames = [
  "Mohammad Rahim Uddin",
  "Abdul Karim Sheikh",
  "Md. Jahidul Islam",
  "Shafiqul Alam",
  "Nasir Hossain",
  "Rubel Mia",
  "Sumon Ahmed",
  "Kamal Hossain",
  "Jewel Rana",
  "Faruk Hasan",
  "Tareq Aziz",
  "Mizanur Rahman",
];

const dummyTrades = [
  "Cleaner",
  "Driver",
  "Welder",
  "Electrician",
  "Mason",
  "Carpenter",
  "Plumber",
  "Security Guard",
];

const usedPassports = new Set<string>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDigits(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += randomInt(0, 9);
  return out;
}

function isoDaysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function createDummyIdentity(): DummyIdentity {
  let passportNo = "";

  do {
    passportNo = `${pick(["A", "B", "E"])}${randomDigits(8)}`;
  } while (usedPassports.has(passportNo));

  usedPassports.add(passportNo);

  return { name: pick(dummyNames), passportNo };
}

function buildDummyOcr(
  docType: DocType,
  identity: DummyIdentity,
  agencies: MofaAgency[],
): DummyOcrResult {
  const confidence = randomInt(91, 99);
  const base: OcrField[] = [
    { label: "Name", value: identity.name },
    { label: "Passport No", value: identity.passportNo },
  ];

  if (docType === "passport") {
    return {
      confidence,
      fields: [
        ...base,
        { label: "Nationality", value: "Bangladeshi" },
        {
          label: "Date of birth",
          value: `${randomInt(1985, 2002)}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
        },
        { label: "Expiry date", value: isoDaysFromToday(randomInt(900, 3000)) },
      ],
    };
  }

  if (docType === "medical") {
    const date = isoDaysFromToday(-randomInt(1, 10));
    const status: MedicalStatus = pick(["fit", "fit", "inprogress"] as const);
    const fitDate = status === "fit" ? addDays(date, randomInt(1, 3)) : "";

    return {
      confidence,
      fields: [
        ...base,
        { label: "Medical date", value: date },
        { label: "Status", value: status === "fit" ? "Fit" : "In Progress" },
        ...(fitDate ? [{ label: "Fit date", value: fitDate }] : []),
      ],
      medical: { date, status, fitDate },
    };
  }

  const applicationNumber = `MOFA-${new Date().getFullYear()}-${randomDigits(6)}`;
  const applicationDate = isoDaysFromToday(-randomInt(0, 7));
  const trade = pick(dummyTrades);
  const agency = agencies.length ? pick(agencies) : null;

  return {
    confidence,
    fields: [
      ...base,
      { label: "Application No", value: applicationNumber },
      { label: "Application date", value: applicationDate },
      { label: "Trade", value: trade },
      ...(agency ? [{ label: "Agency", value: agency.name }] : []),
    ],
    mofa: {
      applicationNumber,
      applicationDate,
      trade,
      agencyId: agency?.id ?? "",
    },
  };
}

/* ───────── Upload / scan card ───────── */

function DocumentDropzone({
  title,
  hint,
  icon: Icon,
  scan,
  disabled,
  compact,
  onFile,
}: {
  title: string;
  hint: string;
  icon: LucideIcon;
  scan: ScanState;
  disabled?: boolean;
  compact?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const scanning = scan.status === "scanning";
  const done = scan.status === "done";
  const locked = !!disabled || scanning;

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!locked) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!locked) handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-lg border border-dashed p-4 transition-colors",
        dragging && "border-primary bg-primary/5",
        done && "border-primary/40 bg-muted/30",
        disabled && !done && "opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              done
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {done ? (
              <Check className="h-4 w-4" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {done || scanning ? scan.fileName : hint}
            </p>
          </div>
        </div>

        {done ? (
          <Badge variant="secondary" className="shrink-0">
            {scan.confidence}% match
          </Badge>
        ) : null}
      </div>

      {scan.status === "idle" && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Drop a file here or choose one · JPG, PNG, PDF · max 10 MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={locked}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            Upload {title}
          </Button>
        </div>
      )}

      {scanning && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reading document…
          </div>
          <Progress value={scan.progress} className="h-1.5" />
        </div>
      )}

      {done && (
        <div className="mt-3 space-y-3">
          <dl
            className={cn(
              "grid gap-x-4 gap-y-1.5 text-sm",
              compact ? "grid-cols-1 text-xs" : "sm:grid-cols-2",
            )}
          >
            {scan.fields?.map((field) => (
              <div key={field.label} className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-muted-foreground">
                  {field.label}:
                </dt>
                <dd className="min-w-0 truncate font-medium">{field.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatSize(scan.fileSize)} · Data added to the form
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={locked}
              onClick={() => inputRef.current?.click()}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Replace
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Duplicate / existing candidate
  const [duplicate, setDuplicate] = useState<ExistingCandidateInfo | null>(
    null,
  );
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [linkedExisting, setLinkedExisting] = useState(false);
  const [existingRecords, setExistingRecords] = useState({
    medical: false,
    mofa: false,
  });
  const passportInputRef = useRef<HTMLInputElement>(null);

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

  // Dummy OCR
  const [scans, setScans] = useState<Record<DocType, ScanState>>({
    passport: idleScan,
    medical: idleScan,
    mofa: idleScan,
  });
  const identityRef = useRef<DummyIdentity | null>(null);
  const mountedRef = useRef(true);

  const anyScanning = Object.values(scans).some(
    (scan) => scan.status === "scanning",
  );

  const nameMismatch =
    !!duplicate &&
    !!name.trim() &&
    normalizeName(name) !== normalizeName(duplicate.candidate.name);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  // Passport duplicate check (typed or filled by OCR)
  useEffect(() => {
    if (savedCandidate) {
      setDuplicate(null);
      setCheckingDuplicate(false);
      return;
    }

    const normalized = normalizePassport(passportNo);

    if (normalized.length < 6) {
      setDuplicate(null);
      setCheckingDuplicate(false);
      return;
    }

    let cancelled = false;
    setCheckingDuplicate(true);

    const timer = setTimeout(async () => {
      const info = await lookupPassport(normalized);

      if (cancelled) return;

      setDuplicate(info);
      setCheckingDuplicate(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [passportNo, savedCandidate]);

  function linkExistingCandidate(info: ExistingCandidateInfo) {
    const extra = info.candidate as unknown as {
      country?: string | null;
      received_date?: string | null;
    };

    const countryKey = Object.entries(countryValues).find(
      ([, label]) => label === extra.country,
    )?.[0];

    setSavedCandidate(info.candidate);
    setName(info.candidate.name);
    setPassportNo(info.candidate.passport_no);
    if (countryKey) setCountry(countryKey);
    if (extra.received_date) setReceivedDate(extra.received_date.slice(0, 10));

    setDuplicate(null);
    setLinkedExisting(true);
    setExistingRecords({ medical: !!info.medicalId, mofa: info.hasMofa });
    setErrorMessage("");

    if (info.medicalId) {
      setSavedMedicalId(info.medicalId);
      setMedicalSaved(true);
    }

    if (info.hasMofa) {
      setMofaSaved(true);
    }

    if (info.medicalId && info.hasMofa) {
      setSuccessMessage(
        "Existing candidate linked. Medical and MOFA records already exist.",
      );
      setCurrentStep(3);
    } else if (info.medicalId) {
      setSuccessMessage(
        "Existing candidate linked. Medical already exists — continue with MOFA.",
      );
      setCurrentStep(3);
    } else {
      setSuccessMessage(
        "Existing candidate linked. Continue with the Medical record.",
      );
      setCurrentStep(2);
    }
  }

  async function handleScan(docType: DocType, file: File) {
    const isSupported =
      file.type.startsWith("image/") || file.type === "application/pdf";

    if (!isSupported || file.size > 10 * 1024 * 1024) {
      setErrorMessage("Only image or PDF files up to 10 MB are supported.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    // All 3 documents of one candidate carry the same name + passport.
    // Re-scanning the same document type = a different candidate's document.
    let identity: DummyIdentity;

    if (savedCandidate) {
      identity = {
        name: savedCandidate.name,
        passportNo: savedCandidate.passport_no,
      };
    } else if (identityRef.current && scans[docType].status === "idle") {
      identity = identityRef.current;
    } else {
      identity = createDummyIdentity();
      identityRef.current = identity;
      setScans({ passport: idleScan, medical: idleScan, mofa: idleScan });
    }

    setScans((prev) => ({
      ...prev,
      [docType]: {
        status: "scanning",
        progress: 5,
        fileName: file.name,
        fileSize: file.size,
      },
    }));

    for (const progress of [20, 40, 60, 80, 95]) {
      await sleep(260);
      if (!mountedRef.current) return;

      setScans((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], progress },
      }));
    }

    await sleep(200);
    if (!mountedRef.current) return;

    const result = buildDummyOcr(docType, identity, agencies);

    // Fill the form
    if (!savedCandidate) {
      setName(identity.name);
      setPassportNo(identity.passportNo);
    }

    if (result.medical && !medicalSaved) {
      setMedicalDate(result.medical.date);
      setMedicalStatus(result.medical.status);
      setFitDate(result.medical.fitDate);
    }

    if (result.mofa && !mofaSaved) {
      setApplicationNumber(result.mofa.applicationNumber);
      setApplicationDate(result.mofa.applicationDate);
      setTrade(result.mofa.trade);
      setAgencyId(result.mofa.agencyId);
    }

    setScans((prev) => ({
      ...prev,
      [docType]: {
        status: "done",
        progress: 100,
        fileName: file.name,
        fileSize: file.size,
        confidence: result.confidence,
        fields: result.fields,
      },
    }));
  }

  async function handleCandidateSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || savedCandidate) return;

    if (!name.trim() || !passportNo.trim() || !country) {
      setErrorMessage("Name, passport number and country are required.");
      return;
    }

    if (duplicate) {
      setErrorMessage(
        "This passport number is already registered. Use the existing candidate or change the passport number.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const input: CandidateInput = {
        name: name.trim(),
        passport_no: normalizePassport(passportNo),
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

      const isDuplicateError =
        err.code === "23505" ||
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("unique");

      setErrorMessage(
        isDuplicateError ? "This passport number already exists." : message,
      );

      // Someone else saved it a moment ago: show the existing candidate card.
      if (isDuplicateError) {
        setDuplicate(await lookupPassport(normalizePassport(passportNo)));
      }
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
        ? linkedExisting
          ? "Existing Candidate"
          : "Candidate Saved"
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
          <Separator />

          <CardContent className="space-y-6 pt-6">
            {/* ───── Step 1 ───── */}
            {currentStep === 1 && (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">
                      Scan documents (optional)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Any one document is enough — name and passport number
                      are read from it automatically. Medical and MOFA
                      documents also fill their own steps.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <DocumentDropzone
                      compact
                      title="Passport"
                      hint="Passport copy"
                      icon={UserRound}
                      scan={scans.passport}
                      disabled={saving || !!savedCandidate}
                      onFile={(file) => void handleScan("passport", file)}
                    />
                    <DocumentDropzone
                      compact
                      title="Medical"
                      hint="Medical report"
                      icon={Stethoscope}
                      scan={scans.medical}
                      disabled={saving || !!savedCandidate}
                      onFile={(file) => void handleScan("medical", file)}
                    />
                    <DocumentDropzone
                      compact
                      title="MOFA"
                      hint="MOFA application"
                      icon={FileCheck}
                      scan={scans.mofa}
                      disabled={saving || !!savedCandidate}
                      onFile={(file) => void handleScan("mofa", file)}
                    />
                  </div>
                </div>

                <Separator />

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
                        ref={passportInputRef}
                        placeholder="Enter passport number"
                        value={passportNo}
                        onChange={(event) =>
                          setPassportNo(event.target.value.toUpperCase())
                        }
                        disabled={saving || !!savedCandidate}
                        aria-invalid={!!duplicate}
                        required
                      />
                      {checkingDuplicate && !savedCandidate && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking passport number…
                        </p>
                      )}
                    </div>

                    {duplicate && !savedCandidate && (
                      <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-700 md:col-span-2 dark:text-amber-400 [&>svg]:text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                          This passport number is already registered
                        </AlertTitle>
                        <AlertDescription className="space-y-3">
                          <div className="space-y-1.5 text-foreground">
                            <p className="text-sm font-medium">
                              {duplicate.candidate.name} ·{" "}
                              {duplicate.candidate.passport_no} · SL{" "}
                              {duplicate.candidate.sl ?? "—"}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant={
                                  duplicate.medicalId ? "secondary" : "outline"
                                }
                              >
                                Medical {duplicate.medicalId ? "✓" : "—"}
                              </Badge>
                              <Badge
                                variant={
                                  duplicate.hasMofa ? "secondary" : "outline"
                                }
                              >
                                MOFA {duplicate.hasMofa ? "✓" : "—"}
                              </Badge>
                            </div>
                            {nameMismatch && (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                The name on this form differs from the
                                registered name. Check that the passport number
                                is correct.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => linkExistingCandidate(duplicate)}
                            >
                              Use existing candidate
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                passportInputRef.current?.focus();
                                passportInputRef.current?.select();
                              }}
                            >
                              Change passport number
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="received-date">Received Date</Label>
                      <Input
                        id="received-date"
                        type="date"
                        value={receivedDate}
                        onChange={(event) =>
                          setReceivedDate(event.target.value)
                        }
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
                      <p className="text-sm font-medium">
                        {linkedExisting
                          ? "Existing candidate linked"
                          : "Candidate saved"}
                      </p>
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
              </>
            )}

            {/* ───── Step 2 ───── */}
            {currentStep === 2 && (
              <>
                <DocumentDropzone
                  title="Medical document"
                  hint="Medical report or slip"
                  icon={Stethoscope}
                  scan={scans.medical}
                  disabled={saving || medicalSaved}
                  onFile={(file) => void handleScan("medical", file)}
                />

                <Separator />

                <form
                  id="medical-registration-form"
                  onSubmit={handleMedicalSubmit}
                  className="space-y-6"
                >
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                    <p className="text-sm font-medium">Selected Candidate</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {savedCandidate?.name} · {savedCandidate?.passport_no} ·
                      SL {savedCandidate?.sl ?? "—"}
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
                          <SelectItem value="inprogress">
                            In Progress
                          </SelectItem>
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
                      <p className="font-medium">
                        {existingRecords.medical
                          ? "Existing medical record linked"
                          : "Medical saved successfully"}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Medical ID: {savedMedicalId}
                      </p>
                    </div>
                  )}
                </form>
              </>
            )}

            {/* ───── Step 3 ───── */}
            {currentStep === 3 && (
              <>
                <DocumentDropzone
                  title="MOFA document"
                  hint="MOFA application copy"
                  icon={FileCheck}
                  scan={scans.mofa}
                  disabled={saving || mofaSaved}
                  onFile={(file) => void handleScan("mofa", file)}
                />

                <Separator />

                <form
                  id="mofa-registration-form"
                  onSubmit={handleMofaSubmit}
                  className="space-y-6"
                >
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                    <p className="text-sm font-medium">Selected Candidate</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {savedCandidate?.name} · {savedCandidate?.passport_no} ·
                      SL {savedCandidate?.sl ?? "—"}
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
                      <p className="font-medium">
                        {existingRecords.mofa
                          ? "This candidate already has a MOFA record"
                          : "MOFA saved successfully"}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {existingRecords.mofa
                          ? "No new MOFA record was created."
                          : "Candidate, Medical and MOFA registration steps are complete."}
                      </p>
                    </div>
                  )}
                </form>
              </>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
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
                disabled={
                  saving || anyScanning || !!savedCandidate || !!duplicate
                }
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
                disabled={
                  saving || anyScanning || medicalSaved || !savedCandidate
                }
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
                disabled={
                  saving || anyScanning || mofaSaved || !savedCandidate
                }
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