import { FileCheck } from "lucide-react";

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

import type { MofaStage } from "../../../mofa/mofa-service";
import type { Registration } from "../hooks/useCandidateRegistration";
import type { RegistrationLookups } from "../hooks/useRegistrationLookups";
import type { DocType, ScanState } from "../types";
import { DocumentDropzone } from "./DocumentDropzone";
import { SelectedCandidateCard } from "./SelectedCandidateCard";

export function MofaStep({
  reg,
  lookups,
  scans,
  onScan,
  onReset,
}: {
  reg: Registration;
  lookups: RegistrationLookups;
  scans: Record<DocType, ScanState>;
  onScan: (docType: DocType, file: File) => void;
  onReset: () => void;
}) {
  const {
    saving,
    mofaSaved,
    applicationNumber,
    setApplicationNumber,
    applicationDate,
    setApplicationDate,
    trade,
    setTrade,
    agencyId,
    setAgencyId,
    mofaStage,
    setMofaStage,
    existingMofaRecord,
    existingRecords,
    handleMofaSubmit,
  } = reg;
  const { agencies } = lookups;

  return (
    <>
      <DocumentDropzone
        title="MOFA document"
        hint="MOFA application copy"
        icon={FileCheck}
        scan={scans.mofa}
        disabled={saving || mofaSaved}
        onFile={(file) => void onScan("mofa", file)}
      />

      <Separator />

      <form
        id="mofa-registration-form"
        onSubmit={handleMofaSubmit}
        className="space-y-6"
      >
        <SelectedCandidateCard reg={reg} onReset={onReset} />
        
{existingMofaRecord && (
  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-semibold">Existing MOFA Record</h3>
      <span className="text-xs rounded-full border px-2 py-1">
        Already Registered
      </span>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">
          Application Number
        </p>
        <p className="font-medium">
          {existingMofaRecord.application_number || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          Application Date
        </p>
        <p className="font-medium">
          {existingMofaRecord.application_date || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Candidate</p>
        <p className="font-medium">
          {existingMofaRecord.candidate?.name || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Passport Number</p>
        <p className="font-medium">
          {existingMofaRecord.candidate?.passport_no || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Trade</p>
        <p className="font-medium">
          {existingMofaRecord.trade || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Stage</p>
        <p className="font-medium">
          {existingMofaRecord.stage}
        </p>
      </div>
    </div>
  </div>
)}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mofa-number">Application Number</Label>
            <Input
              id="mofa-number"
              placeholder="Enter application number"
              value={applicationNumber}
              onChange={(event) => setApplicationNumber(event.target.value)}
              disabled={saving || mofaSaved}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mofa-date">Application Date *</Label>
            <Input
              id="mofa-date"
              type="date"
              value={applicationDate}
              onChange={(event) => setApplicationDate(event.target.value)}
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
              onValueChange={(value) => setMofaStage(value as MofaStage)}
              disabled={saving || mofaSaved}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="medupdated">Medical Updated</SelectItem>
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
  );
}
