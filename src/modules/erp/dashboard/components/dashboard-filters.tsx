import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { CalendarDays, Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

const triggerClass =
  "h-8 gap-1 px-2 text-xs transition-colors duration-200";
const activeTriggerClass =
  "border-primary/50 bg-primary/5 text-primary [&_svg]:text-primary";

// Container: children gulo ek ek kore stagger hoye ashbe
const containerVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 26 },
  },
};

export function DashboardFilters({ filters, countries, onChange }: Props) {
  const reduceMotion = useReducedMotion();

  const isActive = {
    dateRange: filters.dateRange !== "all",
    country: filters.country !== "all",
    status: filters.status !== "all",
    stage: filters.stage !== "all",
  };

  const activeCount = Object.values(isActive).filter(Boolean).length;
  const hasFilters = activeCount > 0;

  function update(patch: Partial<DashboardFiltersState>) {
    onChange({ ...filters, ...patch });
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
      variants={containerVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      layout
      className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto rounded-xl border bg-card px-3"
    >
      {/* Filter icon + active count badge */}
      <motion.div
        variants={itemVariants}
        animate={hasFilters ? { backgroundColor: "var(--accent)" } : undefined}
        className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"
      >
        <motion.div
          key={activeCount}
          initial={reduceMotion ? false : { scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
        >
          <Filter
            className={cn(
              "size-4 transition-colors",
              hasFilters ? "text-primary" : "text-muted-foreground"
            )}
          />
        </motion.div>

        <AnimatePresence>
          {hasFilters && (
            <motion.span
              key="count"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={activeCount}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeCount}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Date */}
      <motion.div
        variants={itemVariants}
        whileTap={{ scale: 0.97 }}
        className="shrink-0"
      >
        <Select
          value={filters.dateRange}
          onValueChange={(value: DashboardDateRange) =>
            update({ dateRange: value })
          }
        >
          <SelectTrigger
            className={cn(
              triggerClass,
              "w-[125px]",
              isActive.dateRange && activeTriggerClass
            )}
          >
            <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Country */}
      <motion.div
        variants={itemVariants}
        whileTap={{ scale: 0.97 }}
        className="shrink-0"
      >
        <Select
          value={filters.country}
          onValueChange={(value) => update({ country: value })}
        >
          <SelectTrigger
            className={cn(
              triggerClass,
              "w-[120px]",
              isActive.country && activeTriggerClass
            )}
          >
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
      </motion.div>

      {/* Status */}
      <motion.div
        variants={itemVariants}
        whileTap={{ scale: 0.97 }}
        className="shrink-0"
      >
        <Select
          value={filters.status}
          onValueChange={(value: DashboardStatus) => update({ status: value })}
        >
          <SelectTrigger
            className={cn(
              triggerClass,
              "w-[110px]",
              isActive.status && activeTriggerClass
            )}
          >
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
      </motion.div>

      {/* Stage */}
      <motion.div
        variants={itemVariants}
        whileTap={{ scale: 0.97 }}
        className="shrink-0"
      >
        <Select
          value={filters.stage}
          onValueChange={(value: DashboardStage) => update({ stage: value })}
        >
          <SelectTrigger
            className={cn(
              triggerClass,
              "w-[110px]",
              isActive.stage && activeTriggerClass
            )}
          >
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
      </motion.div>

      {/* Reset */}
      <AnimatePresence initial={false}>
        {hasFilters && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, width: 0, scale: 0.8 }}
            animate={{ opacity: 1, width: "auto", scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            whileHover="hover"
            whileTap={{ scale: 0.94 }}
            className="shrink-0 overflow-hidden"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={reset}
            >
              <motion.span
                variants={{ hover: { rotate: -180 } }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="flex"
              >
                <RotateCcw className="size-3.5" />
              </motion.span>
              Reset
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}