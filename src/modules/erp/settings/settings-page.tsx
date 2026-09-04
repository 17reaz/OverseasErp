// src/modules/erp/settings/settings-page.tsx

import { useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Hash,
  Settings2,
  Users,
  Workflow as WorkflowIcon,
} from "lucide-react";

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

/* =========================================================
   SECTIONS
   ---------------------------------------------------------
   This list IS the settings navigation. Adding a new settings
   area later means adding one entry here (+ its content branch
   in <SettingsSectionContent />) — the layout/nav never needs
   to change again.
========================================================= */

type SettingsSectionId =
  | "organization"
  | "users"
  | "workflow"
  | "import-export"
  | "billing"
  | "activity-log";

interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
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
    id: "activity-log",
    label: "Activity Log",
    description: "Audit trail of changes across your tenant.",
    icon: Activity,
  },
];

/* =========================================================
   COMING SOON PLACEHOLDER
   ---------------------------------------------------------
   Used by any section not implemented yet, so the nav item
   already exists and never has to be re-added later.
========================================================= */

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
            Configure and monitor serial numbering used across your
            ERP modules.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Numbering settings are tenant-specific. Existing records
            are never renumbered automatically.
          </p>
        </CardContent>
      </Card>

      <NumberingSettings />
    </div>
  );
}

function SettingsSectionContent({
  sectionId,
}: {
  sectionId: SettingsSectionId;
}) {
  switch (sectionId) {
    case "workflow":
      return <WorkflowSection />;

    case "import-export":
      return <DataManagementSection />;

    case "organization":
    case "users":
    case "billing":
    case "activity-log":
    default:
      return (
        <ComingSoonSection
          section={
            SETTINGS_SECTIONS.find((s) => s.id === sectionId)!
          }
        />
      );
  }
}

/* =========================================================
   PAGE
========================================================= */

export function SettingsPage() {
  const [activeSectionId, setActiveSectionId] =
    useState<SettingsSectionId>("workflow");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
              <Settings2 className="size-4" />
            </div>

            <div>
              <h1 className="text-xl font-semibold">Settings</h1>

              <p className="text-sm text-muted-foreground">
                Manage your ERP configuration.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* =================================================
            LEFT — SECTION NAV
            ================================================= */}

        <nav className="w-56 shrink-0 overflow-y-auto border-r p-3">
          <ul className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSectionId;

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      `
                        flex
                        w-full
                        items-center
                        gap-2
                        rounded-md
                        px-3
                        py-2
                        text-left
                        text-sm
                        transition-colors
                      `,
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

        {/* =================================================
            RIGHT — SECTION CONTENT
            ================================================= */}

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
            <SettingsSectionContent sectionId={activeSectionId} />
          </div>
        </div>
      </div>
    </div>
  );
}
