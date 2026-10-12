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
  RotateCcw,
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
import { Card, CardContent } from "@/components/ui/card";
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

import { getAgents } from "../agents/agents-service";
import type { Agent } from "../agents/types";
import { extractKsaVisa } from "../ocr/new/services/kisa-visa";
import {
  crossCheckWithPassport,
  readMofa,
} from "../ocr/new/services/mofa-reader";
import { readPassport } from "../ocr/new/services/passport-ocr-service";
import { extractWafidMedical } from "../ocr/new/services/wafid-reder";
import { createMedical, type MedicalStatus } from "../medical/medical-service";
import {
  createMofa,
  getMofaAgencies,
  type MofaAgency,
  type MofaStage,
} from "../mofa/mofa-service";
import {
  createCandidate,
  findCandidateByPassport,
  type Candidate,
  type ExistingCandidateInfo,
} from "./candidate-service";

/* ─────────────────────────────────────────────────────────────
 * Constants
 * ───────────────────────────────────────────────────────────── */

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const NOT_DETECTED = "Not detected";

const countries = [
  "Saudi Arabia",
  "Mauritius",
  "Laos",
  "Malaysia",
  "Belarus",
  "Fiji",
  "UAE",
] as const;

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

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */

type DocType = "passport" | "medical" | "mofa" | "visa";

type OcrField = {
  label: string;
  value: string;
};

type ScanState = {
  status: "idle" | "scanning" | "done";
  progress: number;
  fileName?: string;
  fileSize?: number;
  confidence?: number;
  fields?: OcrField[];
};

type MofaCrossCheck = {
  passportNoMatches: boolean;
  nameMatches: boolean;
};

type ResolvedCandidate = {
  info: ExistingCandidateInfo;
  created: boolean;
};

const idleScan: ScanState = { status: "idle", progress: 0 };

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

const today = () => new Date().toISOString().slice(0, 10);

function normalizePassport(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  const message = (error as { message?: string } | null)?.message;
  return message || fallback;
}

function isDuplicateError(error: unknown) {
  const err = error as { message?: string; code?: string } | null;
  const message = (err?.message ?? "").toLowerCase();
  return (
    err?.code === "23505" ||
    message.includes("duplicate") ||
    message.includes("unique")
  );
}

/** Wafid date format: DD/MM/YYYY → YYYY-MM-DD */
function toInputDate(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function toMedicalStatus(value: string): MedicalStatus {
  const status = value.trim().toLowerCase();
  if (status === "fit") return "fit";
  if (status === "unfit") return "unfit";
  return "under_review";
}

function field(label: string, value?: string | null): OcrField {
  return { label, value: value || NOT_DETECTED };
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
 * Upload / scan card
 * ───────────────────────────────────────────────────────────── */

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

        {done && (
          <Badge variant="secondary" className="shrink-0">
            {scan.confidence == null
              ? "Read complete"
              : `${scan.confidence}% match`}
          </Badge>
        )}
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
            {scan.fields?.map((item) => (
              <div key={item.label} className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-muted-foreground">
                  {item.label}:
                </dt>
                <dd className="min-w-0 truncate font-medium">{item.value}</dd>
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

/* ─────────────────────────────────────────────────────────────
 * Page
 * ───────────────────────────────────────────────────────────── */

export function CandidateRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Candidate
  const [name, setName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [receivedDate, setReceivedDate] = useState(today());
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [savedCandidate, setSavedCandidate] = useState<Candidate | null>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

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

  // Agent
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState("");

  // Medical
  const [medicalDate, setMedicalDate] = useState(today());
  const [fitDate, setFitDate] = useState("");
  const [medicalStatus, setMedicalStatus] = useState<MedicalStatus>("new");
  const [savedMedicalId, setSavedMedicalId] = useState<string | null>(null);
  const [medicalSaved, setMedicalSaved] = useState(false);

  // MOFA
  const [agencies, setAgencies] = useState<MofaAgency[]>([]);
  const [agencyId, setAgencyId] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [applicationDate, setApplicationDate] = useState(today());
  const [trade, setTrade] = useState("");
  const [mofaStage, setMofaStage] = useState<MofaStage>("new");
  const [mofaSaved, setMofaSaved] = useState(false);
  const [mofaCrossCheck, setMofaCrossCheck] = useState<MofaCrossCheck | null>(
    null,
  );

  // Shared
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [scans, setScans] = useState<Record<DocType, ScanState>>({
    passport: idleScan,
    medical: idleScan,
    mofa: idleScan,
    visa: idleScan,
  });

  const anyScanning = Object.values(scans).some(
    (scan) => scan.status === "scanning",
  );

  const nameMismatch =
    !!duplicate &&
    !!name.trim() &&
    normalizeName(name) !== normalizeName(duplicate.candidate.name);

  /* ───────── Data loading ───────── */

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setAgentsLoading(true);
      setAgentLoadError("");

      try {
        const data = await getAgents();
        if (cancelled) return;

        setAgents(
          data.filter((agent) => agent.is_active && !agent.is_deleted),
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load agents:", error);
        setAgentLoadError("Could not load agents. Please try again.");
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    }

    void loadAgents();

    return () => {
      cancelled = true;
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

  // Passport duplicate check (typed manually; OCR flows resolve on their own)
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

  /* ───────── Candidate resolution ───────── */

  /**
   * Finds a candidate by passport number. If none exists, creates one.
   * Used by every flow (passport / medical / MOFA, OCR or manual) so no
   * step requires the candidate to be saved first.
   */
  async function resolveCandidate(
    rawPassport: string,
    rawName: string,
  ): Promise<ResolvedCandidate> {
    const passport = normalizePassport(rawPassport);

    if (!passport) {
      throw new Error("Passport number is required.");
    }

    const existing = await lookupPassport(passport);
    if (existing) return { info: existing, created: false };

    if (!rawName.trim()) {
      throw new Error("Candidate name is required to create a new candidate.");
    }

    const result = await createCandidate({
      name: rawName.trim(),
      passport_no: passport,
      received_date: receivedDate || null,
      country: country || null,
      agent_id: agentId || null,
      current_stage: "candidate",
    });

    if (result.error) {
      // Someone saved the same passport a moment ago: use that record.
      if (isDuplicateError(result.error)) {
        const raced = await lookupPassport(passport);
        if (raced) return { info: raced, created: false };
      }
      throw result.error;
    }

    if (!result.data) {
      throw new Error("Candidate was not returned after saving.");
    }

    return {
      info: {
        candidate: result.data,
        medicalId: null,
        hasMofa: false,
      } as ExistingCandidateInfo,
      created: true,
    };
  }

  /** Makes a resolved candidate the active one on the page. */
  function applyCandidate({ info, created }: ResolvedCandidate) {
    const extra = info.candidate as unknown as {
      country?: string | null;
      received_date?: string | null;
    };

    setSavedCandidate(info.candidate);
    setName(info.candidate.name);
    setPassportNo(info.candidate.passport_no);
    setLinkedExisting(!created);
    setDuplicate(null);

    if (!created) {
      if (extra.country) setCountry(extra.country);
      if (extra.received_date) {
        setReceivedDate(extra.received_date.slice(0, 10));
      }
    }

    setExistingRecords({ medical: !!info.medicalId, mofa: info.hasMofa });
    setSavedMedicalId(info.medicalId ?? null);
    setMedicalSaved(!!info.medicalId);
    setMofaSaved(info.hasMofa);
  }

  function linkExistingCandidate(info: ExistingCandidateInfo) {
    applyCandidate({ info, created: false });
    setErrorMessage("");

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

  function resetRegistration() {
    setCurrentStep(1);
    setName("");
    setPassportNo("");
    setReceivedDate(today());
    setCountry("");
    setNotes("");
    setSavedCandidate(null);
    setDuplicate(null);
    setLinkedExisting(false);
    setExistingRecords({ medical: false, mofa: false });
    setAgentId("");
    setMedicalDate(today());
    setFitDate("");
    setMedicalStatus("new");
    setSavedMedicalId(null);
    setMedicalSaved(false);
    setAgencyId("");
    setApplicationNumber("");
    setApplicationDate(today());
    setTrade("");
    setMofaStage("new");
    setMofaSaved(false);
    setMofaCrossCheck(null);
    setScans({
      passport: idleScan,
      medical: idleScan,
      mofa: idleScan,
      visa: idleScan,
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  /* ───────── Record savers (shared by OCR + manual forms) ───────── */

  async function saveMedicalFor(
    rawPassport: string,
    rawName: string,
    values: {
      medicalDate: string;
      fitDate: string;
      status: MedicalStatus;
    },
  ) {
    const resolved = await resolveCandidate(rawPassport, rawName);
    applyCandidate(resolved);

    const { info, created } = resolved;
    const candidateLabel = created
      ? "New candidate created"
      : "Existing candidate found";

    if (info.medicalId) {
      setSuccessMessage(
        `${candidateLabel}. A medical record already exists, so no new one was added.`,
      );
      return;
    }

    const result = await createMedical({
      candidate_id: info.candidate.id,
      medical_date: values.medicalDate || null,
      fit_date: values.status === "fit" ? values.fitDate || null : null,
      status: values.status,
    });

    if (result.error) throw result.error;
    if (!result.data) {
      throw new Error("Medical record was not returned after saving.");
    }

    setSavedMedicalId(result.data.id);
    setMedicalSaved(true);
    setSuccessMessage(`${candidateLabel}. Medical record saved.`);
  }

  async function saveMofaFor(
    rawPassport: string,
    rawName: string,
    values: {
      agencyId: string;
      applicationNumber: string;
      applicationDate: string;
      trade: string;
      stage: MofaStage;
    },
  ) {
    const resolved = await resolveCandidate(rawPassport, rawName);
    applyCandidate(resolved);

    const { info, created } = resolved;
    const candidateLabel = created
      ? "New candidate created"
      : "Existing candidate found";

    if (info.hasMofa) {
      setSuccessMessage(
        `${candidateLabel}. A MOFA record already exists, so no new one was added.`,
      );
      return resolved;
    }

    if (
      (values.stage === "medupdated" || values.stage === "approved") &&
      !info.medicalId
    ) {
      throw new Error(
        "This candidate has no Medical record yet. Add a Medical record before selecting this MOFA stage.",
      );
    }

    const result = await createMofa({
      candidate_id: info.candidate.id,
      medical_id: info.medicalId ?? null,
      agency_id: values.agencyId || null,
      application_number: values.applicationNumber.trim() || null,
      application_date: values.applicationDate || null,
      trade: values.trade.trim() || null,
      stage: values.stage,
    });

    if (result.error) throw result.error;
    if (!result.data) {
      throw new Error("MOFA record was not returned after saving.");
    }

    setMofaSaved(true);
    setSuccessMessage(`${candidateLabel}. MOFA record saved.`);
    return resolved;
  }

  /* ───────── OCR ───────── */

  function setScan(docType: DocType, scan: ScanState) {
    setScans((prev) => ({ ...prev, [docType]: scan }));
  }

  async function handleScan(docType: DocType, file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("File size must be 10 MB or less.");
      return;
    }

    const isPdf = isPdfFile(file);
    const isImage = file.type.startsWith("image/");

    if (docType === "passport" && !isImage) {
      setErrorMessage("Upload a JPG or PNG image for Passport OCR.");
      return;
    }
    if (docType === "medical" && !isPdf) {
      setErrorMessage("Upload a PDF file for Wafid Medical OCR.");
      return;
    }
    if (docType === "mofa" && !isPdf && !isImage) {
      setErrorMessage("Upload a PDF, JPG or PNG file for MOFA OCR.");
      return;
    }
    if (docType === "visa" && !isPdf) {
      setErrorMessage("Upload a PDF file for Saudi Visa OCR.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    if (docType === "mofa") setMofaCrossCheck(null);

    const base = { fileName: file.name, fileSize: file.size };

    setScan(docType, { status: "scanning", progress: 5, ...base });
    setSaving(true);

    try {
      if (docType === "passport") await scanPassport(file, base);
      else if (docType === "medical") await scanMedical(file, base);
      else if (docType === "mofa") await scanMofa(file, base);
      else await scanVisa(file, base);
    } catch (error) {
      console.error(`${docType} OCR / save failed:`, error);

      // Keep the scan card if the document itself was read successfully.
      setScans((prev) =>
        prev[docType].status === "done"
          ? prev
          : { ...prev, [docType]: idleScan },
      );

      setErrorMessage(errorText(error, "Something went wrong. Try again."));
    } finally {
      setSaving(false);
    }
  }

  async function scanPassport(
    file: File,
    base: { fileName: string; fileSize: number },
  ) {
    const result = await readPassport(file, (progress) => {
      setScans((prev) => ({
        ...prev,
        passport: { ...prev.passport, status: "scanning", progress, ...base },
      }));
    });

    setName(result.name);
    setPassportNo(result.passportNo);

    setScan("passport", {
      status: "done",
      progress: 100,
      ...base,
      confidence: result.confidence,
      fields: [
        field("Name", result.name),
        field("Passport No", result.passportNo),
        field("Nationality", result.nationality),
        field("Date of birth", result.dateOfBirth),
        field("Sex", result.sex),
        field("Expiry date", result.expiryDate),
      ],
    });

    if (!result.passportNo) {
      setSuccessMessage(
        "Passport read, but no passport number was detected. Enter it manually.",
      );
      return;
    }

    const resolved = await resolveCandidate(result.passportNo, result.name);
    applyCandidate(resolved);

    setSuccessMessage(
      resolved.created
        ? "Passport read. New candidate created. Verify the details."
        : "Passport read. This passport is already registered — existing candidate linked.",
    );
  }

  async function scanMedical(
    file: File,
    base: { fileName: string; fileSize: number },
  ) {
    setScan("medical", { status: "scanning", progress: 25, ...base });

    const result = await extractWafidMedical(file);

    const extractedDate = toInputDate(result.medicalExamDate);
    const extractedStatus = toMedicalStatus(result.status);
    const fullName = [result.firstName, result.lastName]
      .filter(Boolean)
      .join(" ");

    if (extractedDate) setMedicalDate(extractedDate);
    setMedicalStatus(extractedStatus);

    setScan("medical", {
      status: "done",
      progress: 100,
      ...base,
      fields: [
        field("First Name", result.firstName),
        field("Last Name", result.lastName),
        field("Passport No", result.passportNo),
        field("Medical Examination Date", result.medicalExamDate),
        field("GCC Examination Date", result.gccExamDate),
        field("Medical Center", result.medicalCenter),
        field("Status", result.status),
      ],
    });

    if (!result.passportNo) {
      setSuccessMessage(
        "Medical read, but no passport number was detected. Enter the passport number and save manually.",
      );
      return;
    }

    if (!savedCandidate) {
      setName(fullName);
      setPassportNo(normalizePassport(result.passportNo));
    }

    await saveMedicalFor(result.passportNo, fullName, {
      medicalDate: extractedDate || medicalDate,
      fitDate,
      status: extractedStatus,
    });
  }

  async function scanMofa(
    file: File,
    base: { fileName: string; fileSize: number },
  ) {
    const result = await readMofa(file);

    // Fill the MOFA form fields.
    setApplicationNumber(result.applicationNumber || "");
    setApplicationDate(result.applicationDate || "");
    setTrade(result.trade || "");

    setScan("mofa", {
      status: "done",
      progress: 100,
      ...base,
      confidence: result.source === "pdf-text" ? 100 : 85,
      fields: [
        field("Application No", result.applicationNumber),
        field("Application Date", result.applicationDate),
        field("Name", result.name),
        field("Passport No", result.passportNo),
        field("Occupation / Trade", result.trade),
        field("Visa Type", result.visaType),
        field("Date of Birth", result.dateOfBirth),
        field("Expiry Date", result.expiryDate),
        field("Gender", result.gender),
        ...(result.reviewFields.length
          ? [
              {
                label: "Review required",
                value: result.reviewFields.join(", "),
              },
            ]
          : []),
      ],
    });

    if (!result.passportNo) {
      setSuccessMessage(
        "MOFA read, but no passport number was detected. Enter the passport number and save manually.",
      );
      return;
    }

    if (!savedCandidate) {
      setName(result.name || "");
      setPassportNo(normalizePassport(result.passportNo));
    }

    const resolved = await saveMofaFor(result.passportNo, result.name || "", {
      agencyId,
      applicationNumber: result.applicationNumber || "",
      applicationDate: result.applicationDate || "",
      trade: result.trade || "",
      stage: mofaStage,
    });

    // Compare the extracted MOFA data with the candidate on record.
    if (result.name) {
      setMofaCrossCheck(
        crossCheckWithPassport(result, {
          passportNo: resolved.info.candidate.passport_no,
          name: resolved.info.candidate.name,
        }),
      );
    }

    if (result.reviewFields.length) {
      setSuccessMessage(
        (prev) => `${prev} Review the highlighted MOFA fields.`,
      );
    }
  }

  async function scanVisa(
    file: File,
    base: { fileName: string; fileSize: number },
  ) {
    const result = await extractKsaVisa(file);

    const fields: OcrField[] = [
      field("Visa No.", result.visaNo),
      field("Valid From", result.validFrom),
      field("Valid Until", result.validUntil),
      field("Duration of Stay", result.durationOfStay),
      field("Place of Issue", result.placeOfIssue),
      field("Visa Type", result.visaType),
      field("Skill Level", result.skillLevel),
      field("Name", result.name),
      field("Nationality", result.nationality),
      field("Birth Date", result.birthDate),
      field("Passport No.", result.passportNo),
      field("Reference No.", result.refNo),
      field("Reference Date", result.refDate),
      field("Occupation", result.occupation),
      field("Employer", result.employerName),
      field("Visa Fees", result.visaFees),
      field("Application No.", result.applicationNo),
      ...(result.mrz.length > 0
        ? [{ label: "MRZ", value: result.mrz.join(" | ") }]
        : []),
    ];

    const detectedCount = fields.filter(
      (item) => item.value !== NOT_DETECTED,
    ).length;

    setScan("visa", { status: "done", progress: 100, ...base, fields });

    setSuccessMessage(
      detectedCount > 0
        ? `Visa PDF read complete. ${detectedCount} field(s) detected. Verify the extracted details.`
        : "Visa PDF opened, but no fields were detected. Check the PDF.",
    );
  }

  /* ───────── Manual form submits ───────── */

  async function handleCandidateSubmit(event: FormEvent<HTMLFormElement>) {
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
      const resolved = await resolveCandidate(passportNo, name);
      applyCandidate(resolved);

      setSuccessMessage(
        resolved.created
          ? "Candidate saved successfully."
          : "This passport is already registered — existing candidate linked.",
      );
      setCurrentStep(2);
    } catch (error) {
      console.error("Candidate registration error:", error);

      setErrorMessage(
        isDuplicateError(error)
          ? "This passport number already exists."
          : errorText(error, "Failed to save candidate."),
      );

      if (isDuplicateError(error)) {
        setDuplicate(await lookupPassport(normalizePassport(passportNo)));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleMedicalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || medicalSaved) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await saveMedicalFor(passportNo, name, {
        medicalDate,
        fitDate,
        status: medicalStatus,
      });
      setCurrentStep(3);
    } catch (error) {
      console.error("Medical registration error:", error);
      setErrorMessage(errorText(error, "Failed to save medical record."));
    } finally {
      setSaving(false);
    }
  }

  async function handleMofaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || mofaSaved) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await saveMofaFor(passportNo, name, {
        agencyId,
        applicationNumber,
        applicationDate,
        trade,
        stage: mofaStage,
      });
    } catch (error) {
      console.error("MOFA registration error:", error);
      setErrorMessage(errorText(error, "Failed to save MOFA record."));
    } finally {
      setSaving(false);
    }
  }

  function goToStep(step: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setCurrentStep(step);
  }

  /* ───────── Derived UI ───────── */

  const statusLabel = mofaSaved
    ? "Registration Complete"
    : medicalSaved
      ? "Medical Saved"
      : savedCandidate
        ? linkedExisting
          ? "Existing Candidate"
          : "Candidate Saved"
        : "Draft";

  const selectedCandidateCard = savedCandidate ? (
    <div className="rounded-lg border border-dashed bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Selected Candidate</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {savedCandidate.name} · {savedCandidate.passport_no} · SL{" "}
            {savedCandidate.sl ?? "—"}
          </p>
          {currentStep === 3 && (
            <p className="mt-1 text-sm text-muted-foreground">
              Medical ID: {savedMedicalId ?? "No Medical linked"}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={resetRegistration}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          New registration
        </Button>
      </div>
    </div>
  ) : (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`name-step-${currentStep}`}>Candidate Name</Label>
        <Input
          id={`name-step-${currentStep}`}
          placeholder="Enter full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`passport-step-${currentStep}`}>Passport Number</Label>
        <Input
          id={`passport-step-${currentStep}`}
          placeholder="Enter passport number"
          value={passportNo}
          onChange={(event) => setPassportNo(event.target.value.toUpperCase())}
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">
          If this passport is already registered, the record is added to that
          candidate. Otherwise a new candidate is created.
        </p>
      </div>
    </div>
  );

  /* ───────── Render ───────── */

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {/* ───────── Fixed header + stepper ───────── */}
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
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : completed
                      ? "border-primary/30 bg-muted/40"
                      : "border-border hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    active
                      ? "bg-primary text-primary-foreground"
                      : completed
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
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

      {/* ───────── Scrollable content ───────── */}
      <div className="flex-1 py-6">
        <Card>
          <Separator />

          <CardContent className="space-y-6 pt-6">
            {/* ───── Step 1: Candidate ───── */}
            {currentStep === 1 && (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">
                      Scan documents (optional)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Each document is matched by passport number. Existing
                      candidates are reused; new ones are created
                      automatically. Verify the extracted data afterwards.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <DocumentDropzone
                      compact
                      title="Passport"
                      hint="Passport copy"
                      icon={UserRound}
                      scan={scans.passport}
                      disabled={saving}
                      onFile={(file) => void handleScan("passport", file)}
                    />
                    <DocumentDropzone
                      compact
                      title="Medical"
                      hint="Wafid medical PDF"
                      icon={Stethoscope}
                      scan={scans.medical}
                      disabled={saving}
                      onFile={(file) => void handleScan("medical", file)}
                    />
                    <DocumentDropzone
                      compact
                      title="MOFA"
                      hint="MOFA application"
                      icon={FileCheck}
                      scan={scans.mofa}
                      disabled={saving}
                      onFile={(file) => void handleScan("mofa", file)}
                    />
                    <DocumentDropzone
                      compact
                      title="Saudi Visa"
                      hint="Saudi Visa PDF"
                      icon={FileCheck}
                      scan={scans.visa}
                      disabled={saving}
                      onFile={(file) => void handleScan("visa", file)}
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
                        onChange={(event) => setReceivedDate(event.target.value)}
                        disabled={saving || !!savedCandidate}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Country *</Label>

                      <div className="flex flex-wrap gap-1.5">
                        {countries.map((item) => (
                          <button
                            key={item}
                            type="button"
                            disabled={saving || !!savedCandidate}
                            onClick={() => setCountry(item)}
                            className={cn(
                              "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                              country === item
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted",
                            )}
                          >
                            {item}
                          </button>
                        ))}
                      </div>

                      {!country && (
                        <p className="text-xs text-muted-foreground">
                          Select a country.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Agent</Label>

                      <Select
                        value={agentId || "__none"}
                        onValueChange={(value) =>
                          setAgentId(value === "__none" ? "" : value)
                        }
                        disabled={saving || !!savedCandidate || agentsLoading}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue
                            placeholder={
                              agentsLoading
                                ? "Loading agents..."
                                : "Select agent (optional)"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="__none">No Agent</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name || "Unnamed Agent"}
                              {agent.code ? ` (${agent.code})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {agentLoadError ? (
                        <p className="text-xs text-destructive">
                          {agentLoadError}
                        </p>
                      ) : !agentsLoading && agents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No active agents found. Add an agent from the Agents
                          module.
                        </p>
                      ) : null}
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
                      <div className="flex items-start justify-between gap-3">
                        <div>
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          onClick={resetRegistration}
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" />
                          New registration
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}

            {/* ───── Step 2: Medical ───── */}
            {currentStep === 2 && (
              <>
                <DocumentDropzone
                  title="Medical document"
                  hint="Wafid medical PDF"
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
                  {selectedCandidateCard}

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

            {/* ───── Step 3: MOFA ───── */}
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
                  {selectedCandidateCard}

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

            {/* ───── Messages ───── */}
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

            {mofaCrossCheck && (
              <Alert
                variant={
                  mofaCrossCheck.passportNoMatches && mofaCrossCheck.nameMatches
                    ? "default"
                    : "destructive"
                }
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>MOFA / Passport Cross-check</AlertTitle>
                <AlertDescription>
                  <p>
                    Passport Number:{" "}
                    {mofaCrossCheck.passportNoMatches
                      ? "Matched"
                      : "Does not match"}
                  </p>
                  <p>
                    Name:{" "}
                    {mofaCrossCheck.nameMatches ? "Matched" : "Does not match"}
                  </p>
                  <p className="mt-1">
                    Verify the details against both documents.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───────── Fixed footer actions ───────── */}
      <div className="sticky bottom-0 z-20 border-t bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => goToStep(Math.max(1, currentStep - 1))}
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
                disabled={saving || anyScanning || medicalSaved}
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
                disabled={saving || anyScanning || mofaSaved}
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
