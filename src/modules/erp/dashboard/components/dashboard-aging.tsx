import {
  Clock3,
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
  data: DashboardData["aging"];
}


export function DashboardAging({
  data,
}: Props) {
  const total =
    data.reduce(
      (sum, item) =>
        sum + item.count,
      0,
    );


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />

          <CardTitle>
            Candidate Aging
          </CardTitle>
        </div>

        <p className="text-sm text-muted-foreground">
          How long active candidates have been waiting.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.map((item) => {
          const percentage =
            total > 0
              ? (item.count /
                  total) *
                100
              : 0;

          return (
            <div
              key={item.label}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span>
                  {item.label}
                </span>

                <span className="font-medium">
                  {item.count}
                </span>
              </div>

              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}