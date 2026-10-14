import { useEffect, useRef, useState, type FormEvent } from "react";
import { createVisa, getVisas } from "../../../visa/visa-service";
import {
  uploadCandidateMofa,
  uploadCandidateVisa,
  getActiveCandidateFile,
} from "../../candidate-files-service";
import {
  createMedical,
  type MedicalStatus,
} from "../../../medical/medical-service";
import {
  createMofa,
  getMofaByApplicationNumber,
  type Mofa,
  type MofaStage,
} from "../../../mofa/mofa-service";
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

const DEFAULT_VISA_TYPE = "amel_id";
const DEFAULT_VISA_STATUS = "processing";

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
  const [mofaUploadFile, setMofaUploadFile] = useState<File | null>(null);
  const [mofaCrossCheck, setMofaCrossCheck] = useState<MofaCrossCheck | null>(
    null,
  );
  const [existingMofaRecord, setExistingMofaRecord] = useState<Mofa | null>(
    null,
  );

  // Visa
  const [visaNo, setVisaNo] = useState("");
  const [visaDate, setVisaDate] = useState("");
  const [visaExpiryDate, setVisaExpiryDate] = useState("");
  const [visaType, setVisaType] = useState(DEFAULT_VISA_TYPE);
  const [visaStatus, setVisaStatus] = useState(DEFAULT_VISA_STATUS);
  const [visaRemarks, setVisaRemarks] = useState("");
  const [visaSaved, setVisaSaved] = useState(false);
  const [visaRecordSaved, setVisaRecordSaved] = useState(false);
  const [visaUploadFile, setVisaUploadFile] = useState<File | null>(null);
  const [visaCandidateNotFound, setVisaCandidateNotFound] = useState(false);
  const [visaCandidateNameMismatch, setVisaCandidateNameMismatch] =
    useState(false);

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
    setVisaCandidateNotFound(false);
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

    // Candidate
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

    // Medical
    setMedicalDate(today());
    setFitDate("");
    setMedicalStatus("new");
    setSavedMedicalId(null);
    setMedicalSaved(false);

    // MOFA
    setAgencyId("");
    setApplicationNumber("");
    setApplicationDate(today());
    setTrade("");
    setMofaStage("new");
    setMofaSaved(false);
    setMofaUploadFile(null);
    setMofaCrossCheck(null);
    setExistingMofaRecord(null);

    // Visa
    setVisaNo("");
    setVisaDate("");
    setVisaExpiryDate("");
    setVisaType(DEFAULT_VISA_TYPE);
    setVisaStatus(DEFAULT_VISA_STATUS);
    setVisaRemarks("");
    setVisaSaved(false);
    setVisaRecordSaved(false);
    setVisaUploadFile(null);
    setVisaCandidateNotFound(false);
    setVisaCandidateNameMismatch(false);

    // Shared
    setErrorMessage("");
    setSuccessMessage("");
  }

  /* ───────── Document uploads ───────── */

  /**
   * Uploads the selected MOFA document unless the candidate already has an
   * active MOFA document. Returns true only when a new file was uploaded.
   */
  async function uploadMofaFileFor(candidate: Candidate) {
    if (!mofaUploadFile) return false;

    if (!candidate.tenant_id || !candidate.id || candidate.sl == null) {
      throw new Error(
        "Candidate information is incomplete. MOFA document was not uploaded.",
      );
    }

    const activeDocument = await getActiveCandidateFile(candidate.id, "mofa");

    if (activeDocument) {
      setMofaUploadFile(null);
      return false;
    }

    await uploadCandidateMofa({
      tenantId: candidate.tenant_id,
      candidateId: candidate.id,
      candidateSl: candidate.sl,
      candidateName: candidate.name,
      passportNo: candidate.passport_no,
      file: mofaUploadFile,
    });

    setMofaUploadFile(null);
    return true;
  }

  /**
   * Uploads the selected Visa document unless the candidate already has an
   * active Visa document. Returns true only when a new file was uploaded.
   */
  async function uploadVisaFileFor(candidate: Candidate) {
    if (!visaUploadFile) return false;

    if (!candidate.tenant_id || !candidate.id || candidate.sl == null) {
      throw new Error(
        "Candidate information is incomplete. Visa document was not uploaded.",
      );
    }

    const activeDocument = await getActiveCandidateFile(candidate.id, "visa");

    if (activeDocument) {
      setVisaUploadFile(null);
      return false;
    }

    await uploadCandidateVisa({
      tenantId: candidate.tenant_id,
      candidateId: candidate.id,
      candidateSl: candidate.sl,
      candidateName: candidate.name,
      passportNo: candidate.passport_no,
      file: visaUploadFile,
    });

    setVisaUploadFile(null);
    return true;
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
    const applicationNo = values.applicationNumber.trim();

    // 1) Same application number already exists
    if (applicationNo) {
      const existingResult = await getMofaByApplicationNumber(applicationNo);

      if (existingResult.error) throw existingResult.error;

      const existingMofa = existingResult.data;

      if (existingMofa) {
        setExistingMofaRecord(existingMofa);

        // Never attach a document to a different candidate's MOFA.
        if (existingMofa.candidate_id !== info.candidate.id) {
          setMofaSaved(true);
          setErrorMessage(
            `Application Number ${applicationNo} already belongs to another candidate. Existing MOFA record #${existingMofa.sl} is displayed. Verify the candidate before proceeding.`,
          );
          return resolved;
        }

        // Same candidate: keep the record, only add a missing document.
        const hadFile = Boolean(mofaUploadFile);
        const uploaded = await uploadMofaFileFor(info.candidate);

        setMofaSaved(true);

        if (uploaded) {
          setSuccessMessage(
            `Existing MOFA record #${existingMofa.sl} kept unchanged. MOFA document uploaded successfully.`,
          );
        } else if (hadFile) {
          setSuccessMessage(
            `Existing MOFA record #${existingMofa.sl} and its document already exist. No duplicate record or document was created.`,
          );
        } else {
          setSuccessMessage(
            `Existing MOFA record #${existingMofa.sl} found. No duplicate record was created.`,
          );
        }

        return resolved;
      }
    }

    // 2) Candidate already has a MOFA record
    if (info.hasMofa) {
      const uploaded = await uploadMofaFileFor(info.candidate);

      setMofaSaved(true);
      setSuccessMessage(
        uploaded
          ? `${candidateLabel}. Existing MOFA record kept; original MOFA document uploaded.`
          : `${candidateLabel}. A MOFA record already exists, so no new one was added.`,
      );

      return resolved;
    }

    // 3) New MOFA record
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
      application_number: applicationNo || null,
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

  async function findVisaCandidateByPassport(
    rawPassport: string,
    rawName: string,
  ) {
    const passport = normalizePassport(rawPassport);

    setErrorMessage("");
    setSuccessMessage("");

    if (!passport) {
      setVisaCandidateNotFound(false);
      setVisaCandidateNameMismatch(false);
      setErrorMessage(
        "Passport number was not detected. Enter it manually first.",
      );
      return null;
    }

    const info = await lookupPassport(passport);

    if (!info) {
      setSavedCandidate(null);
      setLinkedExisting(false);
      setExistingRecords({ medical: false, mofa: false });
      setSavedMedicalId(null);
      setMedicalSaved(false);
      setMofaSaved(false);

      setPassportNo(passport);
      setName(rawName.trim());
      setVisaCandidateNotFound(true);
      setVisaCandidateNameMismatch(false);

      setSuccessMessage(
        "Candidate not found. Click Add Candidate to register this person before saving the Visa.",
      );

      return null;
    }

    const nameMatches =
      Boolean(rawName.trim()) &&
      normalizeName(rawName) === normalizeName(info.candidate.name);

    if (!nameMatches) {
      // Keep OCR name visible and editable until verification is complete.
      setSavedCandidate(null);
      setPassportNo(passport);
      setName(rawName.trim());
      setVisaCandidateNotFound(false);
      setVisaCandidateNameMismatch(true);

      setErrorMessage(
        `Passport matched ${info.candidate.name}, but the OCR name does not match. Verify the name before continuing.`,
      );

      return info;
    }

    applyCandidate({ info, created: false });

    setVisaCandidateNotFound(false);
    setVisaCandidateNameMismatch(false);
    setErrorMessage("");
    setSuccessMessage(
      `Candidate verified: ${info.candidate.name}. Review the Visa details and save.`,
    );

    return info;
  }

  async function saveVisaFor(rawPassport: string, rawName: string) {
    if (visaCandidateNameMismatch) {
      throw new Error(
        "Candidate name does not match. Verify the Candidate before saving.",
      );
    }

    const passport = normalizePassport(rawPassport);

    if (!passport || !rawName.trim()) {
      throw new Error("Candidate name and passport number are required.");
    }

    // Always verify the candidate against the database.
    const info = await lookupPassport(passport);

    if (!info) {
      setVisaCandidateNotFound(true);
      throw new Error("Candidate not found. Click Add Candidate first.");
    }

    if (normalizeName(rawName) !== normalizeName(info.candidate.name)) {
      setVisaCandidateNameMismatch(true);
      throw new Error("Passport matched, but the candidate name does not match.");
    }

    applyCandidate({ info, created: false });

    // Check existing Visa records before creating anything.
    const existingVisas = await getVisas();
    const normalizedVisaNo = visaNo.trim().toUpperCase();

    // The same Visa number must never be attached to another candidate.
    if (normalizedVisaNo) {
      const visaNumberOwner = existingVisas.find(
        (visa) =>
          visa.visa_no?.trim().toUpperCase() === normalizedVisaNo &&
          visa.candidate_id !== info.candidate.id,
      );

      if (visaNumberOwner) {
        throw new Error(
          `Visa number ${normalizedVisaNo} already belongs to another candidate. No record or document was created.`,
        );
      }
    }

    // An existing Visa for this candidate is treated as existing data;
    // never create a duplicate or update its fields here.
    const existingVisa = existingVisas.find(
      (visa) => visa.candidate_id === info.candidate.id,
    );

    let createdNewRecord = false;

    if (!visaRecordSaved && !existingVisa) {
      const result = await createVisa({
        candidate_id: info.candidate.id,
        mofa_id: null,
        visa_no: visaNo.trim() || null,
        visa_date: visaDate || null,
        expiry_date: visaExpiryDate || null,
        visa_type: visaType || DEFAULT_VISA_TYPE,
        status: visaStatus || DEFAULT_VISA_STATUS,
        agency_id: agencyId || null,
        remarks: visaRemarks.trim() || null,
      });

      if (!result) {
        throw new Error("Visa record was not returned after saving.");
      }

      createdNewRecord = true;
    }

    setVisaRecordSaved(true);

    // Upload only if the candidate has no active Visa document yet.
    const uploaded = await uploadVisaFileFor(info.candidate);

    setVisaSaved(true);
    setVisaCandidateNotFound(false);
    setVisaCandidateNameMismatch(false);

    if (uploaded && !createdNewRecord && existingVisa) {
      setSuccessMessage(
        `Existing Visa record #${existingVisa.sl} kept unchanged. Missing Visa document uploaded.`,
      );
    } else if (uploaded) {
      setSuccessMessage("Visa record saved and original Visa document uploaded.");
    } else if (existingVisa) {
      setSuccessMessage(
        `Existing Visa record #${existingVisa.sl} kept unchanged. No duplicate record or document was created.`,
      );
    } else {
      setSuccessMessage(
        "Visa record saved successfully. No additional document was uploaded.",
      );
    }
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
      const returnToVisaAfterCreate = visaCandidateNotFound;

      const resolved = await resolveCandidate(passportNo, name);
      applyCandidate(resolved);

      setVisaCandidateNotFound(false);
      setVisaCandidateNameMismatch(false);

      setSuccessMessage(
        resolved.created
          ? "Candidate saved successfully."
          : "This passport is already registered — existing candidate linked.",
      );

      setCurrentStep(returnToVisaAfterCreate ? 4 : 2);
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

      // applyCandidate() may have marked MOFA as saved before the upload
      // failed; unlock the form so the user can retry the upload.
      if (mofaUploadFile) {
        setMofaSaved(false);
      }

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

  const statusLabel = visaSaved
    ? "Visa Saved"
    : mofaSaved
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
    existingMofaRecord,
    mofaUploadFile,
    setMofaUploadFile,

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
    visaRecordSaved,
    visaUploadFile,
    setVisaUploadFile,
    visaCandidateNotFound,
    visaCandidateNameMismatch,
    findVisaCandidateByPassport,

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