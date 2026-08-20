import {
  CalendarDays,
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
  MedicalCandidate,
} from "../medical-service";

interface MedicalPendingProps {
  candidates: MedicalCandidate[];
  loading: boolean;
  onAddMedical: (
    candidate: MedicalCandidate,
  ) => void;
}

export function MedicalPending({
  candidates,
  loading,
  onAddMedical,
}: MedicalPendingProps) {
  return (
    <Card>

      <CardHeader>

        <div className="flex items-center justify-between">

          <div>
            <CardTitle>
              Medical Pending
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Candidates waiting for medical processing.
            </p>
          </div>

          <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
            {candidates.length}
          </div>

        </div>

      </CardHeader>

      <CardContent>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading pending candidates...
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No candidates are waiting for medical.
          </div>
        ) : (
          <div className="space-y-2">

            {candidates.map(
              (candidate) => (

                <div
                  key={candidate.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium">
                      {candidate.name}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">

                      <span>
                        Passport:{" "}
                        {candidate.passport_no}
                      </span>

                      {candidate.received_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Received:{" "}
                          {
                            candidate.received_date
                          }
                        </span>
                      )}

                    </div>

                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onAddMedical(
                        candidate,
                      )
                    }
                  >
                    Add Medical
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