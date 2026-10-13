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
import { Textarea } from "@/components/ui/textarea";

import type { Registration } from "../hooks/useCandidateRegistration";
import type { RegistrationLookups } from "../hooks/useRegistrationLookups";
import type { DocType, ScanState } from "../types";
import { DocumentDropzone } from "./DocumentDropzone";
import { SelectedCandidateCard } from "./SelectedCandidateCard";

export function VisaStep({
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
    visaSaved,
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
    agencyId,
    setAgencyId,
    handleVisaSubmit,
  } = reg;
  const { agencies } = lookups;

  return (
    <>
      <DocumentDropzone
        title="Saudi Visa document"
        hint="Saudi Visa PDF"
        icon={FileCheck}
        scan={scans.visa}
        disabled={saving || visaSaved}
        onFile={(file) => void onScan("visa", file)}
      />

      <Separator />

      <form
        id="visa-registration-form"
        onSubmit={handleVisaSubmit}
        className="space-y-6"
      >
        <SelectedCandidateCard reg={reg} onReset={onReset} />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="visa-number">Visa Number</Label>
            <Input
              id="visa-number"
              value={visaNo}
              onChange={(event) => setVisaNo(event.target.value)}
              placeholder="Enter visa number"
              disabled={saving || visaSaved}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visa-date">Visa Date</Label>
            <Input
              id="visa-date"
              type="date"
              value={visaDate}
              onChange={(event) => setVisaDate(event.target.value)}
              disabled={saving || visaSaved}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visa-expiry">Expiry Date</Label>
            <Input
              id="visa-expiry"
              type="date"
              value={visaExpiryDate}
              onChange={(event) => setVisaExpiryDate(event.target.value)}
              disabled={saving || visaSaved}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visa-type">Visa Type</Label>
            <Input
              id="visa-type"
              value={visaType}
              onChange={(event) => setVisaType(event.target.value)}
              placeholder="e.g. Work"
              disabled={saving || visaSaved}
            />
          </div>

          <div className="space-y-2">
            <Label>Visa Status</Label>
            <Select
              value={visaStatus}
              onValueChange={setVisaStatus}
              disabled={saving || visaSaved}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Visa status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agency</Label>
            <Select
              value={agencyId || "__none"}
              onValueChange={(value) =>
                setAgencyId(value === "__none" ? "" : value)
              }
              disabled={saving || visaSaved}
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="visa-remarks">Remarks</Label>
            <Textarea
              id="visa-remarks"
              rows={3}
              value={visaRemarks}
              onChange={(event) => setVisaRemarks(event.target.value)}
              placeholder="Occupation, employer, reference or other details"
              disabled={saving || visaSaved}
            />
          </div>
        </div>

        {visaSaved && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
            <p className="font-medium">Visa saved successfully</p>
            <p className="mt-1 text-muted-foreground">
              Visa Number: {visaNo || "Not assigned"}
            </p>
          </div>
        )}
      </form>
    </>
  );
}
