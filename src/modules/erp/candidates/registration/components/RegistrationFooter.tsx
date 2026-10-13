import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { steps } from "../constants";
import type { Registration } from "../hooks/useCandidateRegistration";

function SaveIcon({ saving }: { saving: boolean }) {
  return saving ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <Save className="mr-2 h-4 w-4" />
  );
}

export function RegistrationFooter({
  reg,
  anyScanning,
}: {
  reg: Registration;
  anyScanning: boolean;
}) {
  const {
    currentStep,
    goToStep,
    saving,
    savedCandidate,
    duplicate,
    medicalSaved,
    mofaSaved,
    visaSaved,
  } = reg;

  return (
    <div className="sticky bottom-0 z-20 border-t bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => goToStep(Math.max(1, currentStep - 1))}
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
              <SaveIcon saving={saving} />
              {saving ? "Saving Candidate..." : "Save & Continue"}
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type="submit"
              form="medical-registration-form"
              disabled={saving || anyScanning || medicalSaved}
            >
              <SaveIcon saving={saving} />
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
              disabled={saving || anyScanning || mofaSaved}
            >
              <SaveIcon saving={saving} />
              {saving
                ? "Saving MOFA..."
                : mofaSaved
                  ? "Registration Complete"
                  : "Save MOFA"}
            </Button>
          )}

          {currentStep === 4 && (
            <Button
              type="submit"
              form="visa-registration-form"
              disabled={saving || anyScanning || visaSaved}
            >
              <SaveIcon saving={saving} />
              {saving
                ? "Saving Visa..."
                : visaSaved
                  ? "Visa Saved"
                  : "Save Visa"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
