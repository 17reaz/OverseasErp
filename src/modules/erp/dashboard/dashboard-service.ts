import { supabase } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

export interface DashboardCandidate {
  id: string;
  name: string;
  passport_no: string;
  created_at: string;
  current_stage: string | null;
  is_returned: boolean;
}

export interface DashboardData {
  stats: {
    totalCandidates: number;
    activeCandidates: number;
    completeCandidates: number;
    returnedCandidates: number;

    medicalPending: number;
    medicalFit: number;
    medicalUnfit: number;

    mofaPending: number;
    mofaApproved: number;

    visaPending: number;
    visaIssued: number;

    flightScheduled: number;
    flightDeparted: number;
  };

  pipeline: {
    label: string;
    value: number;
  }[];

  trend: {
    month: string;
    candidates: number;
  }[];

  aging: {
    label: string;
    count: number;
  }[];

  recentCandidates: DashboardCandidate[];

  documentAlerts: {
    title: string;
    description: string;
    count: number;
    level: "critical" | "warning" | "info";
  }[];
}

/* =========================================================
   HELPERS
========================================================= */

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
}

function getStartOfMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function getDaysSince(dateString: string): number {
  const now = new Date();
  const date = new Date(dateString);

  const difference =
    now.getTime() - date.getTime();

  return Math.floor(
    difference /
      (1000 * 60 * 60 * 24),
  );
}

/* =========================================================
   STAGE NORMALIZER
========================================================= */

function normalizeStage(
  stage: string | null,
): string {
  return (
    stage
      ?.toLowerCase()
      .trim()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ") ?? ""
  );
}

/* =========================================================
   DASHBOARD SERVICE
========================================================= */

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();

  /* -------------------------------------------------------
     Last 6 months
  ------------------------------------------------------- */

  const sixMonthsAgo =
    getStartOfMonth(
      new Date(
        now.getFullYear(),
        now.getMonth() - 5,
        1,
      ),
    );

  /* =======================================================
     ACTIVE CANDIDATES

     We fetch current_stage here because the dashboard
     pipeline is based on active candidate progression.
  ======================================================= */

  const activeCandidatesPromise =
    supabase
      .from("candidates")
      .select(
        "id, current_stage",
      )
      .eq("is_deleted", false)
      .eq("is_returned", false);

  /* =======================================================
     ACTIVE CANDIDATE IDS

     Used for:
     - Medical pending
     - Passport alerts
  ======================================================= */

  const activeCandidateIdsPromise =
    supabase
      .from("candidates")
      .select("id")
      .eq("is_deleted", false)
      .eq("is_returned", false);

  /* =======================================================
     ALL QUERIES RUN IN PARALLEL
  ======================================================= */

  const [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    completeCandidatesResult,

    recentCandidatesResult,

    medicalFitResult,
    medicalUnfitResult,
    medicalCandidateIdsResult,

    mofaPendingResult,
    mofaApprovedResult,

    visaPendingResult,
    visaIssuedResult,

    flightScheduledResult,
    flightDepartedResult,

    trendCandidatesResult,

    agingCandidatesResult,

    passportFilesResult,

    activeCandidateIdsResult,

    activeCandidatesStageResult,
  ] = await Promise.all([
    /* =====================================================
       TOTAL CANDIDATES
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false),

    /* =====================================================
       ACTIVE CANDIDATES
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false),

    /* =====================================================
       RETURNED / CANCELLED

       Current database logic uses is_returned.
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", true),

    /* =====================================================
       COMPLETE CANDIDATES

       Complete candidates are not active.
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("current_stage", "complete"),

    /* =====================================================
       RECENT CANDIDATES
       Only 5 rows
    ===================================================== */

    supabase
      .from("candidates")
      .select(`
        id,
        name,
        passport_no,
        created_at,
        current_stage,
        is_returned
      `)
      .eq("is_deleted", false)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    /* =====================================================
       MEDICAL - FIT
    ===================================================== */

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "fit"),

    /* =====================================================
       MEDICAL - UNFIT
    ===================================================== */

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "unfit"),

    /* =====================================================
       MEDICAL CANDIDATE IDS

       Used to determine which active candidates
       have medical records.
    ===================================================== */

    supabase
      .from("medicals")
      .select("candidate_id"),

    /* =====================================================
       MOFA - PENDING
    ===================================================== */

    supabase
      .from("mofas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("stage", [
        "new",
        "medupdated",
      ]),

    /* =====================================================
       MOFA - APPROVED
    ===================================================== */

    supabase
      .from("mofas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("stage", "approved"),

    /* =====================================================
       VISA - PENDING
    ===================================================== */

    supabase
      .from("visas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not(
        "status",
        "in",
        "(issued,approved,cancelled,expired)",
      ),

    /* =====================================================
       VISA - ISSUED / APPROVED
    ===================================================== */

    supabase
      .from("visas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "issued",
        "approved",
      ]),

    /* =====================================================
       FLIGHT - SCHEDULED
    ===================================================== */

    supabase
      .from("flights")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "scheduled"),

    /* =====================================================
       FLIGHT - DEPARTED
    ===================================================== */

    supabase
      .from("flights")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "departed"),

    /* =====================================================
       CANDIDATE TREND
       Last 6 months only
    ===================================================== */

    supabase
      .from("candidates")
      .select("created_at")
      .eq("is_deleted", false)
      .gte(
        "created_at",
        sixMonthsAgo.toISOString(),
      ),

    /* =====================================================
       AGING
       Active candidates only
    ===================================================== */

    supabase
      .from("candidates")
      .select("received_date")
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .not(
        "received_date",
        "is",
        null,
      ),

    /* =====================================================
       PASSPORT DOCUMENTS

       Only active passport files
    ===================================================== */

    supabase
      .from("files")
      .select("candidate_id")
      .eq("is_active", true)
      .eq("doc_type", "passport"),

    /* =====================================================
       ACTIVE CANDIDATE IDS
    ===================================================== */

    activeCandidateIdsPromise,

    /* =====================================================
       ACTIVE CANDIDATES + CURRENT STAGE

       Used for pipeline calculation.
    ===================================================== */

    activeCandidatesPromise,
  ]);

  /* =======================================================
     ERROR HANDLING
  ======================================================= */

  const results = [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    completeCandidatesResult,

    recentCandidatesResult,

    medicalFitResult,
    medicalUnfitResult,
    medicalCandidateIdsResult,

    mofaPendingResult,
    mofaApprovedResult,

    visaPendingResult,
    visaIssuedResult,

    flightScheduledResult,
    flightDepartedResult,

    trendCandidatesResult,

    agingCandidatesResult,

    passportFilesResult,

    activeCandidateIdsResult,

    activeCandidatesStageResult,
  ];

  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
  }

  /* =======================================================
     BASIC CANDIDATE COUNTS
  ======================================================= */

  const totalCandidates =
    totalCandidatesResult.count ?? 0;

  const activeCandidates =
    activeCandidatesResult.count ?? 0;

  const returnedCandidates =
    returnedCandidatesResult.count ?? 0;

  const completeCandidates =
    completeCandidatesResult.count ?? 0;

  /* =======================================================
     ACTIVE CANDIDATE IDS
  ======================================================= */

  const activeCandidateIds =
    activeCandidateIdsResult.data ?? [];

  /* =======================================================
     MEDICAL
  ======================================================= */

  const medicalFit =
    medicalFitResult.count ?? 0;

  const medicalUnfit =
    medicalUnfitResult.count ?? 0;

  const medicalCandidateIds =
    new Set(
      (
        medicalCandidateIdsResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(Boolean),
    );

  /* =======================================================
     MEDICAL PENDING

     Active candidates that don't have
     any medical record.
  ======================================================= */

  const medicalPending =
    activeCandidateIds.filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    ).length;

  /* =======================================================
     MOFA
  ======================================================= */

  const mofaPending =
    mofaPendingResult.count ?? 0;

  const mofaApproved =
    mofaApprovedResult.count ?? 0;

  /* =======================================================
     VISA
  ======================================================= */

  const visaPending =
    visaPendingResult.count ?? 0;

  const visaIssued =
    visaIssuedResult.count ?? 0;

  /* =======================================================
     FLIGHTS
  ======================================================= */

  const flightScheduled =
    flightScheduledResult.count ?? 0;

  const flightDeparted =
    flightDepartedResult.count ?? 0;

  /* =======================================================
     ACTIVE CANDIDATE PIPELINE
  =======================================================

     Important:

     Pipeline is cumulative.

     Example:

       Iqama candidate
       → counted in Medical
       → counted in MOFA
       → counted in Visa
       → counted in Flight
       → counted in Iqama

     This gives a real recruitment pipeline view.
  ======================================================= */

  const activeStageCandidates =
    activeCandidatesStageResult.data ?? [];

  const pipelineCounts = {
    medical: 0,
    mofa: 0,
    visa: 0,
    flight: 0,
    iqama: 0,
  };

  for (const candidate of activeStageCandidates) {
    const stage =
      normalizeStage(
        candidate.current_stage,
      );

    /* -----------------------------------------------------
       Medical or beyond
    ----------------------------------------------------- */

    if (
      [
        "medical",
        "mofa",
        "visa",
        "flight",
        "iqama",
      ].includes(stage)
    ) {
      pipelineCounts.medical += 1;
    }

    /* -----------------------------------------------------
       MOFA or beyond
    ----------------------------------------------------- */

    if (
      [
        "mofa",
        "visa",
        "flight",
        "iqama",
      ].includes(stage)
    ) {
      pipelineCounts.mofa += 1;
    }

    /* -----------------------------------------------------
       Visa or beyond
    ----------------------------------------------------- */

    if (
      [
        "visa",
        "flight",
        "iqama",
      ].includes(stage)
    ) {
      pipelineCounts.visa += 1;
    }

    /* -----------------------------------------------------
       Flight or beyond
    ----------------------------------------------------- */

    if (
      [
        "flight",
        "iqama",
      ].includes(stage)
    ) {
      pipelineCounts.flight += 1;
    }

    /* -----------------------------------------------------
       Iqama
    ----------------------------------------------------- */

    if (stage === "iqama") {
      pipelineCounts.iqama += 1;
    }
  }

  const pipeline = [
    {
      label: "Active",
      value: activeCandidates,
    },

    {
      label: "Medical",
      value: pipelineCounts.medical,
    },

    {
      label: "MOFA",
      value: pipelineCounts.mofa,
    },

    {
      label: "Visa",
      value: pipelineCounts.visa,
    },

    {
      label: "Flight",
      value: pipelineCounts.flight,
    },

    {
      label: "Iqama",
      value: pipelineCounts.iqama,
    },
  ];

  /* =======================================================
     SIX MONTH TREND
  ======================================================= */

  const trendMap =
    new Map<string, number>();

  const trendMeta: {
    key: string;
    month: string;
  }[] = [];

  /* -------------------------------------------------------
     Create last six months
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     Count candidates by month
  ------------------------------------------------------- */

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
        (trendMap.get(key) ?? 0) +
          1,
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
          trendMap.get(key) ?? 0,
      }),
    );

  /* =======================================================
     AGING
  ======================================================= */

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

  /* =======================================================
     PASSPORT DOCUMENT ALERT
  ======================================================= */

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

  /* =======================================================
     RECENT CANDIDATES
  ======================================================= */

  const recentCandidates =
    (
      recentCandidatesResult.data ??
      []
    ) as DashboardCandidate[];

  /* =======================================================
     FINAL DASHBOARD DATA
  ======================================================= */

  return {
    /* -----------------------------------------------------
       STATS
    ----------------------------------------------------- */

    stats: {
      totalCandidates,

      activeCandidates,

      completeCandidates,

      returnedCandidates,

      medicalPending,

      medicalFit,

      medicalUnfit,

      mofaPending,

      mofaApproved,

      visaPending,

      visaIssued,

      flightScheduled,

      flightDeparted,
    },

    /* -----------------------------------------------------
       PIPELINE
    ----------------------------------------------------- */

    pipeline,

    /* -----------------------------------------------------
       TREND
    ----------------------------------------------------- */

    trend,

    /* -----------------------------------------------------
       AGING
    ----------------------------------------------------- */

    aging,

    /* -----------------------------------------------------
       RECENT CANDIDATES
    ----------------------------------------------------- */

    recentCandidates,

    /* -----------------------------------------------------
       DOCUMENT ALERTS
    ----------------------------------------------------- */

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
    ],
  };
}