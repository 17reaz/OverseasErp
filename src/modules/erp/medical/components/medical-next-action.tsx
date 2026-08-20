import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  Medical,
} from "../medical-service";

interface MedicalNextActionProps {
  medicals: Medical[];
}

export function MedicalNextAction({
  medicals,
}: MedicalNextActionProps) {

  const fitMedicals =
    medicals.filter(
      (medical) =>
        medical.status === "fit",
    );

  return (
    <Card>

      <CardHeader>

        <CardTitle>
          Next Action
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Candidates ready for the next processing stage.
        </p>

      </CardHeader>

      <CardContent>

        {fitMedicals.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No next actions available.
          </div>
        ) : (
          <div className="space-y-3">

            {fitMedicals.map(
              (medical) => (

                <div
                  key={medical.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >

                  <div className="flex items-center gap-3">

                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                    <div>

                      <p className="text-sm font-medium">
                        {medical.candidate?.name ??
                          "Candidate"}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Medical: Fit
                        {medical.fit_date
                          ? ` • ${medical.fit_date}`
                          : ""}
                      </p>

                    </div>

                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                  >
                    Create MOFA
                    <ArrowRight />
                  </Button>

                </div>

              ),
            )}

          </div>
        )}

      </CardContent>

    </Card>
  );
}