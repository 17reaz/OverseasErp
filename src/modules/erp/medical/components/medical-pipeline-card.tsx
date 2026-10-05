import {
  ArrowRight,
  Check,
  Circle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

function StageConnector() {
  return (
    <div className="ml-[9px] h-3 border-l border-border" />
  );
}

function StageIcon({
  completed,
}: {
  completed: boolean;
}) {
  if (completed) {
    return (
      <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
        <Check
          className="size-3"
          strokeWidth={2.5}
        />
      </span>
    );
  }

  return (
    <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground ring-4 ring-background">
      <Circle className="size-2 fill-current" />
    </span>
  );
}

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
  return (
    <div className="flex items-start gap-3">
      <StageIcon completed={completed} />

      <div className="min-w-0 flex-1 pb-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">
            {title}
          </span>

          <Badge
            variant={
              variant ??
              (completed ? "default" : "outline")
            }
            className="h-5 shrink-0 px-1.5 text-[10px] font-medium"
          >
            {status}
          </Badge>
        </div>

        {(date || secondary) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            {date && <span>{date}</span>}

            {secondary && (
              <>
                {date && (
                  <span className="text-muted-foreground/40">
                    ·
                  </span>
                )}

                <span>{secondary}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const candidateStatus =
    medicalCompleted
      ? "Processing"
      : medical.status === "unfit"
        ? "Unfit"
        : medical.status === "expired"
          ? "Expired"
          : "New";

  return (
    <Card className="h-full min-w-0 gap-0 overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md">
      {/* HEADER */}
      <CardHeader className="gap-3 border-b px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                #{candidate.sl ?? "—"}
              </span>

              <span className="size-1 rounded-full bg-muted-foreground/40" />

              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Medical
              </span>
            </div>

            <h3
              className="truncate text-sm font-semibold leading-5 tracking-tight"
              title={candidate.name}
            >
              {candidate.name}
            </h3>

            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {candidate.passport_no}
              {candidate.country
                ? ` · ${candidate.country}`
                : ""}
            </p>
          </div>

          <Badge
            variant={
              candidateStatus === "Unfit" ||
              candidateStatus === "Expired"
                ? "destructive"
                : "secondary"
            }
            className="h-5 shrink-0 px-1.5 text-[10px]"
          >
            {candidateStatus}
          </Badge>
        </div>
      </CardHeader>

      {/* PIPELINE */}
      <CardContent className="px-4 py-4">
        <div className="relative">
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
                ? `Valid ${formatDate(
                    medicalValidUntil,
                  )}`
                : undefined
            }
          />

          <StageConnector />

          <StageRow
            title="MOFA"
            completed={mofaCompleted}
            status={getMofaLabel(mofa)}
            variant={getMofaVariant(mofa)}
            date={
              mofa
                ? formatDate(
                    mofa.application_date,
                  )
                : undefined
            }
          />

          <StageConnector />

          <StageRow
            title="Visa"
            completed={visaIssued}
            status={
              visaIssued
                ? "Issued"
                : "Pending"
            }
            date={
              visaIssued && visa?.visa_date
                ? formatDate(
                    visa.visa_date,
                  )
                : undefined
            }
          />
        </div>
      </CardContent>

      {/* FOOTER */}
      <CardFooter className="border-t bg-muted/20 px-4 py-2.5">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Agent
            </p>

            <p
              className="truncate text-[11px] font-medium"
              title={
                candidate.agent?.name ||
                candidate.agent?.code ||
                "No agent"
              }
            >
              {candidate.agent?.name ||
                candidate.agent?.code ||
                "No agent"}
            </p>
          </div>

          {onOpen && (
            <button
              type="button"
              onClick={() =>
                onOpen(candidate.id)
              }
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border bg-background px-2.5 text-[11px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Open
              <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}