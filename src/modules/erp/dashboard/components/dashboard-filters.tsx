import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Filter, RotateCcw } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

export type DashboardDateRange = "all" | "7" | "30" | "90";

export type DashboardStatus =
  | "all"
  | "active"
  | "complete"
  | "returned"
  | "cancelled"
  | "hold";

export type DashboardStage =
  | "all"
  | "medical"
  | "mofa"
  | "finger"
  | "police_clearance"
  | "takamul"
  | "visa"
  | "bmet"
  | "flight"
  | "iqama";

export interface DashboardFiltersState {
  dateRange: DashboardDateRange;
  country: string;
  status: DashboardStatus;
  stage: DashboardStage;
}

interface Props {
  filters: DashboardFiltersState;
  countries: string[];
  onChange: (filters: DashboardFiltersState) => void;
}

const triggerClass = "h-8 gap-1 px-2 text-xs";

export function DashboardFilters({ filters, countries, onChange }: Props) {
  const hasFilters =
    filters.dateRange !== "all" ||
    filters.country !== "all" ||
    filters.status !== "all" ||
    filters.stage !== "all";

  function update(patch: Partial<DashboardFiltersState>) {
    onChange({
      ...filters,
      ...patch,
    });
  }

  function reset() {
    onChange({
      dateRange: "all",
      country: "all",
      status: "all",
      stage: "all",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
      className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto rounded-xl border bg-card px-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <motion.span
          animate={hasFilters ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex"
        >
          <Filter
            className={`h-4 w-4 ${
              hasFilters ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </motion.span>
      </div>

      {/* Date */}
      <Select
        value={filters.dateRange}
        onValueChange={(value: DashboardDateRange) =>
          update({ dateRange: value })
        }
      >
        <SelectTrigger className={`${triggerClass} w-[125px]`}>
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <SelectValue placeholder="Date range" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="7">Last 7 Days</SelectItem>
          <SelectItem value="30">Last 30 Days</SelectItem>
          <SelectItem value="90">Last 90 Days</SelectItem>
        </SelectContent>
      </Select>

      {/* Country */}
      <Select
        value={filters.country}
        onValueChange={(value) => update({ country: value })}
      >
        <SelectTrigger className={`${triggerClass} w-[120px]`}>
          <SelectValue placeholder="Country" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>

          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status}
        onValueChange={(value: DashboardStatus) => update({ status: value })}
      >
        <SelectTrigger className={`${triggerClass} w-[110px]`}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
          <SelectItem value="returned">Returned</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="hold">Hold</SelectItem>
        </SelectContent>
      </Select>

      {/* Stage */}
      <Select
        value={filters.stage}
        onValueChange={(value: DashboardStage) => update({ stage: value })}
      >
        <SelectTrigger className={`${triggerClass} w-[110px]`}>
          <SelectValue placeholder="Stage" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          <SelectItem value="medical">Medical</SelectItem>
          <SelectItem value="mofa">MOFA</SelectItem>
          <SelectItem value="finger">Finger</SelectItem>
          <SelectItem value="police_clearance">PCC</SelectItem>
          <SelectItem value="takamul">Takamul</SelectItem>
          <SelectItem value="visa">Visa</SelectItem>
          <SelectItem value="bmet">BMET / Manpower</SelectItem>
          <SelectItem value="flight">Flight</SelectItem>
          <SelectItem value="iqama">Iqama</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, width: 0, x: -6 }}
            animate={{ opacity: 1, width: "auto", x: 0 }}
            exit={{ opacity: 0, width: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}