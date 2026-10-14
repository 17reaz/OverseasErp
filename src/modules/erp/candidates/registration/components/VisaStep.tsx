import { AlertTriangle, FileCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  files,
  onScan,
  onReset,
}: {
  reg: Registration;
  lookups: RegistrationLookups;
  files: Record<DocType, File | null>;
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
    visaCandidateNotFound,
    visaCandidateNameMismatch,
    findVisaCandidateByPassport,
    goToStep,
    name,
    passportNo,
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
  file={files.visa}
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

        {/* Candidate matching */}
        {visaCandidateNotFound && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium">Candidate not found</p>

                <p className="text-sm text-muted-foreground">
                  Passport number {passportNo || "not available"} দিয়ে
                  existing candidate পাওয়া যায়নি। Visa save করার আগে
                  Candidate register করতে হবে।
                </p>

                <Button
                  type="button"
                  onClick={() => goToStep(1)}
                  disabled={saving || visaSaved}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </div>
            </div>
          </div>
        )}

        {visaCandidateNameMismatch && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium">Candidate name mismatch</p>

                <p className="text-sm text-muted-foreground">
                  Passport number পাওয়া গেলেও OCR name existing candidate-এর
                  name-এর সঙ্গে মেলেনি। নাম ও passport যাচাই না হওয়া পর্যন্ত
                  Visa save করা যাবে না।
                </p>

                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || visaSaved || !passportNo.trim()}
                  onClick={() => {
                    void findVisaCandidateByPassport(passportNo, name);
                  }}
                >
                  Verify Candidate Again
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Visa Number */}
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

          {/* Issue Date */}
          <div className="space-y-2">
            <Label htmlFor="visa-date">Visa Issue Date</Label>
            <Input
              id="visa-date"
              type="date"
              value={visaDate}
              onChange={(event) => setVisaDate(event.target.value)}
              disabled={saving || visaSaved}
            />
          </div>

          {/* Expiry Date */}
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

          {/* System Visa Type: never populate from raw OCR text */}
          <div className="space-y-2">
            <Label>Visa Type</Label>

            <Select
              value={visaType}
              onValueChange={setVisaType}
              disabled={saving || visaSaved}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Visa Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="amel_id">Amel ID</SelectItem>
                <SelectItem value="one_year">1 Year</SelectItem>
                <SelectItem value="mahara">Mahara</SelectItem>
                <SelectItem value="ewan">Ewan</SelectItem>
                <SelectItem value="initial">Initial</SelectItem>
                <SelectItem value="sasko">Sasko</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visa Status */}
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

          {/* System Agency */}
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

          {/* Manual Remarks */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="visa-remarks">Remarks</Label>

            <Textarea
              id="visa-remarks"
              rows={3}
              value={visaRemarks}
              onChange={(event) => setVisaRemarks(event.target.value)}
              placeholder="Add remarks if needed"
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
