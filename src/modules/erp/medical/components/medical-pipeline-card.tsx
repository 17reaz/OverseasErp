import {
  ArrowRight,
  Check,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import type {
  Medical,
  MedicalCandidate,
} from "../medical-service";

export interface MedicalPipelineMofa {
  id: string;
  application_date: string | null;
  application_number: string | null;
  stage:
    | "new"
    | "medupdated"
    | "approved"
    | "canceled"
    | "expired"
    | "invalid"
    | string
    | null;
  created_at: string;
}

export interface MedicalPipelineVisa {
  id: string;
  visa_no: string | null;
  visa_date: string | null;
  expiry_date: string | null;
  status: string | null;
  created_at: string;
}

export interface MedicalPipelineItem {
  medical: Medical;
  candidate: MedicalCandidate;
  mofa: MedicalPipelineMofa | null;
  visa: MedicalPipelineVisa | null;
}

interface MedicalPipelineCardProps {
  item: MedicalPipelineItem;
  onOpen?: (candidateId: string) => void;
}

/* -------------------------------------------------------------------------- */
/*                              LOGIC (unchanged)                             */
/* -------------------------------------------------------------------------- */

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addDays(dateValue: string, days: number) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + days);

  return date.toISOString();
}

function getDaysSinceFit(
  fitDate: string | null | undefined,
) {
  if (!fitDate) {
    return null;
  }

  const fit = new Date(fitDate);

  if (Number.isNaN(fit.getTime())) {
    return null;
  }

  const now = new Date();

  const fitDay = new Date(
    fit.getFullYear(),
    fit.getMonth(),
    fit.getDate(),
  );

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const diffMs =
    today.getTime() - fitDay.getTime();

  const days = Math.floor(
    diffMs / (1000 * 60 * 60 * 24),
  );

  if (days < 0) {
    return null;
  }

  return days;
}

function getFitAgeLabel(
  fitDate: string | null | undefined,
) {
  const days = getDaysSinceFit(fitDate);

  if (days === null) {
    return undefined;
  }

  if (days === 0) {
    return "Fit today";
  }

  return `Fit ${days} ${
    days === 1 ? "day" : "days"
  } ago`;
}

function getMedicalValidUntil(
  medical: Medical,
  mofa: MedicalPipelineMofa | null,
  visaIssued: boolean,
) {
  if (visaIssued) {
    return null;
  }

  const baseDate =
    medical.fit_date || medical.medical_date;

  if (!baseDate) {
    return null;
  }

  const mofaStarted = Boolean(
    mofa?.application_date,
  );

  return addDays(
    baseDate,
    mofaStarted ? 60 + 30 : 60,
  );
}

function isVisaIssued(
  visa: MedicalPipelineVisa | null,
) {
  if (!visa) {
    return false;
  }

  const status = visa.status?.toLowerCase();

  return (
    status === "issued" ||
    status === "approved"
  );
}

function getMofaLabel(
  mofa: MedicalPipelineMofa | null,
) {
  if (!mofa) {
    return "Pending";
  }

  switch (mofa.stage) {
    case "approved":
      return "Approved";

    case "new":
      return "New";

    case "medupdated":
      return "Updated";

    case "canceled":
      return "Canceled";

    case "expired":
      return "Expired";

    case "invalid":
      return "Invalid";

    default:
      return mofa.stage || "Pending";
  }
}

function getMofaVariant(
  mofa: MedicalPipelineMofa | null,
) {
  if (!mofa) {
    return "outline" as const;
  }

  if (mofa.stage === "approved") {
    return "default" as const;
  }

  if (
    mofa.stage === "canceled" ||
    mofa.stage === "expired" ||
    mofa.stage === "invalid"
  ) {
    return "destructive" as const;
  }

  return "secondary" as const;
}

/* -------------------------------------------------------------------------- */
/*                                 UI PARTS                                   */
/* -------------------------------------------------------------------------- */

function StageRow({
  title,
  completed,
  status,
  variant,
  date,
  secondary,
}: {
  title: string;
  completed: boolean;
  status: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline";
  date?: string;
  secondary?: string;
}) {
  const meta = [date, secondary].filter(Boolean).join("  ·  ");

  return (
    <div className="flex items-start gap-3">
      <span
        className={
          completed
            ? "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : "mt-0.5 size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/40"
        }
      >
        {completed && (
          <Check className="size-2.5" strokeWidth={3} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              completed
                ? "text-sm font-medium"
                : "text-sm text-muted-foreground"
            }
          >
            {title}
          </span>

          <Badge
            variant={
              variant ??
              (completed ? "default" : "outline")
            }
            className="shrink-0 text-[11px] font-normal"
          >
            {status}
          </Badge>
        </div>

        {meta && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {meta}
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   CARD                                     */
/* -------------------------------------------------------------------------- */

export function MedicalPipelineCard({
  item,
  onOpen,
}: MedicalPipelineCardProps) {
  const {
    medical,
    candidate,
    mofa,
    visa,
  } = item;

  const visaIssued = isVisaIssued(visa);

  const medicalValidUntil =
    getMedicalValidUntil(
      medical,
      mofa,
      visaIssued,
    );

  const medicalCompleted =
    medical.status === "fit";

  const mofaCompleted =
    mofa?.stage === "approved";

  const fitAgeLabel =
    medicalCompleted
      ? getFitAgeLabel(medical.fit_date)
      : undefined;

  const candidateStatus =
    medicalCompleted
      ? "Processing"
      : medical.status === "unfit"
        ? "Unfit"
        : medical.status === "expired"
          ? "Expired"
          : "New";

  const agentName =
    candidate.agent?.name ||
    candidate.agent?.code ||
    "No agent";

  return (
    <Card className="h-full min-w-0 gap-0 py-0 shadow-none">
      {/* HEADER */}
      <CardHeader className="gap-0 space-y-0 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-sm font-semibold leading-5"
              title={candidate.name}
            >
              {candidate.name}
            </h3>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              #{candidate.sl ?? "—"}
              {candidate.passport_no
                ? ` · ${candidate.passport_no}`
                : ""}
              {candidate.country
                ? ` · ${candidate.country}`
                : ""}
            </p>
          </div>

          {medicalCompleted && fitAgeLabel ? (
            <span className="shrink-0 text-xs font-medium">
              {fitAgeLabel}
            </span>
          ) : (
            <Badge
              variant={
                candidateStatus === "Unfit" ||
                candidateStatus === "Expired"
                  ? "destructive"
                  : "secondary"
              }
              className="shrink-0 text-[11px] font-normal"
            >
              {candidateStatus}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* PIPELINE */}
      <CardContent className="flex-1 space-y-4 px-4 pb-4">
        <StageRow
          title="Medical"
          completed={medicalCompleted}
          status={
            medical.status === "fit"
              ? "Fit"
              : medical.status
          }
          date={formatDate(
            medical.fit_date ||
              medical.medical_date,
          )}
          secondary={
            medicalValidUntil
              ? `Valid until ${formatDate(
                  medicalValidUntil,
                )}`
              : undefined
          }
        />

        <StageRow
          title="MOFA"
          completed={mofaCompleted}
          status={getMofaLabel(mofa)}
          variant={getMofaVariant(mofa)}
          date={
            mofa
              ? formatDate(mofa.application_date)
              : undefined
          }
        />

        <StageRow
          title="Visa"
          completed={visaIssued}
          status={
            visaIssued ? "Issued" : "Pending"
          }
          date={
            visaIssued && visa?.visa_date
              ? formatDate(visa.visa_date)
              : undefined
          }
        />
      </CardContent>

      {/* FOOTER */}
      <CardFooter className="justify-between gap-3 border-t px-4 py-2.5">
        <p
          className="min-w-0 truncate text-xs text-muted-foreground"
          title={agentName}
        >
          Agent:{" "}
          <span className="font-medium text-foreground">
            {agentName}
          </span>
        </p>

        {onOpen && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-mr-2 h-7 shrink-0 px-2 text-xs"
            onClick={() => onOpen(candidate.id)}
          >
            Open
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
