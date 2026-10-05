
import { useState } from "react";
import { Check, Hash, Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NumberDisplayFormat = "compact" | "exact";

export function NumberDisplaySettings() {
  const [format, setFormat] =
    useState<NumberDisplayFormat>("compact");

  const [showRemainder, setShowRemainder] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Number Display</h2>
        <p className="text-sm text-muted-foreground">
          Control how large numbers are displayed across your ERP.
        </p>
      </div>

      {/* Display Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="size-4" />
            Display Format
          </CardTitle>

          <CardDescription>
            Choose how numbers should appear throughout the system.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Compact */}
          <button
            type="button"
            onClick={() => setFormat("compact")}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
              format === "compact"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                format === "compact"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {format === "compact" && (
                <Check className="size-2.5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Compact</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Display large numbers in a shorter format.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {["1K", "1.25K", "10K", "1M"].map((value) => (
                  <span
                    key={value}
                    className="rounded-md border bg-muted px-2 py-1 font-mono text-xs"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Exact */}
          <button
            type="button"
            onClick={() => setFormat("exact")}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
              format === "exact"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                format === "exact"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {format === "exact" && (
                <Check className="size-2.5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Exact</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Always show the complete number without shortening it.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {["1,000", "1,250", "10,000", "1,000,000"].map(
                  (value) => (
                    <span
                      key={value}
                      className="rounded-md border bg-muted px-2 py-1 font-mono text-xs"
                    >
                      {value}
                    </span>
                  ),
                )}
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Remainder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Remaining Count
          </CardTitle>

          <CardDescription>
            Show the remaining amount when a compact number has an
            additional count.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <button
            type="button"
            onClick={() => setShowRemainder((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
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
                {showRemainder && (
                  <Check className="size-2.5" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium">
                  Show remaining count
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Show extra numbers after the compact value.
                </p>
              </div>
            </div>

            <span
              className={cn(
                "text-xs font-medium",
                showRemainder
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {showRemainder ? "Enabled" : "Disabled"}
            </span>
          </button>

          {/* Example */}
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Example
                </p>

                <div className="grid gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">
                      1,000
                    </span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">1K</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      1,001
                    </span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">1K + 1</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">
                      1,010
                    </span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">1K + 10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>
            Preview how the selected format will look.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Candidates", value: "1,250" },
              { label: "Active", value: "1,001" },
              { label: "Completed", value: "10,000" },
              { label: "Total", value: "1,000,000" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border bg-card p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {item.label}
                </p>

                <p className="mt-2 text-xl font-semibold tracking-tight">
                  {format === "exact"
                    ? item.value
                    : item.label === "Candidates"
                      ? "1.25K"
                      : item.label === "Active"
                        ? showRemainder
                          ? "1K + 1"
                          : "1K"
                        : item.label === "Completed"
                          ? "10K"
                          : "1M"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
