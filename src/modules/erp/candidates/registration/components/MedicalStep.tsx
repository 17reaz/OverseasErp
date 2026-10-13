import { Stethoscope } from "lucide-react";

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

import type { MedicalStatus } from "../../../medical/medical-service";
import type { Registration } from "../hooks/useCandidateRegistration";
import type { DocType, ScanState } from "../types";
import { DocumentDropzone } from "./DocumentDropzone";
import { SelectedCandidateCard } from "./SelectedCandidateCard";

export function MedicalStep({
  reg,
  scans,
  onScan,
  onReset,
}: {
  reg: Registration;
  scans: Record<DocType, ScanState>;
  onScan: (docType: DocType, file: File) => void;
  onReset: () => void;
}) {
  const {
    saving,
    medicalSaved,
    medicalDate,
    setMedicalDate,
    medicalStatus,
    setMedicalStatus,
    fitDate,
    setFitDate,
    existingRecords,
    savedMedicalId,
    handleMedicalSubmit,
  } = reg;

  return (
    <>
      <DocumentDropzone
        title="Medical document"
        hint="Wafid medical PDF"
        icon={Stethoscope}
        scan={scans.medical}
        disabled={saving || medicalSaved}
        onFile={(file) => void onScan("medical", file)}
      />

      <Separator />

      <form
        id="medical-registration-form"
        onSubmit={handleMedicalSubmit}
        className="space-y-6"
      >
        <SelectedCandidateCard reg={reg} onReset={onReset} />

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
              onValueChange={(value) => setMedicalStatus(value as MedicalStatus)}
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
                <SelectItem value="under_review">Under Review</SelectItem>
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
  );
}
