import {
  getCandidates,
} from "@/modules/erp/candidates/candidate-service";

import {
  getCandidatesWithoutMedical,
} from "@/modules/erp/medical/medical-service";

import type {
  ActionItem,
} from "./action-types";


async function getCandidateActions(): Promise<
  ActionItem[]
> {
  const candidates =
    await getCandidates();

  return candidates
    .filter(
      (candidate) => {
        /**
         * Put your real candidate
         * attention rules here.
         */
        return false;
      },
    )
    .map(
      (candidate) => ({
        id: `candidate-${candidate.id}`,

        type: "candidate_incomplete",

        title:
          "Candidate needs attention",

        description:
          "Review this candidate profile.",

        priority: "medium",

        module: "candidate",

        candidate: {
          id: candidate.id,
          sl: candidate.sl,
          name: candidate.name,
          passportNo:
            candidate.passport_no,
        },

        target: {
          module: "candidate",
          route: `/app/candidates/${candidate.id}`,
          candidateId:
            candidate.id,
          screen: "details",
        },

        createdAt:
          candidate.updated_at ??
          candidate.created_at,
      }),
    );
}


async function getMedicalActions(): Promise<
  ActionItem[]
> {
  const {
    data,
    error,
  } =
    await getCandidatesWithoutMedical();

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (candidate) => ({
      id: `medical-pending-${candidate.id}`,

      type: "medical_pending",

      title:
        "Medical pending",

      description:
        "Candidate is ready for medical processing.",

      priority: "high",

      module: "medical",

      candidate: {
        id: candidate.id,
        name: candidate.name,
        passportNo:
          candidate.passport_no,
      },

      target: {
        module: "medical",
        route: "/app/medical",
        candidateId:
          candidate.id,
        screen: "process",
      },

      createdAt:
        new Date().toISOString(),
    }),
  );
}


/**
 * =========================================================
 * MAIN AGGREGATOR
 * =========================================================
 */

export async function getActionItems(): Promise<
  ActionItem[]
> {
  const [
    candidateActions,
    medicalActions,
  ] =
    await Promise.all([
      getCandidateActions(),
      getMedicalActions(),
    ]);

  return [
    ...candidateActions,
    ...medicalActions,
  ];
}


/**
 * =========================================================
 * SORT
 * =========================================================
 */

export function sortActionItems(
  actions: ActionItem[],
): ActionItem[] {
  const priorityWeight: Record<
    ActionItem["priority"],
    number
  > = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...actions].sort(
    (a, b) =>
      priorityWeight[b.priority] -
      priorityWeight[a.priority],
  );
}


/**
 * =========================================================
 * DEDUPLICATE
 * =========================================================
 */

export function deduplicateActionItems(
  actions: ActionItem[],
): ActionItem[] {
  const map =
    new Map<string, ActionItem>();

  for (const action of actions) {
    map.set(
      action.id,
      action,
    );
  }

  return Array.from(
    map.values(),
  );
}