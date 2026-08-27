import {
  Activity,
  ArrowDownLeft,
  ClipboardCheck,
  FileCheck2,
  Plane,
  Users,
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
  stats: DashboardData["stats"];
}


export function DashboardStats({
  stats,
}: Props) {
  const items = [
    {
      title: "Total Candidates",
      value: stats.totalCandidates,
      icon: Users,
      description: "All active records",
    },

    {
      title: "Active Candidates",
      value: stats.activeCandidates,
      icon: Activity,
      description: "Currently processing",
    },

    {
      title: "Medical Pending",
      value: stats.medicalPending,
      icon: ClipboardCheck,
      description: `${stats.medicalFit} fit`,
    },

    {
      title: "MOFA Pending",
      value: stats.mofaPending,
      icon: FileCheck2,
      description: `${stats.mofaApproved} approved`,
    },

    {
      title: "Visa Pending",
      value: stats.visaPending,
      icon: FileCheck2,
      description: `${stats.visaIssued} issued`,
    },

    {
      title: "Flights Scheduled",
      value: stats.flightScheduled,
      icon: Plane,
      description: `${stats.flightDeparted} departed`,
    },

    {
      title: "Returned",
      value: stats.returnedCandidates,
      icon: ArrowDownLeft,
      description: "Returned candidates",
    },
  ];


  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>

              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold">
                {item.value}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}