import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileWarning,
  Plane,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  cn,
} from "@/lib/utils";

import {
  getActionItems,
  sortActionItems,
  deduplicateActionItems,
} from "./action-service";

import {
  resolveActionTarget,
} from "./action-resolver";

import type {
  ActionItem,
  ActionPriority,
} from "./action-types";


/**
 * =========================================================
 * ICON
 * =========================================================
 */

function ActionIcon({
  action,
}: {
  action: ActionItem;
}) {
  switch (action.type) {
    case "medical_pending":
    case "medical_expiring":
    case "medical_unfit":
      return (
        <Stethoscope
          className="size-4"
        />
      );

    case "flight_pending":
      return (
        <Plane
          className="size-4"
        />
      );

    case "document_missing":
      return (
        <FileWarning
          className="size-4"
        />
      );

    case "candidate_incomplete":
    case "candidate_on_hold":
      return (
        <UserRound
          className="size-4"
        />
      );

    case "mofa_pending":
    case "mofa_expiring":
      return (
        <CalendarClock
          className="size-4"
        />
      );

    case "visa_pending":
    case "visa_expiring":
      return (
        <CheckCircle2
          className="size-4"
        />
      );

    default:
      return (
        <AlertCircle
          className="size-4"
        />
      );
  }
}


/**
 * =========================================================
 * PRIORITY
 * =========================================================
 */

function getPriorityClass(
  priority: ActionPriority,
) {
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

  onOpen: (
    action: ActionItem,
  ) => void;
}) {
  const candidate =
    action.candidate;

  return (
    <button
      type="button"
      onClick={() =>
        onOpen(action)
      }
      className={cn(
        "group flex w-full items-center gap-3",
        "rounded-lg border bg-background",
        "p-3 text-left",
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
          "flex size-9 shrink-0",
          "items-center justify-center",
          "rounded-full border",
          getPriorityClass(
            action.priority,
          ),
        )}
      >
        <ActionIcon
          action={action}
        />
      </div>

      {/* CONTENT */}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {action.title}
          </p>

          <span
            className={cn(
              "hidden shrink-0 rounded-full",
              "border px-1.5 py-0.5",
              "text-[10px] font-medium uppercase",
              "sm:inline-flex",
              getPriorityClass(
                action.priority,
              ),
            )}
          >
            {action.priority}
          </span>
        </div>

        {candidate && (
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">
              {candidate.name ||
                "Unknown candidate"}
            </span>

            {candidate.passportNo && (
              <>
                <span>•</span>

                <span className="shrink-0">
                  {candidate.passportNo}
                </span>
              </>
            )}
          </div>
        )}

        {action.description && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {action.description}
          </p>
        )}
      </div>

      {/* ARROW */}

      <ArrowRight
        className={cn(
          "size-4 shrink-0",
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
  const navigate =
    useNavigate();

  const [
    actions,
    setActions,
  ] = useState<ActionItem[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  /**
   * -------------------------------------------------------
   * LOAD
   * -------------------------------------------------------
   */

  const loadActions =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError(null);

          const data =
            await getActionItems();

          const unique =
            deduplicateActionItems(
              data,
            );

          const sorted =
            sortActionItems(
              unique,
            );

          setActions(
            sorted,
          );
        } catch (error) {
          console.error(
            "Failed to load action center:",
            error,
          );

          setActions([]);

          setError(
            "Failed to load actions.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadActions();
  }, [
    loadActions,
  ]);


  /**
   * -------------------------------------------------------
   * OPEN ACTION
   * -------------------------------------------------------
   */

  const handleOpen =
    useCallback(
      (
        action: ActionItem,
      ) => {
        const target =
          resolveActionTarget(
            action,
          );

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

        if (
          target.route
        ) {
          const params =
            new URLSearchParams();

          if (
            target.screen
          ) {
            params.set(
              "screen",
              target.screen,
            );
          }

          if (
            target.recordId
          ) {
            params.set(
              "record",
              target.recordId,
            );
          }

          /**
           * target.route may already
           * contain ?candidate=xxx
           */
          const separator =
            target.route.includes(
              "?",
            )
              ? "&"
              : "?";

          const finalRoute =
            params.toString()
              ? `${target.route}${separator}${params.toString()}`
              : target.route;

          navigate(
            finalRoute,
          );
        }
      },
      [
        navigate,
      ],
    );


  /**
   * -------------------------------------------------------
   * VISIBLE ACTIONS
   * -------------------------------------------------------
   */

  const visibleActions =
    useMemo(
      () =>
        actions.slice(
          0,
          6,
        ),
      [
        actions,
      ],
    );


  /**
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between"
      >
        <div>
          <CardTitle className="text-base">
            Action Center
          </CardTitle>

          <p className="mt-1 text-xs text-muted-foreground">
            Items that need your attention
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actions.length >
            0 && (
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
              {actions.length}
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void loadActions()
            }
            disabled={loading}
          >
            <Clock3 className="mr-1.5 size-3.5" />

            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-lg bg-muted"
                />
              ),
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-2 size-5 text-destructive" />

            <p className="text-sm font-medium">
              Unable to load actions
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Please try again.
            </p>

            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() =>
                void loadActions()
              }
            >
              Try again
            </Button>
          </div>
        ) : visibleActions.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="size-5 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
              All caught up
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              No actions need your attention right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleActions.map(
              (
                action,
              ) => (
                <ActionCenterItem
                  key={action.id}
                  action={action}
                  onOpen={
                    handleOpen
                  }
                />
              ),
            )}
          </div>
        )}

        {!loading &&
          actions.length >
            6 && (
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={() =>
                navigate(
                  "/app/todo",
                )
              }
            >
              View all actions
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          )}
      </CardContent>
    </Card>
  );
}