import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileWarning,
  Plane,
  RefreshCw,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import {
  getActionItems,
  sortActionItems,
  deduplicateActionItems,
} from "./action-service";

import { resolveActionTarget } from "./action-resolver";

import type { ActionItem, ActionPriority } from "./action-types";

/**
 * =========================================================
 * ICON
 * =========================================================
 */

function ActionIcon({ action }: { action: ActionItem }) {
  switch (action.type) {
    case "medical_pending":
    case "medical_expiring":
    case "medical_unfit":
      return <Stethoscope className="size-3.5" />;

    case "flight_pending":
      return <Plane className="size-3.5" />;

    case "document_missing":
      return <FileWarning className="size-3.5" />;

    case "candidate_incomplete":
    case "candidate_on_hold":
      return <UserRound className="size-3.5" />;

    case "mofa_pending":
    case "mofa_expiring":
      return <CalendarClock className="size-3.5" />;

    case "visa_pending":
    case "visa_expiring":
      return <CheckCircle2 className="size-3.5" />;

    default:
      return <AlertCircle className="size-3.5" />;
  }
}

/**
 * =========================================================
 * PRIORITY
 * =========================================================
 */

function getPriorityClass(priority: ActionPriority) {
  switch (priority) {
    case "critical":
      return "border-destructive/30 bg-destructive/5 text-destructive";

    case "high":
      return "border-orange-500/30 bg-orange-500/5 text-orange-600";

    case "medium":
      return "border-yellow-500/30 bg-yellow-500/5 text-yellow-700";

    case "low":
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

/**
 * =========================================================
 * ACTION ITEM
 * =========================================================
 */

function ActionCenterItem({
  action,
  onOpen,
}: {
  action: ActionItem;

  onOpen: (action: ActionItem) => void;
}) {
  const candidate = action.candidate;

  return (
    <button
      type="button"
      onClick={() => onOpen(action)}
      title={action.description || undefined}
      className={cn(
        "group flex w-full items-center gap-2.5",
        "rounded-md px-1.5 py-1.5 text-left",
        "transition-colors",
        "hover:bg-muted/50",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      )}
    >
      {/* ICON */}

      <div
        className={cn(
          "flex size-7 shrink-0",
          "items-center justify-center",
          "rounded-full border",
          getPriorityClass(action.priority),
        )}
      >
        <ActionIcon action={action} />
      </div>

      {/* CONTENT */}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium leading-tight">
          {action.title}
        </p>

        {candidate && (
          <p className="truncate text-[11px] text-muted-foreground">
            {candidate.name || "Unknown candidate"}
            {candidate.passportNo && (
              <>
                {" • "}
                <span className="font-mono">{candidate.passportNo}</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* PRIORITY */}

      <span
        className={cn(
          "hidden shrink-0 rounded-full",
          "border px-1.5 py-px",
          "text-[9px] font-medium uppercase",
          "sm:inline-flex",
          getPriorityClass(action.priority),
        )}
      >
        {action.priority}
      </span>

      {/* ARROW */}

      <ArrowRight
        className={cn(
          "size-3.5 shrink-0",
          "text-muted-foreground",
          "transition-transform",
          "group-hover:translate-x-0.5",
        )}
      />
    </button>
  );
}

/**
 * =========================================================
 * MAIN ACTION CENTER
 * =========================================================
 */

export function ActionCenter() {
  const navigate = useNavigate();

  const [actions, setActions] = useState<ActionItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /**
   * -------------------------------------------------------
   * LOAD
   * -------------------------------------------------------
   */

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getActionItems();

      const unique = deduplicateActionItems(data);

      const sorted = sortActionItems(unique);

      setActions(sorted);
    } catch (error) {
      console.error("Failed to load action center:", error);

      setActions([]);

      setError("Failed to load actions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

  /**
   * -------------------------------------------------------
   * OPEN ACTION
   * -------------------------------------------------------
   */

  const handleOpen = useCallback(
    (action: ActionItem) => {
      const target = resolveActionTarget(action);

      if (!target) {
        return;
      }

      /**
       * Candidate profile:
       *
       * /app/candidates/:candidateId
       *
       * Module:
       *
       * /app/medical?candidate=xxx
       */

      if (target.route) {
        const params = new URLSearchParams();

        if (target.screen) {
          params.set("screen", target.screen);
        }

        if (target.recordId) {
          params.set("record", target.recordId);
        }

        /**
         * target.route may already
         * contain ?candidate=xxx
         */
        const separator = target.route.includes("?") ? "&" : "?";

        const finalRoute = params.toString()
          ? `${target.route}${separator}${params.toString()}`
          : target.route;

        navigate(finalRoute);
      }
    },
    [navigate],
  );

  /**
   * -------------------------------------------------------
   * VISIBLE ACTIONS
   * -------------------------------------------------------
   */

  const visibleActions = useMemo(() => actions.slice(0, 6), [actions]);

  /**
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* HEADER */}

      <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          Items that need your attention
          {actions.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-foreground">
              {actions.length}
            </span>
          )}
        </p>

        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          title="Refresh"
          onClick={() => void loadActions()}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* BODY */}

      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="mb-1.5 size-4 text-destructive" />

            <p className="text-xs font-medium">Unable to load actions</p>

            <p className="text-[11px] text-muted-foreground">
              Please try again.
            </p>

            <Button
              className="mt-2 h-7 text-xs"
              size="sm"
              variant="outline"
              onClick={() => void loadActions()}
            >
              Try again
            </Button>
          </div>
        ) : visibleActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="size-4 text-muted-foreground" />
            </div>

            <p className="text-xs font-medium">All caught up</p>

            <p className="text-[11px] text-muted-foreground">
              No actions need your attention right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {visibleActions.map((action) => (
              <ActionCenterItem
                key={action.id}
                action={action}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}

      {!loading && actions.length > 6 && (
        <Button
          variant="ghost"
          className="mt-1 h-7 w-full shrink-0 text-xs"
          onClick={() => navigate("/app/todo")}
        >
          View all actions
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      )}
    </div>
  );
}