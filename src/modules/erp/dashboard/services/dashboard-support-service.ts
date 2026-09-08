import { supabase } from "@/lib/supabase/client";

import type {
  DashboardCandidate,
} from "../dashboard-service";

function getMonthLabel(
  date: Date,
): string {
  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
    },
  );
}

function getStartOfMonth(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function getDaysSince(
  dateString: string,
): number {
  const now = new Date();
  const date = new Date(dateString);

  const difference =
    now.getTime() -
    date.getTime();

  return Math.floor(
    difference /
      (1000 * 60 * 60 * 24),
  );
}

export interface DashboardSupportData {
  trend: {
    month: string;
    candidates: number;
  }[];

  aging: {
    label: string;
    count: number;
  }[];

  recentCandidates:
    DashboardCandidate[];

  documentAlerts: {
    title: string;
    description: string;
    count: number;
    level:
      | "critical"
      | "warning"
      | "info";
  }[];
}

export async function getDashboardSupportData(
  activeCandidateIds: {
    id: string;
  }[],
  medicalPending: number,
  mofaPending: number,
  holdCandidatesCount: number,
): Promise<DashboardSupportData> {
  const now = new Date();

  const sixMonthsAgo =
    getStartOfMonth(
      new Date(
        now.getFullYear(),
        now.getMonth() - 5,
        1,
      ),
    );

  const [
    trendCandidatesResult,
    agingCandidatesResult,
    passportFilesResult,
    recentCandidatesResult,
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select("created_at")
      .eq("is_deleted", false)
      .gte(
        "created_at",
        sixMonthsAgo.toISOString(),
      ),

    supabase
      .from("candidates")
      .select("received_date")
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null)
      .not(
        "received_date",
        "is",
        null,
      ),

    supabase
      .from("files")
      .select("candidate_id")
      .eq("is_active", true)
      .eq(
        "doc_type",
        "passport",
      ),

    supabase
      .from("candidates")
      .select(`
        id,
        name,
        passport_no,
        created_at,
        current_stage,
        is_returned,
        workflow_state,
        hold_reason
      `)
      .eq("is_deleted", false)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  const results = [
    trendCandidatesResult,
    agingCandidatesResult,
    passportFilesResult,
    recentCandidatesResult,
  ];

  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
  }

  /* =====================================================
     TREND
  ===================================================== */

  const trendMap =
    new Map<string, number>();

  const trendMeta: {
    key: string;
    month: string;
  }[] = [];

  for (
    let index = 0;
    index < 6;
    index++
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          (5 - index),
        1,
      );

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

    trendMeta.push({
      key,
      month:
        getMonthLabel(date),
    });

    trendMap.set(
      key,
      0,
    );
  }

  for (
    const candidate of
    trendCandidatesResult.data ??
    []
  ) {
    const date =
      new Date(
        candidate.created_at,
      );

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

    if (
      trendMap.has(key)
    ) {
      trendMap.set(
        key,
        (trendMap.get(key) ??
          0) + 1,
      );
    }
  }

  const trend =
    trendMeta.map(
      ({
        key,
        month,
      }) => ({
        month,
        candidates:
          trendMap.get(key) ??
          0,
      }),
    );

  /* =====================================================
     AGING
  ===================================================== */

  const aging = [
    {
      label: "0–3 days",
      count: 0,
    },
    {
      label: "4–7 days",
      count: 0,
    },
    {
      label: "8–14 days",
      count: 0,
    },
    {
      label: "15+ days",
      count: 0,
    },
  ];

  for (
    const candidate of
    agingCandidatesResult.data ??
    []
  ) {
    if (
      !candidate.received_date
    ) {
      continue;
    }

    const days =
      getDaysSince(
        candidate.received_date,
      );

    if (days <= 3) {
      aging[0].count += 1;
    } else if (days <= 7) {
      aging[1].count += 1;
    } else if (days <= 14) {
      aging[2].count += 1;
    } else {
      aging[3].count += 1;
    }
  }

  /* =====================================================
     PASSPORT
  ===================================================== */

  const passportCandidateIds =
    new Set(
      (
        passportFilesResult.data ??
        []
      )
        .map(
          (file) =>
            file.candidate_id,
        )
        .filter(Boolean),
    );

  const missingPassport =
    activeCandidateIds.filter(
      (candidate) =>
        !passportCandidateIds.has(
          candidate.id,
        ),
    ).length;

  /* =====================================================
     RECENT
  ===================================================== */

  const recentCandidates =
    (
      recentCandidatesResult.data ??
      []
    ).map(
      (candidate) => ({
        id: candidate.id,
        name: candidate.name,
        passport_no:
          candidate.passport_no,
        created_at:
          candidate.created_at,
        current_stage:
          candidate.current_stage,
        is_returned:
          candidate.is_returned,

       workflow_state:
  candidate.workflow_state === "hold"
    ? ("hold" as const)
    : ("processing" as const),

        hold_reason:
          candidate.hold_reason ??
          null,
      }),
    );

  return {
    trend,

    aging,

    recentCandidates,

    documentAlerts: [
      {
        title:
          "Passport document missing",

        description:
          "Active candidates without an active passport document.",

        count:
          missingPassport,

        level:
          "critical",
      },

      {
        title:
          "Medical processing pending",

        description:
          "Active candidates waiting for medical processing.",

        count:
          medicalPending,

        level:
          "warning",
      },

      {
        title:
          "MOFA processing pending",

        description:
          "MOFA applications waiting for the next stage.",

        count:
          mofaPending,

        level:
          "warning",
      },

      {
        title:
          "Candidates on hold",

        description:
          "Active candidates whose workflow requires attention or rework.",

        count:
          holdCandidatesCount,

        level:
          "critical",
      },
    ],
  };
}