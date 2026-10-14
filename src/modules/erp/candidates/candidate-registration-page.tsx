import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { CandidateStep } from "./registration/components/CandidateStep";
import { MedicalStep } from "./registration/components/MedicalStep";
import { MofaStep } from "./registration/components/MofaStep";
import { RegistrationFooter } from "./registration/components/RegistrationFooter";
import { VisaStep } from "./registration/components/VisaStep";
import { steps } from "./registration/constants";
import { useCandidateRegistration } from "./registration/hooks/useCandidateRegistration";
import { useRegistrationLookups } from "./registration/hooks/useRegistrationLookups";
import { useRegistrationOcr } from "./registration/hooks/useRegistrationOcr";

type MofaCrossCheckResult = NonNullable<
  ReturnType<typeof useCandidateRegistration>["mofaCrossCheck"]
>;

function MofaCrossCheckAlert({ result }: { result: MofaCrossCheckResult }) {
  const allMatch = result.passportNoMatches && result.nameMatches;

  return (
    <Alert variant={allMatch ? "default" : "destructive"}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>MOFA / Passport Cross-check</AlertTitle>
      <AlertDescription>
        <p>
          Passport Number:{" "}
          {result.passportNoMatches ? "Matched" : "Does not match"}
        </p>
        <p>Name: {result.nameMatches ? "Matched" : "Does not match"}</p>
        <p className="mt-1">Verify the details against both documents.</p>
      </AlertDescription>
    </Alert>
  );
}

export function CandidateRegistrationPage() {
  const reg = useCandidateRegistration();
  const lookups = useRegistrationLookups();
  const { scans, anyScanning, handleScan, resetScans } =
    useRegistrationOcr(reg);

  const {
    currentStep,
    goToStep,
    statusLabel,
    savedCandidate,
    medicalSaved,
    mofaSaved,
    visaSaved,
    errorMessage,
    successMessage,
    mofaCrossCheck,
  } = reg;

  // Step id -> has this step been completed?
  const stepCompleted: Record<number, boolean> = {
    1: !!savedCandidate,
    2: medicalSaved,
    3: mofaSaved,
    4: visaSaved,
  };

  // Props shared by every step component
  const stepProps = {
    reg,
    scans,
    onScan: handleScan,
    onReset: handleReset,
  };

  function handleReset() {
    reg.resetRegistration();
    resetScans();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {/* ───────── Fixed header + stepper ───────── */}
      <div className="sticky top-0 z-20 border-b bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/app/candidates" aria-label="Back to candidates">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  Candidate Registration
                </h1>
              </div>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Register a candidate and start the processing workflow.
              </p>
            </div>
          </div>

          <Badge
            variant={mofaSaved ? "default" : "secondary"}
            className="shrink-0"
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const active = currentStep === step.id;
            const completed = stepCompleted[step.id] ?? false;

            return (
              <button
                key={step.id}
                type="button"
                title={step.description}
                onClick={() => goToStep(step.id)}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : completed
                      ? "border-primary/30 bg-muted/40"
                      : "border-border hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    active
                      ? "bg-primary text-primary-foreground"
                      : completed
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Scrollable content ───────── */}
      <div className="flex-1 py-6">
        <Card>
          <Separator />

          <CardContent className="space-y-6 pt-6">
            {currentStep === 1 && (
              <CandidateStep {...stepProps} lookups={lookups} />
            )}
            {currentStep === 2 && <MedicalStep {...stepProps} />}
            {currentStep === 3 && (
              <MofaStep {...stepProps} lookups={lookups} />
            )}
            {currentStep === 4 && (
              <VisaStep {...stepProps} lookups={lookups} />
            )}

            {/* ───── Messages ───── */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {mofaCrossCheck && <MofaCrossCheckAlert result={mofaCrossCheck} />}
          </CardContent>
        </Card>
      </div>

      {/* ───────── Fixed footer actions ───────── */}
      <RegistrationFooter reg={reg} anyScanning={anyScanning} />
    </div>
  );
}
