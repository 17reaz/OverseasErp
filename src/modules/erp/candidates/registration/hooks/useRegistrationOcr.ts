import { useState } from "react";

import { extractKsaVisa } from "../../../ocr/new/services/kisa-visa";
import {
  crossCheckWithPassport,
  readMofa,
} from "../../../ocr/new/services/mofa-reader";
import { readPassportDocument } from "../../../ocr/new/services/passport-ocr-provider";
import { extractWafidMedical } from "../../../ocr/new/services/wafid-reder";
import { idleScan, NOT_DETECTED } from "../constants";
import type { DocType, OcrField, ScanBase, ScanState } from "../types";
import {
  errorText,
  field,
  lookupPassport,
  normalizePassport,
  toInputDate,
  toMedicalStatus,
  validateScanFile,
} from "../utils/registration-utils";
import type { Registration } from "./useCandidateRegistration";

const initialScans: Record<DocType, ScanState> = {
  passport: idleScan,
  medical: idleScan,
  mofa: idleScan,
  visa: idleScan,
};

export function useRegistrationOcr(reg: Registration) {
  const [scans, setScans] = useState<Record<DocType, ScanState>>(initialScans);

  const anyScanning = Object.values(scans).some(
    (scan) => scan.status === "scanning",
  );

  function resetScans() {
    setScans(initialScans);
  }

  function setScan(docType: DocType, scan: ScanState) {
    setScans((prev) => ({ ...prev, [docType]: scan }));
  }

  async function handleScan(docType: DocType, file: File) {
    const validationError = validateScanFile(docType, file);
    if (validationError) {
      reg.setErrorMessage(validationError);
      return;
    }

    reg.setErrorMessage("");
    reg.setSuccessMessage("");
    if (docType === "mofa") reg.setMofaCrossCheck(null);

    const base: ScanBase = { fileName: file.name, fileSize: file.size };

    setScan(docType, { status: "scanning", progress: 5, ...base });
    reg.setSaving(true);

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

      reg.setErrorMessage(errorText(error, "Something went wrong. Try again."));
    } finally {
      reg.setSaving(false);
    }
  }

  async function scanPassport(file: File, base: ScanBase) {
    const result = await readPassportDocument(file, (progress) => {
      setScans((prev) => ({
        ...prev,
        passport: {
          ...prev.passport,
          status: "scanning",
          progress,
        },
      }));
    });

    reg.setName(result.name);
    reg.setPassportNo(result.passportNo);

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
      reg.setSuccessMessage(
        "Passport read, but no passport number was detected. Enter it manually.",
      );
      return;
    }

    const resolved = await reg.resolveCandidate(result.passportNo, result.name);
    reg.applyCandidate(resolved);

    reg.setSuccessMessage(
      resolved.created
        ? "Passport read. New candidate created. Verify the details."
        : "Passport read. This passport is already registered — existing candidate linked.",
    );
  }

  async function scanMedical(file: File, base: ScanBase) {
    setScan("medical", {
      status: "scanning",
      progress: 25,
      ...base,
    });

    const result = await extractWafidMedical(file);

    const extractedDate = toInputDate(result.medicalExamDate);
    const extractedStatus = toMedicalStatus(result.status);
    const fullName = [result.firstName, result.lastName]
      .filter(Boolean)
      .join(" ");

    // Show extracted fields so the user can review them.
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
      reg.setSuccessMessage(
        "Medical read, but no passport number was detected. Enter the passport number and save manually.",
      );
      return;
    }

    // Populate the form only. Do not save to the database during OCR.
    if (!reg.savedCandidate) {
      if (fullName) {
        reg.setName(fullName);
      }

      reg.setPassportNo(normalizePassport(result.passportNo));
    }

    // Do not modify Medical Date from OCR.
    // For FIT, the Wafid examination date becomes the Fit Date.
    // For UNFIT or other statuses, clear Fit Date.
    reg.setMedicalStatus(extractedStatus);
    reg.setFitDate(extractedStatus === "fit" ? extractedDate : "");

    reg.setSuccessMessage(
      "Wafid Medical OCR completed. Review the information and save when ready.",
    );
  }

  async function scanMofa(file: File, base: ScanBase) {
    const result = await readMofa(file);

    // Fill the form only. Do not save MOFA during OCR.
    reg.setApplicationNumber(result.applicationNumber || "");
    reg.setApplicationDate(result.applicationDate || "");
    reg.setTrade(result.trade || "");

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
      reg.setSuccessMessage(
        "MOFA OCR complete. Passport number was not detected. Enter it manually and review the form.",
      );
      return;
    }

    const reviewSuffix = result.reviewFields.length
      ? " Please verify the OCR fields marked for review."
      : "";

    // Look up the candidate without creating a MOFA record.
    const resolved = await lookupPassport(result.passportNo);

    if (resolved) {
      reg.applyCandidate({ info: resolved, created: false });

      if (result.name) {
        reg.setMofaCrossCheck(
          crossCheckWithPassport(result, {
            passportNo: resolved.candidate.passport_no,
            name: resolved.candidate.name,
          }),
        );
      }

      reg.setSuccessMessage(
        `MOFA OCR complete. Existing candidate found. Review the extracted fields and click Save MOFA.${reviewSuffix}`,
      );
    } else {
      reg.setName(result.name || "");
      reg.setPassportNo(normalizePassport(result.passportNo));
      reg.setMofaCrossCheck(null);

      reg.setSuccessMessage(
        `MOFA OCR complete. Candidate not found. Review the details before saving.${reviewSuffix}`,
      );
    }
  }

  async function scanVisa(file: File, base: ScanBase) {
    const result = await extractKsaVisa(file);

    // Fill Visa registration form from the extracted PDF.
    reg.setVisaNo(result.visaNo || "");
    reg.setVisaDate(toInputDate(result.validFrom));
    reg.setVisaExpiryDate(toInputDate(result.validUntil));
    reg.setVisaType(result.visaType || "");

    reg.setVisaRemarks(
      [
        result.occupation ? `Occupation: ${result.occupation}` : "",
        result.employerName ? `Employer: ${result.employerName}` : "",
        result.nationality ? `Nationality: ${result.nationality}` : "",
        result.refNo ? `Reference No: ${result.refNo}` : "",
        result.applicationNo ? `Application No: ${result.applicationNo}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    // Show all extracted fields for verification.
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

    // Keep OCR results visible even if candidate matching needs attention.
    setScan("visa", {
      status: "done",
      progress: 100,
      ...base,
      fields,
    });

    // Set the generic message first so any message from the candidate
    // lookup below is not overwritten.
    reg.setSuccessMessage(
      detectedCount > 0
        ? result.passportNo
          ? `Visa PDF read successfully. ${detectedCount} field(s) detected. Verify the details and save the Visa.`
          : `Visa PDF read successfully. ${detectedCount} field(s) detected. Passport number was not detected; select or enter the correct candidate before saving.`
        : "Visa PDF opened, but no fields were detected. Check the PDF.",
    );

    // Match only by passport number, then verify the candidate name.
    // Never create a candidate automatically from Visa OCR.
    if (result.passportNo) {
      await reg.findVisaCandidateByPassport(result.passportNo, result.name);
    } else {
      reg.setPassportNo("");
      reg.setName(result.name || "");
    }
  }

  return { scans, anyScanning, handleScan, resetScans };
}