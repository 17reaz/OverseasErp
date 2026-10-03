import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Download,
  GitBranch,
  History,
  UserCog,
  UserRound,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md border">
          <Icon className="size-4" />
        </div>

        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Coming soon
        </div>
      </CardContent>
    </Card>
  );
}

export function TenantSettingsPlaceholders() {
  return (
    <div className="grid gap-4">
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
    </div>
  );
}