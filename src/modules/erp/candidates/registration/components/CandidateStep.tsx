import {
  AlertCircle,
  FileCheck,
  Loader2,
  RotateCcw,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

import { countries } from "../constants";
import type { Registration } from "../hooks/useCandidateRegistration";
import type { RegistrationLookups } from "../hooks/useRegistrationLookups";
import type { DocType, ScanState } from "../types";
import { DocumentDropzone } from "./DocumentDropzone";

export function CandidateStep({
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
    agentId,
    setAgentId,
    savedCandidate,
    passportInputRef,
    duplicate,
    checkingDuplicate,
    nameMismatch,
    linkedExisting,
    saving,
    linkExistingCandidate,
    handleCandidateSubmit,
  } = reg;
  const { agents, agentsLoading, agentLoadError } = lookups;

  return (
    <>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Scan documents (optional)</p>
          <p className="text-xs text-muted-foreground">
            Each document is matched by passport number. Existing candidates
            are reused; new ones are created automatically. Verify the
            extracted data afterwards.
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
            onFile={(file) => void onScan("passport", file)}
          />
          <DocumentDropzone
            compact
            title="Medical"
            hint="Wafid medical PDF"
            icon={Stethoscope}
            scan={scans.medical}
            disabled={saving}
            onFile={(file) => void onScan("medical", file)}
          />
          <DocumentDropzone
            compact
            title="MOFA"
            hint="MOFA application"
            icon={FileCheck}
            scan={scans.mofa}
            disabled={saving}
            onFile={(file) => void onScan("mofa", file)}
          />
          <DocumentDropzone
            compact
            title="Saudi Visa"
            hint="Saudi Visa PDF"
            icon={FileCheck}
            scan={scans.visa}
            disabled={saving}
            onFile={(file) => void onScan("visa", file)}
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
              <AlertTitle>This passport number is already registered</AlertTitle>
              <AlertDescription className="space-y-3">
                <div className="space-y-1.5 text-foreground">
                  <p className="text-sm font-medium">
                    {duplicate.candidate.name} ·{" "}
                    {duplicate.candidate.passport_no} · SL{" "}
                    {duplicate.candidate.sl ?? "—"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={duplicate.medicalId ? "secondary" : "outline"}
                    >
                      Medical {duplicate.medicalId ? "✓" : "—"}
                    </Badge>
                    <Badge
                      variant={duplicate.hasMofa ? "secondary" : "outline"}
                    >
                      MOFA {duplicate.hasMofa ? "✓" : "—"}
                    </Badge>
                  </div>
                  {nameMismatch && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      The name on this form differs from the registered name.
                      Check that the passport number is correct.
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
              <p className="text-xs text-muted-foreground">Select a country.</p>
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {linkedExisting
                    ? "Existing candidate linked"
                    : "Candidate saved"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {savedCandidate.name} · Passport: {savedCandidate.passport_no}
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
                onClick={onReset}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                New registration
              </Button>
            </div>
          </div>
        )}
      </form>
    </>
  );
}
