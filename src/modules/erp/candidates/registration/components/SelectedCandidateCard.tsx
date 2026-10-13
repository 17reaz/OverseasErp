import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Registration } from "../hooks/useCandidateRegistration";

/** Shows the active candidate, or name/passport inputs when none is selected yet. */
export function SelectedCandidateCard({
  reg,
  onReset,
}: {
  reg: Registration;
  onReset: () => void;
}) {
  const {
    savedCandidate,
    currentStep,
    savedMedicalId,
    saving,
    name,
    setName,
    passportNo,
    setPassportNo,
  } = reg;

  if (savedCandidate) {
    return (
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
            onClick={onReset}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            New registration
          </Button>
        </div>
      </div>
    );
  }

  return (
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
}
