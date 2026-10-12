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
import { extractWafidMedical } from "../ocr/new/services/wafid-reder";
import {
  getAgents,
} from "../agents/agents-service";
import {
  crossCheckWithPassport,
  readMofa,
} from "../ocr/new/services/mofa-reader";
import { readPassport } from "../ocr/new/services/passport-ocr-service";
import type { Agent } from "../agents/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  // CardDescription,
  // CardHeader,
  // CardTitle,
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


type DocType = "passport" | "medical" | "mofa";

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

const idleScan: ScanState = {
  status: "idle",
  progress: 0,
};

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
// Agent
const [agents, setAgents] = useState<Agent[]>([]);
const [agentId, setAgentId] = useState("");
const [agentsLoading, setAgentsLoading] = useState(true);
const [agentLoadError, setAgentLoadError] = useState("");
  // MOFA
  
const [mofaCrossCheck, setMofaCrossCheck] = useState<{
  passportNoMatches: boolean;
  nameMatches: boolean;
} | null>(null);

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

  const anyScanning = Object.values(scans).some(
    (scan) => scan.status === "scanning",
  );

  const nameMismatch =
    !!duplicate &&
    !!name.trim() &&
    normalizeName(name) !== normalizeName(duplicate.candidate.name);
useEffect(() => {
  let cancelled = false;

  async function loadAgents() {
    setAgentsLoading(true);
    setAgentLoadError("");

    try {
      const data = await getAgents();

      if (cancelled) return;

      setAgents(
        data.filter(
          (agent) => agent.is_active && !agent.is_deleted,
        ),
      );
    } catch (error) {
      if (cancelled) return;

      console.error("Failed to load agents:", error);
      setAgentLoadError("Could not load agents. Please try again.");
    } finally {
      if (!cancelled) {
        setAgentsLoading(false);
      }
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
  if (file.size > 10 * 1024 * 1024) {
    setErrorMessage("File size must be 10 MB or less.");
    return;
  }

 
  if (docType === "medical") {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMessage("Wafid Medical OCR-এর জন্য PDF ফাইল upload করো।");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    setScans((prev) => ({
      ...prev,
      medical: {
        status: "scanning",
        progress: 25,
        fileName: file.name,
        fileSize: file.size,
      },
    }));

    try {
      const result = await extractWafidMedical(file);

      // Wafid date format: DD/MM/YYYY → YYYY-MM-DD
      const toInputDate = (value: string) => {
        const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
      };

      const extractedDate = toInputDate(result.medicalExamDate);
      const normalizedStatus = result.status.trim().toLowerCase();

      const extractedStatus: MedicalStatus =
        normalizedStatus === "fit"
          ? "fit"
          : normalizedStatus === "unfit"
            ? "unfit"
            : "under_review";

      if (extractedDate) {
        setMedicalDate(extractedDate);
      }

      setMedicalStatus(extractedStatus);

      setScans((prev) => ({
        ...prev,
        medical: {
          status: "done",
          progress: 100,
          fileName: file.name,
          fileSize: file.size,
          fields: [
            { label: "First Name", value: result.firstName || "Not detected" },
            { label: "Last Name", value: result.lastName || "Not detected" },
            { label: "Passport No", value: result.passportNo || "Not detected" },
            {
              label: "Medical Examination Date",
              value: result.medicalExamDate || "Not detected",
            },
            {
              label: "GCC Examination Date",
              value: result.gccExamDate || "Not detected",
            },
            {
              label: "Medical Center",
              value: result.medicalCenter || "Not detected",
            },
            { label: "Status", value: result.status || "Not detected" },
          ],
        },
      }));

      setSuccessMessage(
        "Medical OCR complete. Verify the extracted date and status before saving.",
      );
    } catch (error) {
      console.error("Wafid Medical OCR failed:", error);

      setScans((prev) => ({
        ...prev,
        medical: idleScan,
      }));

      setErrorMessage(
        error instanceof Error
          ? `Medical OCR failed: ${error.message}`
          : "Medical OCR failed. Please check the PDF and try again.",
      );
    }

    return;
  }


  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (docType === "passport" && !file.type.startsWith("image/")) {
    setErrorMessage(
      "Passport OCR-এর জন্য JPG বা PNG image upload করো।",
    );
    return;
  }

  if (docType === "mofa" && !isPdf && !file.type.startsWith("image/")) {
    setErrorMessage("MOFA OCR-এর জন্য PDF, JPG অথবা PNG file দাও।");
    return;
  }

  setErrorMessage("");
  setSuccessMessage("");

  if (docType === "mofa") {
    setMofaCrossCheck(null);
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

  try {
    // ───────── Passport OCR ─────────
    if (docType === "passport") {
      const result = await readPassport(file, (progress) => {
        setScans((prev) => ({
          ...prev,
          passport: {
            ...prev.passport,
            status: "scanning",
            progress,
            fileName: file.name,
            fileSize: file.size,
          },
        }));
      });

      if (!savedCandidate) {
        setName(result.name);
        setPassportNo(result.passportNo);
      }

      const fields: OcrField[] = [
        { label: "Name", value: result.name || "Not detected" },
        {
          label: "Passport No",
          value: result.passportNo || "Not detected",
        },
        {
          label: "Nationality",
          value: result.nationality || "Not detected",
        },
        {
          label: "Date of birth",
          value: result.dateOfBirth || "Not detected",
        },
        { label: "Sex", value: result.sex || "Not detected" },
        {
          label: "Expiry date",
          value: result.expiryDate || "Not detected",
        },
      ];

      setScans((prev) => ({
        ...prev,
        passport: {
          status: "done",
          progress: 100,
          fileName: file.name,
          fileSize: file.size,
          confidence: result.confidence,
          fields,
        },
      }));

      setSuccessMessage(
        "Passport OCR complete. Please verify the extracted information before saving.",
      );

      return;
    }

    // ───────── MOFA OCR ─────────
    const result = await readMofa(file);

    // Fill the existing MOFA form fields.
    setApplicationNumber(result.applicationNumber || "");
    setApplicationDate(result.applicationDate || "");
    setTrade(result.trade || "");

    // Compare the extracted MOFA data with the selected candidate.
    const passportForCheck = {
      passportNo: savedCandidate?.passport_no ?? passportNo,
      name: savedCandidate?.name ?? name,
    };

    if (
      result.passportNo &&
      result.name &&
      passportForCheck.passportNo.trim() &&
      passportForCheck.name.trim()
    ) {
      setMofaCrossCheck(
        crossCheckWithPassport(result, passportForCheck),
      );
    }

    const fields: OcrField[] = [
      {
        label: "Application No",
        value: result.applicationNumber || "Not detected",
      },
      {
        label: "Application Date",
        value: result.applicationDate || "Not detected",
      },
      { label: "Name", value: result.name || "Not detected" },
      {
        label: "Passport No",
        value: result.passportNo || "Not detected",
      },
      {
        label: "Occupation / Trade",
        value: result.trade || "Not detected",
      },
      {
        label: "Visa Type",
        value: result.visaType || "Not detected",
      },
      {
        label: "Date of Birth",
        value: result.dateOfBirth || "Not detected",
      },
      {
        label: "Expiry Date",
        value: result.expiryDate || "Not detected",
      },
      {
        label: "Gender",
        value: result.gender || "Not detected",
      },
      ...(result.reviewFields.length
        ? [
            {
              label: "Review required",
              value: result.reviewFields.join(", "),
            },
          ]
        : []),
    ];

    setScans((prev) => ({
      ...prev,
      mofa: {
        status: "done",
        progress: 100,
        fileName: file.name,
        fileSize: file.size,
        confidence: result.source === "pdf-text" ? 100 : 85,
        fields,
      },
    }));

    setSuccessMessage(
      result.reviewFields.length
        ? "MOFA OCR complete. Please review the extracted fields before saving."
        : "MOFA OCR complete. Please verify the extracted information before saving.",
    );
  } catch (error) {
    console.error(`${docType} OCR failed:`, error);

    setScans((prev) => ({
      ...prev,
      [docType]: idleScan,
    }));

    setErrorMessage(
      error instanceof Error
        ? error.message
        : `${docType === "mofa" ? "MOFA" : "Passport"} OCR failed. Please try another file.`,
    );
  }
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
        agent_id: agentId || null,
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
                      Passport image থেকে real OCR দিয়ে তথ্য পড়া হবে।
Medical ও MOFA OCR এখনো চালু হয়নি।
OCR-এর তথ্য যাচাই করে তারপর Candidate save করো।
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

                   <div className="space-y-1.5">
  <Label>Country *</Label>

  <div className="flex flex-wrap gap-1.5">
    {countries.map((item) => {
      const selected = country === item;

      return (
        <button
          key={item}
          type="button"
          onClick={() => setCountry(item)}
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          {item}
        </button>
      );
    })}
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
          agentsLoading ? "Loading agents..." : "Select agent (optional)"
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
    <p className="text-xs text-destructive">{agentLoadError}</p>
  ) : !agentsLoading && agents.length === 0 ? (
    <p className="text-xs text-muted-foreground">
      No active agents found. Add an agent from the Agents module.
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
            
{mofaCrossCheck && (
  <Alert
    variant={
      mofaCrossCheck.passportNoMatches &&
      mofaCrossCheck.nameMatches
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
        {mofaCrossCheck.nameMatches
          ? "Matched"
          : "Does not match"}
      </p>

      <p className="mt-1">
        Please verify the details against both documents before saving.
      </p>
    </AlertDescription>
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