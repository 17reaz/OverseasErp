import { useEffect, useRef, useState, type FormEvent } from "react";

import { createVisa } from "../../../visa/visa-service";
import {
  createMedical,
  type MedicalStatus,
} from "../../../medical/medical-service";
import { createMofa, type MofaStage } from "../../../mofa/mofa-service";
import {
  createCandidate,
  type Candidate,
  type ExistingCandidateInfo,
} from "../../candidate-service";
import type { MofaCrossCheck, ResolvedCandidate } from "../types";
import {
  errorText,
  isDuplicateError,
  lookupPassport,
  normalizeName,
  normalizePassport,
  today,
} from "../utils/registration-utils";

export function useCandidateRegistration() {
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
  const [agentId, setAgentId] = useState("");

  // Medical
  const [medicalDate, setMedicalDate] = useState(today());
  const [fitDate, setFitDate] = useState("");
  const [medicalStatus, setMedicalStatus] = useState<MedicalStatus>("new");
  const [savedMedicalId, setSavedMedicalId] = useState<string | null>(null);
  const [medicalSaved, setMedicalSaved] = useState(false);

  // MOFA
  const [agencyId, setAgencyId] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [applicationDate, setApplicationDate] = useState(today());
  const [trade, setTrade] = useState("");
  const [mofaStage, setMofaStage] = useState<MofaStage>("new");
  const [mofaSaved, setMofaSaved] = useState(false);
  const [mofaCrossCheck, setMofaCrossCheck] = useState<MofaCrossCheck | null>(
    null,
  );

  // Visa
  const [visaNo, setVisaNo] = useState("");
  const [visaDate, setVisaDate] = useState("");
  const [visaExpiryDate, setVisaExpiryDate] = useState("");
  const [visaType, setVisaType] = useState("");
  const [visaStatus, setVisaStatus] = useState("issued");
  const [visaRemarks, setVisaRemarks] = useState("");
  const [visaSaved, setVisaSaved] = useState(false);

  // Shared
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const nameMismatch =
    !!duplicate &&
    !!name.trim() &&
    normalizeName(name) !== normalizeName(duplicate.candidate.name);

  /* ───────── Passport duplicate check (typed manually; OCR flows resolve on their own) ───────── */

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

  /** Resets all form state. Scan cards are reset separately by the OCR hook. */
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
    setVisaNo("");
    setVisaDate("");
    setVisaExpiryDate("");
    setVisaType("");
    setVisaStatus("issued");
    setVisaRemarks("");
    setVisaSaved(false);
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

  async function saveVisaFor(rawPassport: string, rawName: string) {
    const resolved = await resolveCandidate(rawPassport, rawName);
    applyCandidate(resolved);

    const result = await createVisa({
      candidate_id: resolved.info.candidate.id,
      mofa_id: null,
      visa_no: visaNo.trim() || null,
      visa_date: visaDate || null,
      expiry_date: visaExpiryDate || null,
      visa_type: visaType.trim() || "amel_id",
      status: visaStatus,
      agency_id: agencyId || null,
      remarks: visaRemarks.trim() || null,
    });

    if (!result) {
      throw new Error("Visa record was not returned after saving.");
    }

    setVisaSaved(true);
    setSuccessMessage(
      resolved.created
        ? "New candidate and Visa record saved successfully."
        : "Visa record saved successfully.",
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

  async function handleVisaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || visaSaved) return;

    if (!passportNo.trim() || !name.trim()) {
      setErrorMessage("Candidate name and passport number are required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await saveVisaFor(passportNo, name);
    } catch (error) {
      console.error("Visa registration error:", error);
      setErrorMessage(errorText(error, "Failed to save Visa record."));
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

  return {
    // navigation
    currentStep,
    goToStep,

    // candidate
    name,
    setName,
    passportNo,
    setPassportNo,
    receivedDate,
    setReceivedDate,
    country,
    setCountry,
    notes,
    setNotes,
    savedCandidate,
    passportInputRef,
    duplicate,
    checkingDuplicate,
    linkedExisting,
    existingRecords,
    nameMismatch,
    agentId,
    setAgentId,

    // medical
    medicalDate,
    setMedicalDate,
    fitDate,
    setFitDate,
    medicalStatus,
    setMedicalStatus,
    savedMedicalId,
    medicalSaved,
    saveMedicalFor,

    // mofa
    agencyId,
    setAgencyId,
    applicationNumber,
    setApplicationNumber,
    applicationDate,
    setApplicationDate,
    trade,
    setTrade,
    mofaStage,
    setMofaStage,
    mofaSaved,
    mofaCrossCheck,
    setMofaCrossCheck,
    saveMofaFor,

    // visa
    visaNo,
    setVisaNo,
    visaDate,
    setVisaDate,
    visaExpiryDate,
    setVisaExpiryDate,
    visaType,
    setVisaType,
    visaStatus,
    setVisaStatus,
    visaRemarks,
    setVisaRemarks,
    visaSaved,

    // shared
    saving,
    setSaving,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    statusLabel,

    // actions
    resolveCandidate,
    applyCandidate,
    linkExistingCandidate,
    resetRegistration,
    handleCandidateSubmit,
    handleMedicalSubmit,
    handleMofaSubmit,
    handleVisaSubmit,
  };
}

export type Registration = ReturnType<typeof useCandidateRegistration>;
