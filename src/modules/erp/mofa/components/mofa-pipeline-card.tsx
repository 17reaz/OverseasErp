import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import type {
  Mofa,
} from "../mofa-service";


interface MofaPipelineCardProps {
  item: Mofa;

  onOpen?: (
    mofa: Mofa,
  ) => void;
}


function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value,
  ).toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}


export function MofaPipelineCard({
  item,
  onOpen,
}: MofaPipelineCardProps) {
  const candidate =
    item.candidate;

  const visaCount =
    item.visas?.length ?? 0;

  const visaDone =
    visaCount > 0;

  return (
    <div
      className="
        group
        flex
        min-h-[250px]
        flex-col
        rounded-xl
        border
        bg-card
        p-4
        shadow-sm
        transition
        hover:shadow-md
      "
    >
      {/* HEADER */}
      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div className="min-w-0">
          <div
            className="
              text-xs
              font-medium
              text-muted-foreground
            "
          >
            {item.sl
              ? `#${item.sl}`
              : "MOFA"}
          </div>

          <div
            className="
              mt-1
              truncate
              text-sm
              font-semibold
            "
          >
            {candidate?.name ??
              "Unknown Candidate"}
          </div>

          <div
            className="
              mt-1
              truncate
              text-xs
              text-muted-foreground
            "
          >
            {candidate?.passport_no ??
              "No passport"}
            {candidate?.country
              ? ` · ${candidate.country}`
              : ""}
          </div>
        </div>

        <Badge
          variant="secondary"
          className="
            shrink-0
            gap-1
          "
        >
          <CheckCircle2
            className="h-3.5 w-3.5"
          />
          Visa Ready
        </Badge>
      </div>

      {/* PIPELINE */}
      <div
        className="
          mt-4
          rounded-lg
          border
          bg-muted/30
          p-3
        "
      >
        {/* MOFA */}
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <div
            className="
              mt-0.5
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-foreground
              text-background
            "
          >
            <CheckCircle2
              className="h-4 w-4"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                "
              >
                MOFA
              </span>

              <span
                className="
                  text-xs
                  font-medium
                  text-muted-foreground
                "
              >
                Approved
              </span>
            </div>

            <div
              className="
                mt-1
                text-xs
                text-muted-foreground
              "
            >
              {formatDate(
                item.application_date,
              )}
              {item.application_number
                ? ` · ${item.application_number}`
                : ""}
            </div>
          </div>
        </div>

        {/* CONNECTOR */}
        <div
          className="
            ml-3.5
            h-4
            border-l
            border-dashed
          "
        />

        {/* VISA */}
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <div
            className="
              mt-0.5
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              bg-background
            "
          >
            {visaDone ? (
              <CheckCircle2
                className="h-4 w-4"
              />
            ) : (
              <Circle
                className="
                  h-4
                  w-4
                  text-muted-foreground
                "
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                "
              >
                Visa
              </span>

              <span
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                {visaDone
                  ? "Added"
                  : "Pending"}
              </span>
            </div>

            <div
              className="
                mt-1
                text-xs
                text-muted-foreground
              "
            >
              {visaDone
                ? item.visas?.[0]
                    ?.visa_no ??
                  "Visa created"
                : "Ready to apply"}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        className="
          mt-auto
          flex
          items-center
          justify-between
          gap-3
          pt-4
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
            text-xs
            text-muted-foreground
          "
        >
          <FileText
            className="h-3.5 w-3.5"
          />

          <span className="truncate">
            {item.trade ||
              "Trade not specified"}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onOpen?.(item)
          }
          className="
            shrink-0
            gap-1
          "
        >
          Open
          <ArrowRight
            className="
              h-3.5
              w-3.5
            "
          />
        </Button>
      </div>
    </div>
  );
}