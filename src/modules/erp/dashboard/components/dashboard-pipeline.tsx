import {
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  DashboardData,
} from "../dashboard-service";


interface Props {
  data: DashboardData["pipeline"];
}


export function DashboardPipeline({
  data,
}: Props) {
  const candidateCount =
    data.find(
      (item) =>
        item.label === "Candidates",
    )?.value ?? 0;


  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Processing Pipeline
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Current workload across each processing stage.
        </p>
      </CardHeader>


      <CardContent className="space-y-5">
        {data.map(
          (item, index) => {
            const percentage =
              candidateCount > 0
                ? Math.round(
                    (item.value /
                      candidateCount) *
                      100,
                  )
                : 0;


            return (
              <div
                key={item.label}
                className="space-y-2"
              >

                {/* LABEL */}

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="text-sm font-medium">
                      {item.label}
                    </span>

                    {index <
                      data.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}

                  </div>


                  <div className="flex items-center gap-2">

                    <span className="text-sm font-semibold">
                      {item.value}
                    </span>

                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {percentage}%
                      </span>
                    )}

                  </div>

                </div>


                {/* PROGRESS */}

                <div className="h-2 overflow-hidden rounded-full bg-muted">

                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        percentage,
                        100,
                      )}%`,
                    }}
                  />

                </div>

              </div>
            );
          },
        )}
      </CardContent>
    </Card>
  );
}