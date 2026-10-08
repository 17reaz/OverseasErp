import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDot,
  Filter,
  Globe2,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings2,
  Stethoscope,
  Users,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ServiceType = "internal" | "external";

type ServiceStatus = "active" | "inactive";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  category: string;
  provider: string;
  cost: number;
  sellingPrice: number;
  status: ServiceStatus;
  finance: boolean;
  workflow: boolean;
}

/* =========================================================
   DUMMY DATA
========================================================= */

const services: ServiceItem[] = [
  {
    id: "medical",
    name: "Medical",
    description: "Candidate medical processing",
    type: "internal",
    category: "Candidate Service",
    provider: "Internal",
    cost: 1800,
    sellingPrice: 2500,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "mofa",
    name: "MOFA",
    description: "MOFA application and processing",
    type: "internal",
    category: "Government",
    provider: "Internal",
    cost: 1200,
    sellingPrice: 1800,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "finger",
    name: "Finger",
    description: "Biometric / fingerprint service",
    type: "internal",
    category: "Candidate Service",
    provider: "Internal",
    cost: 700,
    sellingPrice: 1000,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "pcc",
    name: "Police Clearance",
    description: "Police clearance processing",
    type: "internal",
    category: "Government",
    provider: "Internal",
    cost: 900,
    sellingPrice: 1400,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "takamul",
    name: "Takamul",
    description: "Trade test and certification",
    type: "internal",
    category: "Certification",
    provider: "Internal",
    cost: 2200,
    sellingPrice: 3000,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "visa",
    name: "Visa",
    description: "Visa processing and tracking",
    type: "internal",
    category: "Government",
    provider: "Internal",
    cost: 3500,
    sellingPrice: 5000,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "bmet",
    name: "BMET",
    description: "BMET / manpower processing",
    type: "internal",
    category: "Government",
    provider: "Internal",
    cost: 1800,
    sellingPrice: 2500,
    status: "active",
    finance: true,
    workflow: true,
  },
  {
    id: "flight",
    name: "Flight",
    description: "Air ticket and departure service",
    type: "internal",
    category: "Travel",
    provider: "Internal",
    cost: 45000,
    sellingPrice: 48000,
    status: "active",
    finance: true,
    workflow: true,
  },

  /* External */

  {
    id: "medical-center",
    name: "Medical Center",
    description: "External medical provider",
    type: "external",
    category: "Medical Provider",
    provider: "Popular Diagnostic Center",
    cost: 1650,
    sellingPrice: 0,
    status: "active",
    finance: true,
    workflow: false,
  },
  {
    id: "ticketing",
    name: "Air Ticketing",
    description: "External ticketing provider",
    type: "external",
    category: "Travel Provider",
    provider: "ABC Travels",
    cost: 44500,
    sellingPrice: 0,
    status: "active",
    finance: true,
    workflow: false,
  },
  {
    id: "translation",
    name: "Translation",
    description: "Document translation provider",
    type: "external",
    category: "Document Service",
    provider: "Global Translation BD",
    cost: 800,
    sellingPrice: 0,
    status: "active",
    finance: true,
    workflow: false,
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Travel / worker insurance",
    type: "external",
    category: "Insurance",
    provider: "Secure Life",
    cost: 1200,
    sellingPrice: 0,
    status: "inactive",
    finance: true,
    workflow: false,
  },
];

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

/* =========================================================
   PAGE
========================================================= */

export function TasksPage() {
  const [tab, setTab] = useState<"all" | ServiceType>("all");
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesTab = tab === "all" || service.type === tab;

      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.provider.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [search, tab]);

  const internalCount = services.filter(
    (item) => item.type === "internal",
  ).length;

  const externalCount = services.filter(
    (item) => item.type === "external",
  ).length;

  const activeProviders = new Set(
    services
      .filter((item) => item.type === "external" && item.status === "active")
      .map((item) => item.provider),
  ).size;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>

            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight">
                Services
              </h1>

              <p className="text-xs text-muted-foreground">
                Manage your internal services and external providers.
              </p>
            </div>
          </div>

          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <StatCard
            title="Total Services"
            value={services.length}
            icon={Package}
          />

          <StatCard
            title="Internal Services"
            value={internalCount}
            icon={Settings2}
          />

          <StatCard
            title="External Services"
            value={externalCount}
            icon={Globe2}
          />

          <StatCard
            title="Active Providers"
            value={activeProviders}
            icon={Building2}
          />
        </div>

        {/* SERVICE DIRECTORY */}
        <Card className="gap-0 overflow-hidden py-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <CardHeader className="gap-2 border-b px-4 py-2.5 [.border-b]:pb-2.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-sm">Service Directory</CardTitle>

                <p className="text-[11px] text-muted-foreground">
                  Configure how services are handled inside the ERP.
                </p>
              </div>

              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as "all" | ServiceType)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs">
                    All Services
                  </TabsTrigger>

                  <TabsTrigger value="internal" className="text-xs">
                    Internal
                  </TabsTrigger>

                  <TabsTrigger value="external" className="text-xs">
                    External Providers
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  title="Filters"
                  className="h-8 w-8 shrink-0"
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <div className="divide-y">
              {filteredServices.map((service) => (
                <ServiceRow key={service.id} service={service} />
              ))}

              {!filteredServices.length && (
                <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
                  No services found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM INFO CARDS */}
        <div className="grid gap-2 lg:grid-cols-3">
          <InfoCard
            title="Internal Workflow"
            description="ERP-managed stages such as Medical, MOFA, Visa and Flight."
            icon={Activity}
            footer={
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {internalCount} services connected to workflow
              </>
            }
          />

          <InfoCard
            title="External Providers"
            description="Keep provider relationships separate from your ERP stages."
            icon={Building2}
            footer={
              <>
                <Globe2 className="h-3.5 w-3.5" />
                {activeProviders} active provider
                {activeProviders === 1 ? "" : "s"}
              </>
            }
          />

          <InfoCard
            title="Finance Ready"
            description="Designed for future cost and finance event integration."
            icon={WalletCards}
            footer={
              <>
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                Cost → Service → Finance Event
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SERVICE ROW
========================================================= */

function ServiceRow({ service }: { service: ServiceItem }) {
  const isInternal = service.type === "internal";

  return (
    <div className="group flex flex-col gap-2 px-4 py-2 transition hover:bg-muted/30 lg:flex-row lg:items-center lg:gap-3">
      {/* Service */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
          {isInternal ? (
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium leading-tight">{service.name}</p>

            <Badge
              variant={isInternal ? "default" : "secondary"}
              className="px-1.5 py-0 text-[10px]"
            >
              {isInternal ? "Internal" : "External"}
            </Badge>

            {service.status === "active" ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <CircleDot className="h-3 w-3 fill-current" />
                Active
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Inactive
              </span>
            )}
          </div>

          <p className="truncate text-[11px] text-muted-foreground">
            {service.description}
          </p>
        </div>
      </div>

      {/* Service Info */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[480px]">
        <Info label="Category" value={service.category} />
        <Info label="Provider" value={service.provider} />
        <Info label="Cost" value={money.format(service.cost)} />
        <Info label="Finance" value={service.finance ? "Connected" : "Off"} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 lg:w-28 lg:justify-end">
        {service.workflow ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Workflow
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Provider</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />

              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Settings2 className="mr-2 h-4 w-4" />
              Configure
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Providers
            </DropdownMenuItem>

            <DropdownMenuItem>
              <WalletCards className="mr-2 h-4 w-4" />
              Finance Setup
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex h-14 items-center justify-between px-3">
        <div>
          <p className="text-[11px] leading-none text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-lg font-semibold leading-none tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   INFO CARD (bottom cards)
========================================================= */

function InfoCard({
  title,
  description,
  icon: Icon,
  footer,
}: {
  title: string;
  description: string;
  icon: typeof Package;
  footer: ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium">{title}</p>

            <p className="truncate text-[11px] text-muted-foreground">
              {description}
            </p>
          </div>

          <Icon className="h-4 w-4 shrink-0 text-primary" />
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase leading-none tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-medium">{value}</p>
    </div>
  );
}
