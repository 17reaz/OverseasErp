import { useMemo, useState } from "react";
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

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type ServiceType = "internal" | "external";

type ServiceStatus =
  | "active"
  | "inactive";

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

const money = new Intl.NumberFormat(
  "en-BD",
  {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  },
);

/* =========================================================
   PAGE
========================================================= */

export function TasksPage() {
  const [tab, setTab] = useState<
    "all" | ServiceType
  >("all");

  const [search, setSearch] =
    useState("");

  const filteredServices = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesTab =
        tab === "all" ||
        service.type === tab;

      const matchesSearch =
        !query ||
        service.name
          .toLowerCase()
          .includes(query) ||
        service.category
          .toLowerCase()
          .includes(query) ||
        service.provider
          .toLowerCase()
          .includes(query);

      return (
        matchesTab &&
        matchesSearch
      );
    });
  }, [search, tab]);

  const internalCount =
    services.filter(
      (item) =>
        item.type === "internal",
    ).length;

  const externalCount =
    services.filter(
      (item) =>
        item.type === "external",
    ).length;

  const activeProviders =
    new Set(
      services
        .filter(
          (item) =>
            item.type === "external" &&
            item.status === "active",
        )
        .map(
          (item) => item.provider,
        ),
    ).size;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-5 px-6 py-5">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Services
                </h1>

                <p className="text-sm text-muted-foreground">
                  Manage your internal services and
                  external providers.
                </p>
              </div>

            </div>
          </div>

          <Button>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* =================================================
            KPI
        ================================================= */}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

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

        {/* =================================================
            SERVICE DIRECTORY
        ================================================= */}

        <Card className="overflow-hidden">

          <CardHeader className="border-b pb-4">

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <CardTitle className="text-base">
                  Service Directory
                </CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Configure how services are handled
                  inside the ERP.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                {/* Search */}

                <div className="relative w-full sm:w-64">

                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search services..."
                    className="pl-9"
                  />

                </div>

                {/* Filter */}

                <Button
                  variant="outline"
                  size="icon"
                  title="Filters"
                >
                  <Filter className="h-4 w-4" />
                </Button>

              </div>
            </div>

            {/* Tabs */}

            <Tabs
              value={tab}
              onValueChange={(value) =>
                setTab(
                  value as
                    | "all"
                    | ServiceType,
                )
              }
            >
              <TabsList>

                <TabsTrigger value="all">
                  All Services
                </TabsTrigger>

                <TabsTrigger value="internal">
                  Internal
                </TabsTrigger>

                <TabsTrigger value="external">
                  External Providers
                </TabsTrigger>

              </TabsList>
            </Tabs>

          </CardHeader>

          {/* =================================================
              SERVICE LIST
          ================================================= */}

          <CardContent className="p-0">

            <div className="divide-y">

              {filteredServices.map(
                (service) => (
                  <div
                    key={service.id}
                    className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-muted/30 lg:flex-row lg:items-center"
                  >

                    {/* Service */}

                    <div className="flex min-w-0 flex-1 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">

                        {service.type ===
                        "internal" ? (
                          <Stethoscope className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}

                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-medium">
                            {service.name}
                          </p>

                          <Badge
                            variant={
                              service.type ===
                              "internal"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {service.type ===
                            "internal"
                              ? "Internal"
                              : "External"}
                          </Badge>

                          {service.status ===
                          "active" ? (
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

                        <p className="truncate text-xs text-muted-foreground">
                          {service.description}
                        </p>

                      </div>
                    </div>

                    {/* Service Info */}

                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:w-[520px]">

                      <Info
                        label="Category"
                        value={
                          service.category
                        }
                      />

                      <Info
                        label="Provider"
                        value={
                          service.provider
                        }
                      />

                      <Info
                        label="Cost"
                        value={money.format(
                          service.cost,
                        )}
                      />

                      <Info
                        label="Finance"
                        value={
                          service.finance
                            ? "Connected"
                            : "Off"
                        }
                      />

                    </div>

                    {/* Actions */}

                    <div className="flex items-center justify-between gap-3 lg:w-28 lg:justify-end">

                      {service.workflow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Workflow
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Provider
                        </span>
                      )}

                      <DropdownMenu>

                        <DropdownMenuTrigger
                          asChild
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal className="h-4 w-4" />

                            <span className="sr-only">
                              Open actions
                            </span>
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
                ),
              )}

              {!filteredServices.length && (
                <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                  No services found.
                </div>
              )}

            </div>

          </CardContent>
        </Card>

        {/* =================================================
            BOTTOM INFO CARDS
        ================================================= */}

        <div className="grid gap-3 lg:grid-cols-3">

          {/* Internal Workflow */}

          <Card>
            <CardContent className="p-5">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Internal Workflow
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    ERP-managed stages such as
                    Medical, MOFA, Visa and Flight.
                  </p>
                </div>

                <Activity className="h-5 w-5 text-primary" />

              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">

                <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                {internalCount} services connected
                to workflow

              </div>

            </CardContent>
          </Card>

          {/* External Providers */}

          <Card>
            <CardContent className="p-5">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium">
                    External Providers
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Keep provider relationships
                    separate from your ERP stages.
                  </p>
                </div>

                <Building2 className="h-5 w-5 text-primary" />

              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">

                <Globe2 className="h-4 w-4" />

                {activeProviders} active provider
                {activeProviders === 1
                  ? ""
                  : "s"}

              </div>

            </CardContent>
          </Card>

          {/* Finance */}

          <Card>
            <CardContent className="p-5">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Finance Ready
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Designed for future cost and
                    finance event integration.
                  </p>
                </div>

                <WalletCards className="h-5 w-5 text-primary" />

              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">

                <ArrowUpRight className="h-4 w-4 text-primary" />

                Cost → Service → Finance Event

              </div>

            </CardContent>
          </Card>

        </div>

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
    <Card>

      <CardContent className="flex h-[76px] items-center justify-between px-4">

        <div>

          <p className="text-[11px] text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-xl font-semibold tracking-tight">
            {value}
          </p>

        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">

          <Icon className="h-4 w-4 text-muted-foreground" />

        </div>

      </CardContent>

    </Card>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">

      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium">
        {value}
      </p>

    </div>
  );
}