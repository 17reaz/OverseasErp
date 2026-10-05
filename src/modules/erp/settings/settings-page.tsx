import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Hash,
  History,
  MonitorCog,
  Globe2,
  Settings2,
  UserRound,
  Users,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { NumberDisplaySettings } from "./components/number-display-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePermissions } from "@/lib/permissions/use-permissions";
import { cn } from "@/lib/utils";

import { AuditSection } from "./audit/audit-section";
import { CountrySettings } from "./components/country-settings";
import { DataManagementSection } from "./components/data-management-section";
import { NumberingSettings } from "./components/numbering-settings";
import { TenantSettingsPlaceholders } from "./components/tenant-settings-placeholder";
import { UsageMonitoring } from "./components/usage-monitoring";
import { UsersSection } from "./components/users-section";
import { LoginActivity } from "./login-activity";
import { ProfilePage } from "./profile-page";
import { UpdatesSection } from "./updates/updates-section";
import { CountrySettings1 } from "./components/country1-settings";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SettingsSectionId =
  | "profile"
  | "organization"
   | "country-configuration"
  | "users"
  | "workflow"
  | "import-export"
  | "billing"
  | "pricing"
  | "updates"
  | "activity-log"
  | "login-activity"
  | "usage-monitoring"
  | "number-display";

type Permission = Parameters<ReturnType<typeof usePermissions>["can"]>[0];

interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission;
}

/* -------------------------------------------------------------------------- */
/* Static data                                                                */
/* -------------------------------------------------------------------------- */

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Your account information and access details.",
    icon: UserRound,
  },
  {
    id: "organization",
    label: "Organization",
    description: "Company profile, branding, and locale.",
    icon: Building2,
  },
    {
    id: "country-configuration",
    label: "Country Configuration",
    description: "Configure countries and their available ERP modules.",
    icon: Globe2,
  },
  {
    id: "users",
    label: "Users",
    description: "Team members, roles, and access.",
    icon: Users,
  },
  {
    id: "workflow",
    label: "Workflow",
    description: "Numbering and process configuration.",
    icon: WorkflowIcon,
  },
  {
    id: "import-export",
    label: "Import / Export",
    description: "Backups, bulk import, and data export.",
    icon: ArrowLeftRight,
  },
  {
    id: "billing",
    label: "Billing",
    description: "Plan, invoices, and payment method.",
    icon: CreditCard,
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "View plans and subscription options.",
    icon: CreditCard,
  },
  {
    id: "updates",
    label: "Updates & History",
    description: "Release notes and commit history.",
    icon: History,
  },
  {
    id: "activity-log",
    label: "Activity Log",
    description: "Audit trail of changes across your tenant.",
    icon: Activity,
  },
  {
    id: "login-activity",
    label: "Login Activity",
    description: "Recent login sessions and device activity.",
    icon: Activity,
  },
  {
    id: "usage-monitoring",
    label: "Usage & Monitoring",
    description: "Usage, performance, storage, and system health.",
    icon: MonitorCog,
  },
  {
  id: "number-display",
  label: "Number Display",
  description: "Control how numbers are displayed across the ERP.",
  icon: Hash,
},
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "BDT 2,500",
    description: "For small agencies getting started.",
  },
  {
    name: "Professional",
    price: "BDT 5,000",
    description: "For growing recruitment agencies.",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger teams and multi-branch operations.",
  },
];

/* -------------------------------------------------------------------------- */
/* Section components                                                         */
/* -------------------------------------------------------------------------- */

function ComingSoonSection({ section }: { section: SettingsSection }) {
  const Icon = section.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {section.label}
        </CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          This section is coming soon.
        </p>
      </CardContent>
    </Card>
  );
}

function OrganizationSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4" />
            Organization
          </CardTitle>
          <CardDescription>
            Manage your organization profile, locale, and available
            countries.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Organization-level settings are tenant-specific.
          </p>
        </CardContent>
      </Card>

      <CountrySettings1 />

      <div className="mt-6">
        <TenantSettingsPlaceholders />
      </div>
    </div>
  );
}

function WorkflowSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="size-4" />
            Numbering
          </CardTitle>
          <CardDescription>
            Configure and monitor serial numbering used across your ERP
            modules.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Numbering settings are tenant-specific. Existing records are
            never renumbered automatically.
          </p>
        </CardContent>
      </Card>

      <NumberingSettings />
    </div>
  );
}

function PricingSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your agency.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-2 text-2xl font-semibold">
                {plan.price}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan details and subscription management will be
                available here.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsSectionContent({
  sectionId,
}: {
  sectionId: SettingsSectionId;
}) {
  switch (sectionId) {
    case "profile":
      return <ProfilePage />;

    case "organization":
      return <OrganizationSection />;

    case "workflow":
      return <WorkflowSection />;

    case "import-export":
      return <DataManagementSection />;

    case "pricing":
      return <PricingSection />;

    case "users":
      return <UsersSection />;
    case "country-configuration":
  return <CountrySettings1 />;
    case "login-activity":
      return <LoginActivity />;

    case "updates":
      return <UpdatesSection />;

    case "billing":
    case "activity-log":
      return <AuditSection />;

    case "usage-monitoring":
      return <UsageMonitoring />;
case "number-display":
  return <NumberDisplaySettings />;
    default: {
      const section = SETTINGS_SECTIONS.find(
        (item) => item.id === sectionId,
      );

      return section ? <ComingSoonSection section={section} /> : null;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const visibleSections = SETTINGS_SECTIONS.filter(
    (section) => !section.permission || can(section.permission),
  );

  const defaultSectionId: SettingsSectionId =
    visibleSections.find((section) => section.id === "workflow")?.id ??
    visibleSections[0]?.id ??
    "profile";

  const requestedSection = searchParams.get(
    "section",
  ) as SettingsSectionId | null;

  const isValidSection =
    requestedSection !== null &&
    visibleSections.some((section) => section.id === requestedSection);

  const [activeSectionId, setActiveSectionId] =
    useState<SettingsSectionId>(
      isValidSection ? requestedSection : defaultSectionId,
    );

  useEffect(() => {
    if (isValidSection && requestedSection) {
      setActiveSectionId(requestedSection);
      return;
    }

    setActiveSectionId(defaultSectionId);
  }, [defaultSectionId, isValidSection, requestedSection]);

  function selectSection(sectionId: SettingsSectionId) {
    setActiveSectionId(sectionId);
    setSearchParams({ section: sectionId });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
              <Settings2 className="size-4" />
            </div>

            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your ERP configuration. reaz 
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav className="w-56 shrink-0 overflow-y-auto border-r p-3">
          <ul className="space-y-1">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSectionId;

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => selectSection(section.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
            <SettingsSectionContent sectionId={activeSectionId} />
          </div>
        </div>
      </div>
    </div>
  );
}
