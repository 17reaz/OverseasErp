import {
  Activity,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  HardDrive,
  Globe,
  Gauge,
  GitCommit,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Wifi,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof Activity;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  icon: Icon,
  name,
  status,
  detail,
}: {
  icon: typeof Activity;
  name: string;
  status: "healthy" | "warning";
  detail: string;
}) {
  const healthy = status === "healthy";

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </div>
      </div>

      <Badge
        variant={healthy ? "secondary" : "outline"}
        className="shrink-0 gap-1"
      >
        {healthy ? (
          <CheckCircle2 className="size-3" />
        ) : (
          <Activity className="size-3" />
        )}

        {healthy ? "Healthy" : "Warning"}
      </Badge>
    </div>
  );
}

export function UsageMonitoring() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Usage & Monitoring
          </h2>

          <p className="text-sm text-muted-foreground">
            Monitor application usage, performance, storage,
            network activity, and system health.
          </p>
        </div>

        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Demo notice */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 size-4 shrink-0" />

          <div>
            <p className="text-sm font-medium">
              Monitoring Preview
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              The metrics shown here are demonstration values.
              Real monitoring data will be connected later.
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            Usage Overview
          </h3>

          <p className="text-xs text-muted-foreground">
            Application resource and network usage.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={HardDrive}
            title="Storage Used"
            value="42 MB"
            description="Browser storage"
          />

          <MetricCard
            icon={Network}
            title="Network"
            value="31.7 MB"
            description="Data received"
          />

          <MetricCard
            icon={Activity}
            title="API Requests"
            value="1,284"
            description="Last 24 hours"
          />

          <MetricCard
            icon={Gauge}
            title="Avg Response"
            value="126 ms"
            description="API response time"
          />
        </div>
      </section>

      {/* Application Health */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            Application Health
          </h3>

          <p className="text-xs text-muted-foreground">
            Current status of application services.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <StatusRow
              icon={Activity}
              name="Application"
              status="healthy"
              detail="Frontend application is running normally"
            />

            <StatusRow
              icon={Database}
              name="Database"
              status="healthy"
              detail="Database connection available"
            />

            <StatusRow
              icon={Server}
              name="API Server"
              status="healthy"
              detail="Backend API responding normally"
            />

            <StatusRow
              icon={RefreshCw}
              name="Synchronization"
              status="healthy"
              detail="No pending synchronization tasks"
            />
          </CardContent>
        </Card>
      </section>

      {/* Performance */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            Performance
          </h3>

          <p className="text-xs text-muted-foreground">
            Application and infrastructure performance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Wifi}
            title="Ping"
            value="82 ms"
            description="Demo latency"
          />

          <MetricCard
            icon={Database}
            title="Database"
            value="46 ms"
            description="Demo query latency"
          />

          <MetricCard
            icon={Cpu}
            title="CPU"
            value="34%"
            description="Demo server usage"
          />

          <MetricCard
            icon={MemoryStick}
            title="Memory"
            value="2.1 GB"
            description="Demo server memory"
          />
        </div>
      </section>

      {/* Storage */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            Storage
          </h3>

          <p className="text-xs text-muted-foreground">
            Local application storage usage.
          </p>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <HardDrive className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  Browser Storage
                </p>

                <p className="text-xs text-muted-foreground">
                  42 MB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Database className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  IndexedDB / Dexie
                </p>

                <p className="text-xs text-muted-foreground">
                  24 MB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Cloud className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  PWA Cache
                </p>

                <p className="text-xs text-muted-foreground">
                  18 MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Network */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            Network Activity
          </h3>

          <p className="text-xs text-muted-foreground">
            Application network request statistics.
          </p>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Globe}
              title="Requests"
              value="1,284"
              description="Total requests"
            />

            <MetricCard
              icon={CheckCircle2}
              title="Successful"
              value="1,276"
              description="99.4% success"
            />

            <MetricCard
              icon={XCircle}
              title="Failed"
              value="8"
              description="0.6% failed"
            />

            <MetricCard
              icon={Network}
              title="Data Sent"
              value="8.4 MB"
              description="Outbound traffic"
            />
          </CardContent>
        </Card>
      </section>

      {/* DevOps */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            DevOps & Deployment
          </h3>

          <p className="text-xs text-muted-foreground">
            Application build and deployment information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Runtime Information
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Environment
              </p>

              <p className="mt-1 text-sm font-medium">
                Production
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Application Version
              </p>

              <p className="mt-1 text-sm font-medium">
                v1.0.0
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Build
              </p>

              <p className="mt-1 flex items-center gap-1 text-sm font-medium">
                <GitCommit className="size-3.5" />
                #184
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Commit
              </p>

              <p className="mt-1 font-mono text-sm">
                a82f91c
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Deployment
              </p>

              <p className="mt-1 text-sm font-medium">
                Production
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Region
              </p>

              <p className="mt-1 text-sm font-medium">
                Demo Region
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Last deployment */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Last Deployment
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              October 2, 2026 at 11:42 PM
            </p>
          </div>

          <Badge variant="secondary">
            Demo Data
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}