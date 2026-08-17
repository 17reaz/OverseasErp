import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface FilterBarProps {
  children: ReactNode;

  onReset?: () => void;

  showReset?: boolean;
}

export function FilterBar({
  children,
  onReset,
  showReset = true,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}

      {showReset && onReset && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
        >
          Reset
        </Button>
      )}
    </div>
  );
}