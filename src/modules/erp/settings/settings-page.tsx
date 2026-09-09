import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Hash,
  Settings2,
  UserRound,
  Users,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { NumberingSettings } from "./components/numbering-settings";
import { DataManagementSection } from "./components/data-management-section";
import { ProfilePage } from "./profile-page";

type SettingsSectionId =
  | "profile"
  | "organization"
  | "users"
  | "workflow"
  | "import-export"
  | "billing"
  | "pricing"
  | "activity-log";

interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

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
    id: "activity-log",
    label: "Activity Log",
    description: "Audit trail of changes across your tenant.",
    icon: Activity,
  },
];

function ComingSoonSection({
  section,
}: {
  section: SettingsSection;
}) {
  const Icon = section.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {section.label}
        </CardTitle>

        <CardDescription>
          {section.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          This section is coming soon.
        </p>
      </CardContent>
    </Card>
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
            Configure and monitor serial numbering used across
            your ERP modules.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Numbering settings are tenant-specific. Existing
            records are never renumbered automatically.
          </p>
        </CardContent>
      </Card>

      <NumberingSettings />
    </div>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "BDT 2,500",
      description:
        "For small agencies getting started.",
    },
    {
      name: "Professional",
      price: "BDT 5,000",
      description:
        "For growing recruitment agencies.",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description:
        "For larger teams and multi-branch operations.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Pricing
        </h2>

        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your agency.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>

              <CardDescription>
                {plan.description}
              </CardDescription>

              <div className="pt-2 text-2xl font-semibold">
                {plan.price}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan details and subscription management will
                be available here.
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

    case "workflow":
      return <WorkflowSection />;

    case "import-export":
      return <DataManagementSection />;

    case "pricing":
      return <PricingSection />;

    case "organization":
    case "users":
    case "billing":
    case "activity-log":
    default: {
      const section = SETTINGS_SECTIONS.find(
        (item) => item.id === sectionId,
      );

      if (!section) return null;

      return (
        <ComingSoonSection section={section} />
      );
    }
  }
}

export function SettingsPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const requestedSection =
    searchParams.get("section") as
      | SettingsSectionId
      | null;

  const isValidSection =
    requestedSection !== null &&
    SETTINGS_SECTIONS.some(
      (section) => section.id === requestedSection,
    );

  const [activeSectionId, setActiveSectionId] =
    useState<SettingsSectionId>(
      isValidSection
        ? requestedSection
        : "workflow",
    );

  useEffect(() => {
    if (isValidSection) {
      setActiveSectionId(requestedSection);
    }
  }, [isValidSection, requestedSection]);

  function selectSection(
    sectionId: SettingsSectionId,
  ) {
    setActiveSectionId(sectionId);

    if (sectionId === "workflow") {
      setSearchParams({});
      return;
    }

    setSearchParams({
      section: sectionId,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* HEADER */}

      <div className="border-b">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
              <Settings2 className="size-4" />
            </div>

            <div>
              <h1 className="text-xl font-semibold">
                Settings
              </h1>

              <p className="text-sm text-muted-foreground">
                Manage your ERP configuration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}

      <div className="flex min-h-0 flex-1">
        {/* LEFT NAV */}

        <nav className="w-56 shrink-0 overflow-y-auto border-r p-3">
          <ul className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;

              const isActive =
                section.id === activeSectionId;

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() =>
                      selectSection(section.id)
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />

                    <span className="truncate">
                      {section.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
            <SettingsSectionContent
              sectionId={activeSectionId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}