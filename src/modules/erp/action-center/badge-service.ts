import {
  deduplicateActionItems,
  getActionItems,
} from "./action-service";

import type {
  ActionModule,
} from "./action-types";

export type ActionBadgeCounts =
  Partial<Record<ActionModule, number>>;

const ROUTE_MODULE_MAP: Record<
  string,
  ActionModule
> = {
  "/app/candidates": "candidate",
  "/app/medical": "medical",
  "/app/mofa": "mofa",
  "/app/fingers": "finger",
  "/app/police-clearance": "police-clearance",
  "/app/takamul": "takamul",
  "/app/visa": "visa",
  "/app/flight": "flight",
  "/app/files": "files",
  "/app/agencies": "agency",
};

export function getActionModuleFromRoute(
  route: string,
): ActionModule | null {
  return ROUTE_MODULE_MAP[route] ?? null;
}

export async function getActionBadgeCounts(): Promise<ActionBadgeCounts> {
  const counts: ActionBadgeCounts = {};

  try {
    const actions = deduplicateActionItems(
      await getActionItems(),
    );

    for (const action of actions) {
      counts[action.module] =
        (counts[action.module] ?? 0) + 1;
    }
  } catch (error) {
    console.error(
      "[Action Badge] Failed to load action counts:",
      error,
    );
  }

  return counts;
}

export function getActionBadgeCount(
  counts: ActionBadgeCounts,
  route: string,
): number {
  const module =
    getActionModuleFromRoute(route);

  if (!module) {
    return 0;
  }

  return counts[module] ?? 0;
}

export function notifyActionBadgeUpdate(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      "overseas-erp:actions-updated",
    ),
  );
}