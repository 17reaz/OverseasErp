import {
  Activity,
  Database,
  Gauge,
  HardDrive,
  Server,
  Wifi,
  Zap,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RuntimeKind = "local" | "ec2" | "vercel" | "unknown";

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: typeof Activity;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "healthy" | "unknown";
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span
          className={
            status === "healthy"
              ? "size-2 rounded-full bg-emerald-500"
              : "size-2 rounded-full bg-muted-foreground"
          }
        />
        <span className="capitalize text-muted-foreground">{status}</span>
      </div>
    </div>
  );
}

const DEMO_RUNTIME: {
  frontend: RuntimeKind;
  backend: RuntimeKind;
  environment: "development" | "preview" | "production";
  region: string;
} = {
  frontend: "local",
  backend: "local",
  environment: "development",
  region: "Local machine",
};

export function UsageMonitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Usage &amp; Monitoring</h2>
        <p className="text-sm text-muted-foreground">
          Runtime, performance, storage, network, and application health.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4" />
            Current Runtime
          </CardTitle>
          <CardDescription>
            The frontend is prepared to consume runtime-specific metrics later.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Frontend</p>
            <p className="mt-1 text-sm font-medium">
              {DEMO_RUNTIME.frontend === "local" ? "Localhost" : "Runtime"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Backend</p>
            <p className="mt-1 text-sm font-medium">
              {DEMO_RUNTIME.backend === "local"
                ? "Hono • localhost:8000"
                : "Runtime"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Environment</p>
            <p className="mt-1 text-sm font-medium capitalize">
              {DEMO_RUNTIME.environment}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Region</p>
            <p className="mt-1 text-sm font-medium">{DEMO_RUNTIME.region}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="CPU"
          value="34%"
          description="Demo value — will come from the runtime."
          icon={Gauge}
        />
        <MetricCard
          label="Memory"
          value="2.1 GB"
          description="Demo value — server memory later."
          icon={Activity}
        />
        <MetricCard
          label="Uptime"
          value="2h 14m"
          description="Demo value — backend uptime later."
          icon={Zap}
        />
        <MetricCard
          label="API Latency"
          value="126 ms"
          description="Demo value — measured from the app."
          icon={Wifi}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Health</CardTitle>
            <CardDescription>
              Health checks will become runtime-backed later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRow
              label="Application"
              status="healthy"
              detail="Frontend is running"
            />
            <StatusRow
              label="API Server"
              status="healthy"
              detail="Demo local Hono runtime"
            />
            <StatusRow
              label="Database"
              status="healthy"
              detail="Connection status will be measured later"
            />
            <StatusRow
              label="Synchronization"
              status="healthy"
              detail="Offline sync status will be measured later"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
            <CardDescription>
              Browser and backend measurements will be separated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Ping</span>
              <span className="font-medium">82 ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Database</span>
              <span className="font-medium">46 ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>API requests</span>
              <span className="font-medium">1,284</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Failed requests</span>
              <span className="font-medium">8</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="size-4" />
              Storage
            </CardTitle>
            <CardDescription>
              Browser storage only for now; server disk comes later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Browser Storage</span>
              <span className="font-medium">42 MB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>IndexedDB / Dexie</span>
              <span className="font-medium">24 MB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>PWA Cache</span>
              <span className="font-medium">18 MB</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4" />
              Network Activity
            </CardTitle>
            <CardDescription>
              Request counters will later be populated by the monitoring layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Total requests</span>
              <span className="font-medium">1,284</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Successful</span>
              <span className="font-medium">1,276</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Failed</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Data sent</span>
              <span className="font-medium">8.4 MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DevOps &amp; Deployment</CardTitle>
          <CardDescription>
            Deployment metadata will be read from the active runtime later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Runtime</p>
            <p className="mt-1 text-sm font-medium">Local</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Application Version</p>
            <p className="mt-1 text-sm font-medium">v1.0.0</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deployment</p>
            <p className="mt-1 text-sm font-medium">Development</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Build</p>
            <p className="mt-1 text-sm font-medium">Local build</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commit</p>
            <p className="mt-1 font-mono text-sm font-medium">local</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Health Check</p>
            <p className="mt-1 text-sm font-medium">Demo data</p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Frontend locked:</strong>{" "}
        this screen currently has no Supabase table, monitoring API, or
        infrastructure dependency. Later, the same UI will consume a standard
        runtime metrics contract from Local Hono, EC2, or Vercel.
      </div>
    </div>
  );
}
