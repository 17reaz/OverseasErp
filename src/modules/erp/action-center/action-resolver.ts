import type {
  ActionItem,
  ActionTarget,
} from "./action-types";

/**
 * Resolves an action into the exact ERP destination.
 *
 * IMPORTANT:
 * Do not put navigation logic inside ActionCenter UI.
 *
 * ActionCenter only asks:
 *
 *     "Where should this action go?"
 *
 * This resolver answers that question.
 */
export function resolveActionTarget(
  action: ActionItem,
): ActionTarget | null {
  switch (action.type) {
    /**
     * ======================================================
     * CANDIDATE
     * ======================================================
     */

    case "candidate_incomplete":
      return {
        module: "candidate",
        route: buildCandidateRoute(
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        screen: "details",
      };

    case "candidate_on_hold":
      return {
        module: "candidate",
        route: buildCandidateRoute(
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        screen: "details",
      };

    /**
     * ======================================================
     * MEDICAL
     * ======================================================
     */

    case "medical_pending":
      return {
        module: "medical",
        route: buildModuleRoute(
          "medical",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    case "medical_expiring":
      return {
        module: "medical",
        route: buildModuleRoute(
          "medical",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "details",
      };

    case "medical_unfit":
      return {
        module: "medical",
        route: buildModuleRoute(
          "medical",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "details",
      };

    /**
     * ======================================================
     * MOFA
     * ======================================================
     */

    case "mofa_pending":
      return {
        module: "mofa",
        route: buildModuleRoute(
          "mofa",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    case "mofa_expiring":
      return {
        module: "mofa",
        route: buildModuleRoute(
          "mofa",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "details",
      };

    /**
     * ======================================================
     * FINGER
     * ======================================================
     */

    case "finger_pending":
      return {
        module: "finger",
        route: buildModuleRoute(
          "finger",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    /**
     * ======================================================
     * POLICE CLEARANCE
     * ======================================================
     */

    case "police_clearance_pending":
      return {
        module: "police-clearance",
        route: buildModuleRoute(
          "police-clearance",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    /**
     * ======================================================
     * TAKAMUL
     * ======================================================
     */

    case "takamul_pending":
      return {
        module: "takamul",
        route: buildModuleRoute(
          "takamul",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    /**
     * ======================================================
     * VISA
     * ======================================================
     */

    case "visa_pending":
      return {
        module: "visa",
        route: buildModuleRoute(
          "visa",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    case "visa_expiring":
      return {
        module: "visa",
        route: buildModuleRoute(
          "visa",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "details",
      };

    /**
     * ======================================================
     * FLIGHT
     * ======================================================
     */

    case "flight_pending":
      return {
        module: "flight",
        route: buildModuleRoute(
          "flight",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "process",
      };

    /**
     * ======================================================
     * DOCUMENTS
     * ======================================================
     */

    case "document_missing":
      return {
        module: "files",
        route: buildModuleRoute(
          "files",
          action.candidate?.id,
        ),
        candidateId: action.candidate?.id,
        recordId: action.target.recordId,
        screen: "documents",
      };

    default:
      return action.target ?? null;
  }
}


/**
 * Candidate profile route.
 */
function buildCandidateRoute(
  candidateId?: string,
): string {
  if (!candidateId) {
    return "/app/candidates";
  }

  return `/app/candidates/${encodeURIComponent(
    candidateId,
  )}`;
}


/**
 * Module route.
 *
 * The candidate context is placed in the URL
 * so it survives refresh / direct navigation.
 *
 * Example:
 *
 * /app/medical?candidate=abc123&screen=process
 */
function buildModuleRoute(
  module:
    | "medical"
    | "mofa"
    | "finger"
    | "police-clearance"
    | "takamul"
    | "visa"
    | "flight"
    | "files",
  candidateId?: string,
): string {
  const baseRoutes: Record<string, string> = {
    medical: "/app/medical",
    mofa: "/app/mofa",
    finger: "/app/fingers",
    "police-clearance": "/app/police-clearance",
    takamul: "/app/takamul",
    visa: "/app/visa",
    flight: "/app/flight",
    files: "/app/files",
  };

  const route =
    baseRoutes[module] ?? "/app/dashboard";

  if (!candidateId) {
    return route;
  }

  const params = new URLSearchParams();

  params.set(
    "candidate",
    candidateId,
  );

  return `${route}?${params.toString()}`;
}