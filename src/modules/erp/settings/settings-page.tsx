import type { ComponentType } from "react";
import {
  Activity,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Globe2,
  Hash,
  History,
  MonitorCog,
  Phone,
  Receipt,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Workflow as WorkflowIcon,
  Binary,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePermissions } from "@/lib/permissions/use-permissions";
import { cn } from "@/lib/utils";

import { AuditSection } from "./audit/audit-section";
import { CountrySettings1 } from "./components/country1-settings";
import { DataManagementSection } from "./components/data-management-section";
import { NumberDisplaySettings } from "./components/number-display-settings";
import { NumberingSettings } from "./components/numbering-settings";
import { TenantSettingsPlaceholders } from "./components/tenant-settings-placeholder";
import { UsageMonitoring } from "./components/usage-monitoring";
import { UsersSection } from "./components/users-section";
import { LoginActivity } from "./login-activity";
import { ProfilePage } from "./profile-page";
import { SupportPage } from "./support-page";
import { UpdatesSection } from "./updates/updates-section";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SettingsSectionId =
  | "profile"
  | "organization"
  | "country-configuration"
  | "users"
  | "workflow"
  | "number-display"
  | "support"
  | "import-export"
  | "billing"
  | "pricing"
  | "updates"
  | "activity-log"
  | "login-activity"
  | "usage-monitoring";

type Permission = Parameters<ReturnType<typeof usePermissions>["can"]>[0];

interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission;
}

interface SettingsGroup {
  label: string;
  sections: SettingsSection[];
}

/* -------------------------------------------------------------------------- */
/* Static data                                                                */
/* -------------------------------------------------------------------------- */

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Account",
    sections: [
      {
        id: "profile",
        label: "Profile",
        description: "Your account information and access details.",
        icon: UserRound,
      },
      {
        id: "support",
        label: "Support",
        description: "Get help and contact our support team.",
        icon: Phone,
      },
    ],
  },
  {
    label: "Workspace",
    sections: [
      {
        id: "organization",
        label: "Organization",
        description: "Company profile, branding, and locale.",
        icon: Building2,
      },
      {
        id: "country-configuration",
        label: "Countries",
        description: "Configure countries and their available ERP modules.",
        icon: Globe2,
      },
      {
        id: "users",
        label: "Users",
        description: "Team members, roles, and access.",
        icon: Users,
      },
    ],
  },
  {
    label: "Configuration",
    sections: [
      {
        id: "workflow",
        label: "Workflow",
        description: "Numbering and process configuration.",
        icon: WorkflowIcon,
      },
      {
        id: "number-display",
        label: "Number display",
        description: "Control how numbers are displayed across the ERP.",
        icon: Binary,
      },
      {
        id: "import-export",
        label: "Import / Export",
        description: "Backups, bulk import, and data export.",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Plan & billing",
    sections: [
      {
        id: "billing",
        label: "Billing",
        description: "Plan, invoices, and payment method.",
        icon: Receipt,
      },
      {
        id: "pricing",
        label: "Pricing",
        description: "View plans and subscription options.",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Security & monitoring",
    sections: [
      {
        id: "activity-log",
        label: "Activity log",
        description: "Audit trail of changes across your tenant.",
        icon: ShieldCheck,
      },
      {
        id: "login-activity",
        label: "Login activity",
        description: "Recent login sessions and device activity.",
        icon: Activity,
      },
      {
        id: "usage-monitoring",
        label: "Usage & monitoring",
        description: "Usage, performance, storage, and system health.",
        icon: MonitorCog,
      },
    ],
  },
  {
    label: "Product",
    sections: [
      {
        id: "updates",
        label: "Updates & history",
        description: "Release notes and commit history.",
        icon: History,
      },
    ],
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
/* Section components (unchanged behaviour)                                   */
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
            Manage your organization profile, locale, and available countries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Organization-level settings are tenant-specific.
          </p>
        </CardContent>
      </Card>
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
            Numbering settings are tenant-specific. Existing records are never
            renumbered automatically.
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
              <div className="pt-2 text-2xl font-semibold">{plan.price}</div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan details and subscription management will be available
                here.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsSectionContent({
  section,
}: {
  section: SettingsSection;
}) {
  switch (section.id) {
    case "profile":
      return <ProfilePage />;
    case "organization":
      return <OrganizationSection />;
    case "country-configuration":
      return <CountrySettings1 />;
    case "users":
      return <UsersSection />;
    case "workflow":
      return <WorkflowSection />;
    case "number-display":
      return <NumberDisplaySettings />;
    case "support":
      return <SupportPage />;
    case "import-export":
      return <DataManagementSection />;
    case "pricing":
      return <PricingSection />;
    case "updates":
      return <UpdatesSection />;
    case "activity-log":
      return <AuditSection />;
    case "login-activity":
      return <LoginActivity />;
    case "usage-monitoring":
      return <UsageMonitoring />;
    default:
      return <ComingSoonSection section={section} />;
  }
}

/* -------------------------------------------------------------------------- */
/* Second sidebar                                                             */
/* -------------------------------------------------------------------------- */

interface SettingsNavProps {
  groups: SettingsGroup[];
  activeId: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}

function SettingsSidebar({ groups, activeId, onSelect }: SettingsNavProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
      <ScrollArea className="h-full">
        <nav aria-label="Settings" className="space-y-5 p-3">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>

              {group.sections.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeId;

                return (
                  <Button
                    key={section.id}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(section.id)}
                    className={cn(
                      "w-full justify-start gap-2 px-3 font-normal",
                      isActive
                        ? "font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </Button>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

/** Mobile fallback: horizontal scrollable pills */
function SettingsTopNav({ groups, activeId, onSelect }: SettingsNavProps) {
  const sections = groups.flatMap((group) => group.sections);

  return (
    <div className="border-b md:hidden">
      <ScrollArea className="w-full">
        <nav aria-label="Settings" className="flex gap-1 p-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeId;

            return (
              <Button
                key={section.id}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelect(section.id)}
                className="shrink-0 gap-2"
              >
                <Icon className="size-4" />
                {section.label}
              </Button>
            );
          })}
        </nav>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const visibleGroups = SETTINGS_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.filter(
      (section) => !section.permission || can(section.permission),
    ),
  })).filter((group) => group.sections.length > 0);

  const visibleSections = visibleGroups.flatMap((group) => group.sections);

  const defaultSectionId: SettingsSectionId =
    visibleSections.find((section) => section.id === "workflow")?.id ??
    visibleSections[0]?.id ??
    "profile";

  // The URL is the single source of truth — no extra state or effect needed.
  const requestedSection = searchParams.get("section");
  const activeSection =
    visibleSections.find((section) => section.id === requestedSection) ??
    visibleSections.find((section) => section.id === defaultSectionId) ??
    visibleSections[0];

  function selectSection(sectionId: SettingsSectionId) {
    setSearchParams({ section: sectionId });
  }

  if (!activeSection) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
     

      <SettingsTopNav
        groups={visibleGroups}
        activeId={activeSection.id}
        onSelect={selectSection}
      />

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <SettingsSidebar
          groups={visibleGroups}
          activeId={activeSection.id}
          onSelect={selectSection}
        />

        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
            <SettingsSectionContent section={activeSection} />
          </div>
        </main>
      </div>
    </div>
  );
}
