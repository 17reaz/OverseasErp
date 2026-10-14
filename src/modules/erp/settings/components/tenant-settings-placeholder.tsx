import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Download,
  GitBranch,
  History,
  UserCog,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { SettingsCard, SettingsSection } from "./settings-ui";

interface TenantSettingsPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function TenantSettingsPlaceholder({
  icon: Icon,
  title,
  description,
}: TenantSettingsPlaceholderProps) {
  return (
    <SettingsSection className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <Badge variant="secondary" className="shrink-0">
        Coming soon
      </Badge>
    </SettingsSection>
  );
}

export function TenantSettingsPlaceholders() {
  return (
    <SettingsCard>
      <TenantSettingsPlaceholder
        icon={UserRound}
        title="Profile"
        description="Manage tenant profile information."
      />

      <TenantSettingsPlaceholder
        icon={Building2}
        title="Organization"
        description="Manage organization information and contact details."
      />

      <TenantSettingsPlaceholder
        icon={UserCog}
        title="Users"
        description="Manage user-related tenant preferences."
      />

      <TenantSettingsPlaceholder
        icon={GitBranch}
        title="Workflow"
        description="Configure candidate workflow behavior."
      />

      <TenantSettingsPlaceholder
        icon={Download}
        title="Import / Export"
        description="Configure data import and export preferences."
      />

      <TenantSettingsPlaceholder
        icon={History}
        title="Updates & History"
        description="View system updates and configuration history."
      />
    </SettingsCard>
  );
}
