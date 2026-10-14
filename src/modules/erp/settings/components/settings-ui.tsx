// src/modules/erp/settings/components/settings-ui.tsx
//
// Shared building blocks so every settings page has the same look:
//
//   <div className="space-y-4">
//     <SettingsPageHeader ... />
//     <SettingsCard>
//       <SettingsSection> ... </SettingsSection>
//       <SettingsSection muted> ... </SettingsSection>
//     </SettingsCard>
//   </div>
//
// This is the layout used by the Billing page.

import type { ComponentType, ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

/* -------------------------------------------------------------------------- */
/* Page header                                                                */
/* -------------------------------------------------------------------------- */

export function SettingsPageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconType;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Card + sections                                                            */
/* -------------------------------------------------------------------------- */

export function SettingsCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("divide-y overflow-hidden", className)}>
      {children}
    </Card>
  );
}

export function SettingsSection({
  children,
  className,
  muted = false,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  /** Subtle tinted background (used for secondary / footer sections). */
  muted?: boolean;
  /** No padding — for tables and lists that go edge to edge. */
  flush?: boolean;
}) {
  return (
    <section className={cn(!flush && "p-5", muted && "bg-muted/20", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: IconType;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </h3>

        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared states                                                              */
/* -------------------------------------------------------------------------- */

export function EmptyMessage({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <p
      className={cn(
        "py-8 text-center text-sm",
        tone === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}
