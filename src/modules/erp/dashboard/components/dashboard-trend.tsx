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
  data: DashboardData["trend"];
}


export function DashboardTrend({
  data,
}: Props) {
  const max =
    Math.max(
      ...data.map(
        (item) =>
          item.candidates,
      ),
      1,
    );


  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Candidate Intake
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Candidate records created over the last six months.
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex h-64 items-end gap-3">
          {data.map((item) => {
            const height =
              Math.max(
                (item.candidates /
                  max) *
                  100,
                item.candidates
                  ? 8
                  : 2,
              );

            return (
              <div
                key={item.month}
                className="flex h-full flex-1 flex-col justify-end gap-2"
              >
                <div className="flex items-end justify-center">
                  <div
                    className="w-full rounded-md bg-primary transition-all"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${item.candidates} candidates`}
                  />
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  {item.month}
                </div>

                <div className="text-center text-xs font-medium">
                  {item.candidates}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}