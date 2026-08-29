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
  ] = await Promise.all([
    /* =====================================================
       CANDIDATES
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false),

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false),

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", true),

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
       MEDICAL
    ===================================================== */

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "fit"),

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "unfit"),

    /*
     * Only candidate_id is required.
     *
     * We use a Set later so duplicate medical
     * records don't create duplicate candidates.
     */

    supabase
      .from("medicals")
      .select("candidate_id"),

    /* =====================================================
       MOFA
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

    supabase
      .from("mofas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("stage", "approved"),

    /* =====================================================
       VISA
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
       FLIGHTS
    ===================================================== */

    supabase
      .from("flights")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "scheduled"),

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
  ]);

  /* =======================================================
     ERROR HANDLING
  ======================================================= */

  const results = [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,

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

  /*
   * Convert medical candidate IDs into a Set.
   *
   * Set lookup = O(1)
   */

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

  /*
   * Active candidates that don't have
   * any medical record.
   */

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
     PIPELINE
  ======================================================= */

  const pipeline = [
    {
      label: "Candidates",
      value: activeCandidates,
    },

    {
      label: "Medical",
      value: medicalFit,
    },

    {
      label: "MOFA",
      value: mofaApproved,
    },

    {
      label: "Visa",
      value: visaIssued,
    },

    {
      label: "Flight",
      value: flightScheduled,
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

  /*
   * Create the last six months first.
   */

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

  /*
   * Count candidates by month.
   *
   * Map lookup avoids repeated .find().
   */

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