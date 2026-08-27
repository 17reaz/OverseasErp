import {
  ArrowUpRight,
  UserRound,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

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
  DashboardCandidate,
} from "../dashboard-service";


interface Props {
  candidates: DashboardCandidate[];
}


function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}


function getStageLabel(
  stage: string | null,
) {
  if (!stage) {
    return "Not started";
  }

  return stage
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase(),
    );
}


export function DashboardTable({
  candidates,
}: Props) {
  return (
    <Card className="gap-0 overflow-hidden py-0">

      <CardHeader className="border-b px-5 py-4">
        <CardTitle>
          Recent Candidates
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Recently created candidate records.
        </p>
      </CardHeader>


      <CardContent className="p-0">

        {candidates.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <UserRound className="mb-3 h-8 w-8 text-muted-foreground" />

            <p className="text-sm font-medium">
              No candidates yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Candidate records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground">
                    Candidate
                  </th>

                  <th className="px-5 py-3 font-medium text-muted-foreground">
                    Passport
                  </th>

                  <th className="px-5 py-3 font-medium text-muted-foreground">
                    Stage
                  </th>

                  <th className="px-5 py-3 font-medium text-muted-foreground">
                    Received
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>


              <tbody>
                {candidates.map(
                  (candidate) => (
                    <tr
                      key={
                        candidate.id
                      }
                      className="border-b last:border-0 hover:bg-muted/30"
                    >

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {
                                candidate.name
                              }
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {
                                candidate.id.slice(
                                  0,
                                  8,
                                )
                              }
                            </p>
                          </div>
                        </div>
                      </td>


                      <td className="px-5 py-4 font-mono text-xs">
                        {
                          candidate.passport_no
                        }
                      </td>


                      <td className="px-5 py-4">
                        {
                          getStageLabel(
                            candidate.current_stage,
                          )
                        }
                      </td>


                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(
                          candidate.created_at,
                        )}
                      </td>


                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">

                          <Badge
                            variant={
                              candidate.is_returned
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {candidate.is_returned
                              ? "Returned"
                              : "Active"}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <ArrowUpRight />
                          </Button>

                        </div>
                      </td>

                    </tr>
                  ),
                )}
              </tbody>

            </table>
          </div>
        )}

      </CardContent>
    </Card>
  );
}