import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  FileCheck,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const steps = [
  {
    id: 1,
    title: "Candidate",
    description: "Basic information",
    icon: UserRound,
  },
  {
    id: 2,
    title: "Medical",
    description: "Medical registration",
    icon: Stethoscope,
  },
  {
    id: 3,
    title: "MOFA",
    description: "MOFA registration",
    icon: FileCheck,
  },
] as const;

export function CandidateRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link to="/app/candidates" aria-label="Back to candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Candidate Registration
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Register a candidate and start the processing workflow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground">
            Draft
          </span>
        </div>
      </div>

      {/* Stepper */}
  <CardContent className="p-2 sm:p-3">
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step) => {
        const Icon = step.icon;
        const active = currentStep === step.id;
        const completed = currentStep > step.id;

        return (
          <button
            key={step.id}
            type="button"
            title={step.description}
            onClick={() => setCurrentStep(step.id)}
            className={`flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
              active
                ? "border-primary bg-primary/5"
                : completed
                  ? "border-primary/30 bg-muted/40"
                  : "border-border hover:bg-muted/50"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                active
                  ? "bg-primary text-primary-foreground"
                  : completed
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {completed ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </span>

            <span className="min-w-0 truncate text-sm font-medium">{step.title}</span>
          </button>
        );
      })}
    </div>
  </CardContent>
     
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {steps[currentStep - 1].title} Information
          </CardTitle>
          <CardDescription>
            {currentStep === 1 &&
              "Enter the candidate's personal and passport information."}
            {currentStep === 2 &&
              "Medical form placeholder. Existing MedicalForm will be connected later."}
            {currentStep === 3 &&
              "MOFA form placeholder. Existing MofaForm will be connected later."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="candidate-name">Candidate Name *</Label>
                  <Input
                    id="candidate-name"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passport">Passport Number *</Label>
                  <Input
                    id="passport"
                    placeholder="Enter passport number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="received-date">Received Date</Label>
                  <Input id="received-date" type="date" />
                </div>

                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saudi-arabia">
                        Saudi Arabia
                      </SelectItem>
                      <SelectItem value="qatar">Qatar</SelectItem>
                      <SelectItem value="uae">United Arab Emirates</SelectItem>
                      <SelectItem value="kuwait">Kuwait</SelectItem>
                      <SelectItem value="oman">Oman</SelectItem>
                      <SelectItem value="bahrain">Bahrain</SelectItem>
                      <SelectItem value="japan">Japan</SelectItem>
                      <SelectItem value="malaysia">Malaysia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agent</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent-1">
                        Sample Agent 01
                      </SelectItem>
                      <SelectItem value="agent-2">
                        Sample Agent 02
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration-notes">Notes</Label>
                  <Textarea
                    id="registration-notes"
                    placeholder="Additional information (optional)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">Registration workflow</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save the candidate first. You can then add Medical and MOFA
                  records for the same candidate.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-14 text-center">
              <Stethoscope className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-medium">Medical Registration</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Existing MedicalForm will be embedded here after the candidate
                is saved and selected.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Candidate ID: not connected
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-14 text-center">
              <FileCheck className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-medium">MOFA Registration</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Existing MofaForm will be embedded here after candidate
                registration.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Candidate ID and Medical ID: not connected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" asChild>
            <Link to="/app/candidates">Cancel</Link>
          </Button>

          {currentStep < 3 ? (
            <Button onClick={() => setCurrentStep((step) => Math.min(3, step + 1))}>
              Next Step
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => alert("Dummy UI only — save logic not connected.")}>
              <Save className="mr-2 h-4 w-4" />
              Finish Registration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
