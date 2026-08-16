import type { ReactNode } from "react";

interface PageToolbarProps {
  children?: ReactNode;
}

export function PageToolbar({ children }: PageToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {children}
    </div>
  );
}