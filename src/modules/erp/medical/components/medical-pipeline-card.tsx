import {
  ArrowDown,
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

function getMedicalValidUntil(medical: Medical) {
  const baseDate = medical.fit_date || medical.medical_date;

  if (!baseDate) {
    return null;
  }

  return addDays(baseDate, 60);
}

function isVisaIssued(visa: MedicalPipelineVisa | null) {
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
    <div className="flex h-3 items-center justify-center">
      <ArrowDown
        className="size-3 text-muted-foreground/60"
        strokeWidth={1.75}
      />
    </div>
  );
}

function StageIcon({
  completed,
}: {
  completed: boolean;
}) {
  if (completed) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground">
      <Circle className="size-2.5 fill-current" />
    </span>
  );
}

function StageRow({
  title,
  completed,
  status,
  date,
  secondary,
}: {
  title: string;
  completed: boolean;
  status: string;
  date?: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <StageIcon completed={completed} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>

          <Badge
            variant={completed ? "default" : "outline"}
            className="h-5 px-1.5 text-[10px]"
          >
            {status}
          </Badge>
        </div>

        {(date || secondary) && (
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
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

  const medicalValidUntil =
    getMedicalValidUntil(medical);

  const visaIssued =
    isVisaIssued(visa);

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
    <Card
      size="sm"
      className="h-full min-w-0 gap-0 rounded-xl"
    >
      {/* HEADER */}
      <CardHeader className="gap-1.5 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            #{candidate.sl ?? "—"}
          </span>

          <Badge
            variant={
              candidateStatus === "Unfit" ||
              candidateStatus === "Expired"
                ? "destructive"
                : "secondary"
            }
            className="h-5 px-1.5 text-[10px]"
          >
            {candidateStatus}
          </Badge>
        </div>

        <div className="min-w-0">
          <h3
            className="truncate text-sm font-semibold leading-5"
            title={candidate.name}
          >
            {candidate.name}
          </h3>

          <p className="truncate text-[10px] text-muted-foreground">
            {candidate.passport_no}
            {candidate.country
              ? ` · ${candidate.country}`
              : ""}
          </p>
        </div>
      </CardHeader>

      {/* PIPELINE */}
      <CardContent className="px-3.5 py-1">
        <div className="rounded-lg bg-muted/30 px-2.5 py-2">
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
      <CardFooter className="mt-2 border-t px-3.5 py-2">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] text-muted-foreground">
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
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-foreground hover:underline"
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