import { Fragment } from "react";
import {
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowActionItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
}

interface RowActionsProps {
  actions: RowActionItem[];
  label?: string;
  disabled?: boolean;
  contentClassName?: string;
  triggerIcon?: LucideIcon;
}

export function RowActions({
  actions,
  label = "Open row actions",
  disabled = false,
  contentClassName = "min-w-40",
  triggerIcon: TriggerIcon = MoreHorizontal,
}: RowActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={label}
          className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <TriggerIcon className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={contentClassName}
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Fragment key={action.key}>
              {action.separatorBefore && (
                <DropdownMenuSeparator />
              )}

              <DropdownMenuItem
                disabled={action.disabled || disabled}
                variant={
                  action.destructive
                    ? "destructive"
                    : "default"
                }
                onSelect={action.onSelect}
              >
                {Icon && (
                  <Icon className="size-4 shrink-0" />
                )}

                <span>{action.label}</span>
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
