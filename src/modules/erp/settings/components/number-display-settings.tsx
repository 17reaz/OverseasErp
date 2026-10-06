import { useState } from "react";
import { Check, Hash, Info } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NumberDisplayFormat = "compact" | "exact";

/* -------------------------------------------------------------------------- */
/* Static data                                                                */
/* -------------------------------------------------------------------------- */

const FORMAT_OPTIONS: {
  value: NumberDisplayFormat;
  title: string;
  description: string;
  samples: string[];
}[] = [
  {
    value: "compact",
    title: "Compact",
    description: "Display large numbers in a shorter format.",
    samples: ["1K", "1.25K", "10K", "1M"],
  },
  {
    value: "exact",
    title: "Exact",
    description: "Always show the complete number without shortening it.",
    samples: ["1,000", "1,250", "10,000", "1,000,000"],
  },
];

const EXAMPLES = [
  { from: "1,000", to: "1K" },
  { from: "1,001", to: "1K + 1" },
  { from: "1,010", to: "1K + 10" },
];

const PREVIEW_ITEMS = [
  { label: "Candidates", exact: "1,250", compact: "1.25K" },
  { label: "Active", exact: "1,001", compact: "1K + 1", compactNoRemainder: "1K" },
  { label: "Completed", exact: "10,000", compact: "10K" },
  { label: "Total", exact: "1,000,000", compact: "1M" },
];

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="size-4" />}
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Number display settings                                                    */
/* -------------------------------------------------------------------------- */

export function NumberDisplaySettings() {
  const [format, setFormat] = useState<NumberDisplayFormat>("compact");
  const [showRemainder, setShowRemainder] = useState(true);

  const isCompact = format === "compact";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Number Display</h2>
        <p className="text-sm text-muted-foreground">
          Control how large numbers are displayed across your ERP.
        </p>
      </div>

      <Card className="divide-y overflow-hidden">
        {/* ------------------------------------------------------------ */}
        {/* Display format                                               */}
        {/* ------------------------------------------------------------ */}
        <section className="p-5">
          <SectionTitle
            icon={Hash}
            title="Display Format"
            description="Choose how numbers should appear throughout the system."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {FORMAT_OPTIONS.map((option) => {
              const selected = format === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {selected && <Check className="size-2.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{option.title}</p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {option.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {option.samples.map((sample) => (
                        <span
                          key={sample}
                          className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs"
                        >
                          {sample}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Remaining count                                              */}
        {/* ------------------------------------------------------------ */}
        <section
          className={cn(
            "grid gap-4 p-5 lg:grid-cols-2 lg:items-center",
            !isCompact && "opacity-60",
          )}
        >
          <div>
            <SectionTitle
              title="Remaining Count"
              description="Show the remaining amount when a compact number has an additional count."
            />

            <button
              type="button"
              disabled={!isCompact}
              onClick={() => setShowRemainder((value) => !value)}
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                    showRemainder
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {showRemainder && <Check className="size-2.5" />}
                </div>

                <div>
                  <p className="text-sm font-medium">Show remaining count</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Show extra numbers after the compact value.
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "text-xs font-medium",
                  showRemainder ? "text-primary" : "text-muted-foreground",
                )}
              >
                {showRemainder ? "Enabled" : "Disabled"}
              </span>
            </button>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div className="space-y-1.5">
                <p className="text-xs font-medium">Example</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {EXAMPLES.map((example) => (
                    <div key={example.from}>
                      <span className="text-muted-foreground">
                        {example.from}
                      </span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{example.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Preview                                                      */}
        {/* ------------------------------------------------------------ */}
        <section className="bg-muted/20 p-5">
          <SectionTitle
            title="Preview"
            description="Preview how the selected format will look."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PREVIEW_ITEMS.map((item) => {
              const value = !isCompact
                ? item.exact
                : showRemainder
                  ? item.compact
                  : (item.compactNoRemainder ?? item.compact);

              return (
                <div
                  key={item.label}
                  className="rounded-lg border bg-card px-4 py-3"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>

                  <p className="mt-1 text-xl font-semibold tracking-tight">
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </Card>
    </div>
  );
}