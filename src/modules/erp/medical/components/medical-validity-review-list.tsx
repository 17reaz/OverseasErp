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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function MedicalValidityReviewList() {
  const [medicals, setMedicals] = useState<Medical[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMedicalValidityReviews();

      setMedicals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleReview = async (
    medical: Medical,
    action: "active" | "expired" | "invalid",
  ) => {
    try {
      setProcessingId(medical.id);

      const updated = await reviewMedicalValidity(
        medical.id,
        action,
      );

      setMedicals((current) =>
        current.filter((item) => item.id !== updated.id),
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-32 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (medicals.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>

          <div>
            <p className="text-sm font-medium">
              No medical reviews pending
            </p>

            <p className="text-xs text-muted-foreground">
              All active medical validity periods are currently okay.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <ShieldAlert className="size-4" />
            </div>

            <div>
              <CardTitle className="text-sm">
                Medical Validity Review
              </CardTitle>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {medicals.length} medical
                {medicals.length === 1 ? "" : "s"} require review
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="gap-1.5">
            <AlertTriangle className="size-3.5" />
            Review Required
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {medicals.map((medical, index) => {
          const expiryDate = getExpiryDate(medical);
          const candidateName =
            medical.candidate?.name || "Unknown Candidate";

          const processing = processingId === medical.id;

          return (
            <div key={medical.id}>
              {index > 0 && <Separator />}

              <div className="space-y-4 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {candidateName}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Fit: {formatDate(medical.fit_date)}
                      </span>

                      <span>
                        Valid until: {formatDate(expiryDate)}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3" />
                        Expired
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={processing}
                      onClick={() =>
                        void handleReview(medical, "active")
                      }
                    >
                      <CheckCircle2 className="mr-1.5 size-4" />
                      Keep Active
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={processing}
                      onClick={() =>
                        void handleReview(medical, "invalid")
                      }
                    >
                      <XCircle className="mr-1.5 size-4" />
                      Invalid
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={processing}
                      onClick={() =>
                        void handleReview(medical, "expired")
                      }
                    >
                      {processing ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="mr-1.5 size-4" />
                      )}

                      Mark Expired
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}