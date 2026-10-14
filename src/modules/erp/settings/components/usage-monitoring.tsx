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
  MonitorCog,
  Network,
  RefreshCw,
  Server,
  Wifi,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  SectionTitle,
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "./settings-ui";

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
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>

          <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
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
    <div className="flex items-center justify-between gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>

      <Badge
        variant="outline"
        className={
          healthy
            ? "shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "shrink-0 gap-1"
        }
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

function InfoField({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: typeof Activity;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p
        className={`mt-0.5 flex items-center gap-1 truncate text-sm ${
          mono ? "font-mono" : "font-medium"
        }`}
      >
        {Icon && <Icon className="size-3.5" />}
        {value}
      </p>
    </div>
  );
}

export function UsageMonitoring() {
  return (
    <div className="space-y-4">
      <SettingsPageHeader
        icon={MonitorCog}
        title="Usage & Monitoring"
        description="Monitor application usage, performance, storage, network activity, and system health."
        action={
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />

      <SettingsCard>
        {/* Demo notice */}
        <SettingsSection muted className="flex items-start gap-3 py-4">
          <Activity className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <div>
            <p className="text-sm font-medium">Monitoring Preview</p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              The metrics shown here are demonstration values. Real monitoring
              data will be connected later.
            </p>
          </div>
        </SettingsSection>

        {/* Usage overview */}
        <SettingsSection>
          <SectionTitle
            title="Usage Overview"
            description="Application resource and network usage."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </SettingsSection>

        {/* Application health */}
        <SettingsSection>
          <SectionTitle
            title="Application Health"
            description="Current status of application services."
          />

          <div>
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
          </div>
        </SettingsSection>

        {/* Performance */}
        <SettingsSection>
          <SectionTitle
            title="Performance"
            description="Application and infrastructure performance."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </SettingsSection>

        {/* Storage */}
        <SettingsSection>
          <SectionTitle
            title="Storage"
            description="Local application storage usage."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <HardDrive className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">Browser Storage</p>
                <p className="text-xs text-muted-foreground">42 MB</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Database className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">IndexedDB / Dexie</p>
                <p className="text-xs text-muted-foreground">24 MB</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Cloud className="size-4 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">PWA Cache</p>
                <p className="text-xs text-muted-foreground">18 MB</p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Network */}
        <SettingsSection>
          <SectionTitle
            title="Network Activity"
            description="Application network request statistics."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </SettingsSection>

        {/* DevOps */}
        <SettingsSection>
          <SectionTitle
            title="DevOps & Deployment"
            description="Application build and deployment information."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoField label="Environment" value="Production" />
            <InfoField label="Application Version" value="v1.0.0" />
            <InfoField label="Build" value="#184" icon={GitCommit} />
            <InfoField label="Commit" value="a82f91c" mono />
            <InfoField label="Deployment" value="Production" />
            <InfoField label="Region" value="Demo Region" />
          </div>
        </SettingsSection>

        {/* Last deployment */}
        <SettingsSection
          muted
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium">Last Deployment</p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              October 2, 2026 at 11:42 PM
            </p>
          </div>

          <Badge variant="secondary">Demo Data</Badge>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
}
