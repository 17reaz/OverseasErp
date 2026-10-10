// src/modules/erp/visa/components/visa-pending.tsx

import {
  Check,
  Circle,
  FileCheck2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type {
  VisaEligibleMofa,
} from "../visa-service";

interface VisaPendingProps {
  items: VisaEligibleMofa[];
  loading?: boolean;
  onAddVisa?: (item: VisaEligibleMofa) => void;
}

function StatusBadge({
  value,
}: {
  value: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={
        value
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }
    >
      {value ? (
        <Check className="mr-1 h-3.5 w-3.5" />
      ) : (
        <Circle className="mr-1 h-3 w-3" />
      )}
      {value ? "Complete" : "Pending"}
    </Badge>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function VisaPending({
  items,
  loading = false,
  onAddVisa,
}: VisaPendingProps) {
  return (
    <div className="flex h-[calc(100vh-250px)] min-h-[400px] flex-col overflow-hidden rounded-lg border bg-background">
      <div className="shrink-0 overflow-x-auto border-b bg-background">
        <table className="w-full min-w-[1050px] table-fixed">
          <thead>
            <tr className="text-left">
              <th className="w-[60px] px-4 py-3 text-sm font-medium">SL</th>
              <th className="w-[190px] px-4 py-3 text-sm font-medium">Candidate</th>
              <th className="w-[140px] px-4 py-3 text-sm font-medium">Passport</th>
              <th className="w-[125px] px-4 py-3 text-sm font-medium">Medical Fit</th>
              <th className="w-[140px] px-4 py-3 text-sm font-medium">MOFA</th>
              <th className="w-[115px] px-4 py-3 text-sm font-medium">PC</th>
              <th className="w-[115px] px-4 py-3 text-sm font-medium">Finger</th>
              <th className="w-[115px] px-4 py-3 text-sm font-medium">Takamul</th>
              <th className="w-[110px] px-4 py-3 text-right text-sm font-medium">Action</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            Loading eligible candidates...
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
            <FileCheck2 className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              No candidates waiting for visa
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Candidates with valid medical and no visa will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[1050px] table-fixed">
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b transition-colors hover:bg-muted/40"
                >
                  <td className="w-[60px] px-4 py-3 text-sm">
                    {item.candidate.sl ?? index + 1}
                  </td>

                  <td className="w-[190px] px-4 py-3">
                    <span className="block truncate text-sm font-medium">
                      {item.candidate.name}
                    </span>
                  </td>

                  <td className="w-[140px] px-4 py-3 font-mono text-sm">
                    <span className="block truncate">
                      {item.candidate.passport_no || "—"}
                    </span>
                  </td>

                  <td className="w-[125px] px-4 py-3 text-sm">
                    {formatDate(item.fit_date)}
                  </td>

                  <td className="w-[140px] px-4 py-3 text-sm">
                    <span className="block truncate">
                      {item.application_number || "—"}
                    </span>
                  </td>

                  <td className="w-[115px] px-4 py-3">
                    <StatusBadge
                      value={item.police_clearance_verified}
                    />
                  </td>

                  <td className="w-[115px] px-4 py-3">
                    <StatusBadge value={item.finger_completed} />
                  </td>

                  <td className="w-[115px] px-4 py-3">
                    <StatusBadge value={item.takamul_completed} />
                  </td>

                  <td className="w-[110px] px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => onAddVisa?.(item)}
                    >
                      <FileCheck2 className="mr-2 h-4 w-4" />
                      Visa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
