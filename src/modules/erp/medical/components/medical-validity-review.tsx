import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import {
  getMedicalValidityReviews,
  reviewMedicalValidity,
  type Medical,
} from "../medical-service";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getExpiryDate(medical: Medical) {
  const baseDate = medical.fit_date || medical.medical_date;

  if (!baseDate) return null;

  const date = new Date(baseDate);
  date.setDate(date.getDate() + 60);

  return date.toISOString();
}

export function MedicalValidityReview() {
  const [medicals, setMedicals] = useState<Medical[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMedicalValidityReviews();

      setMedicals(data);
    } catch (error) {
      console.error("Failed to load medical validity reviews:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function handleReview(
    medical: Medical,
    action: "active" | "expired" | "invalid",
  ) {
    try {
      setProcessingId(medical.id);

      await reviewMedicalValidity(medical.id, action);

      setMedicals((current) =>
        current.filter((item) => item.id !== medical.id),
      );
    } catch (error) {
      console.error("Failed to review medical validity:", error);
    } finally {
      setProcessingId(null);
    }
  }

  const count = medicals.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={count > 0 ? "outline" : "ghost"}
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldAlert className="size-4" />
          )}

          <span className="hidden sm:inline">
            Validity Review
          </span>

          {count > 0 && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 rounded-full px-1.5 text-[10px]"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">
              Medical Validity Review
            </p>

            <p className="text-xs text-muted-foreground">
              {count > 0
                ? `${count} medical${
                    count === 1 ? "" : "s"
                  } require review`
                : "No medical reviews pending"}
            </p>
          </div>

          <ShieldAlert className="size-4 text-muted-foreground" />
        </div>

        <Separator />

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>

            <p className="text-sm font-medium">
              Everything looks good
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              No expired medical validity requires review.
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {medicals.map((medical, index) => {
              const expiryDate = getExpiryDate(medical);
              const candidateName =
                medical.candidate?.name ||
                "Unknown Candidate";

              const processing =
                processingId === medical.id;

              return (
                <div key={medical.id}>
                  {index > 0 && <Separator />}

                  <div className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        <AlertTriangle className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {candidateName}
                          </p>

                          <Badge
                            variant="secondary"
                            className="shrink-0 gap-1"
                          >
                            <Clock3 className="size-3" />
                            Review
                          </Badge>
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Fit: {formatDate(medical.fit_date)}
                          </span>

                          <span>
                            Valid until:{" "}
                            {formatDate(expiryDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={processing}
                        onClick={() =>
                          void handleReview(
                            medical,
                            "active",
                          )
                        }
                      >
                        <CheckCircle2 className="mr-1.5 size-3.5" />
                        Active
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={processing}
                        onClick={() =>
                          void handleReview(
                            medical,
                            "invalid",
                          )
                        }
                      >
                        <XCircle className="mr-1.5 size-3.5" />
                        Invalid
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={processing}
                        onClick={() =>
                          void handleReview(
                            medical,
                            "expired",
                          )
                        }
                      >
                        {processing ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <AlertTriangle className="mr-1.5 size-3.5" />
                        )}
                        Expired
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}