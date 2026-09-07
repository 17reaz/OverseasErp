import { supabase } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

export type DashboardWorkflowState =
  | "processing"
  | "hold";

export type DashboardHoldReason =
  | "medical_expired"
  | "mofa_expired"
  | "visa_expired"
  | "iqama_overdue"
  | "manual_hold"
  | string
  | null;

export interface DashboardCandidate {
  id: string;
  name: string;
  passport_no: string;
  created_at: string;
  current_stage: string | null;
  is_returned: boolean;

  /*
   * Workflow state is separate from the main candidate status.
   *
   * active
   *   ├── processing
   *   └── hold
   */
  workflow_state: DashboardWorkflowState;

  hold_reason: DashboardHoldReason;
}

export interface DashboardData {
  stats: {
    /* -----------------------------------------------------
       MAIN CANDIDATE STATUS
    ----------------------------------------------------- */

    totalCandidates: number;
    activeCandidates: number;
    completeCandidates: number;
    returnedCandidates: number;
    cancelledCandidates: number;

    /* -----------------------------------------------------
       ACTIVE BREAKDOWN

       activeCandidates =
         processingCandidates + holdCandidates
    ----------------------------------------------------- */

    processingCandidates: number;
    holdCandidates: number;

    holdReasons: {
      reason: string;
      label: string;
      count: number;
    }[];

    /* -----------------------------------------------------
       MEDICAL
    ----------------------------------------------------- */

    medicalPending: number;
    medicalFit: number;
    medicalUnfit: number;

    /* -----------------------------------------------------
       MOFA
    ----------------------------------------------------- */

    mofaPending: number;
    mofaApproved: number;

    /* -----------------------------------------------------
       VISA
    ----------------------------------------------------- */

    visaPending: number;
    visaIssued: number;

    /* -----------------------------------------------------
       FLIGHT
    ----------------------------------------------------- */

    flightScheduled: number;
    flightDeparted: number;
  };

  pipeline: {
    key:
      | "active"
      | "medical"
      | "mofa"
      | "finger"
      | "police_clearance"
      | "takamul"
      | "visa"
      | "bmet"
      | "flight"
      | "iqama";

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
   HOLD REASON LABEL
========================================================= */

function getHoldReasonLabel(
  reason: string,
): string {
  switch (reason) {
    case "medical_expired":
      return "Medical Expired";

    case "mofa_expired":
      return "MOFA Expired";

    case "visa_expired":
      return "Visa Expired";

    case "iqama_overdue":
      return "Iqama Overdue";

    case "manual_hold":
      return "Manual Hold";

    default:
      return reason
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase(),
        );
  }
}

/* =========================================================
   SAFE WORKFLOW STATE
========================================================= */

function normalizeWorkflowState(
  value: unknown,
): DashboardWorkflowState {
  return value === "hold"
    ? "hold"
    : "processing";
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

     Active means:
     - not deleted
     - not returned
     - not complete
     - not cancelled

     IMPORTANT:
     workflow_state is NOT used here.

     Therefore:

       Active = Processing + Hold

     This preserves the existing meaning of Active.
  ======================================================= */

  const activeCandidatesPromise =
    supabase
      .from("candidates")
      .select(
        `
        id,
        current_stage,
        requested_services,
        workflow_state,
        hold_reason
        `,
      )
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null);

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
      .eq("is_returned", false)
      .is("final_status", null);

  /* =======================================================
     ALL QUERIES RUN IN PARALLEL
  ======================================================= */

  const [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    completeCandidatesResult,
    cancelledCandidatesResult,
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

    bmetCandidateIdsResult,
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

       Complete / Cancelled / Returned excluded.
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null),

    /* =====================================================
       RETURNED CANDIDATES
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
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .eq("final_status", "complete"),

    /* =====================================================
       CANCELLED CANDIDATES
    ===================================================== */

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .eq("final_status", "cancelled"),

    /* =====================================================
       RECENT CANDIDATES

       Only 5 rows.
    ===================================================== */

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

       Last 6 months only.
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

       Active candidates only.
    ===================================================== */

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

    /* =====================================================
       PASSPORT DOCUMENTS

       Only active passport files.
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
       ACTIVE CANDIDATES + CURRENT STAGE + WORKFLOW

       IMPORTANT:

       Pipeline candidates are filtered below to:

         workflow_state = processing

       Hold candidates are excluded.
    ===================================================== */

    activeCandidatesPromise,

    /* =====================================================
       BMET CANDIDATE IDS

       BMET is not a candidate stage yet.
    ===================================================== */

    supabase
      .from("bmet")
      .select("candidate_id"),
  ]);

  /* =======================================================
     ERROR HANDLING
  ======================================================= */

  const results = [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    completeCandidatesResult,
    cancelledCandidatesResult,
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

    bmetCandidateIdsResult,
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

  const cancelledCandidates =
    cancelledCandidatesResult.count ?? 0;

  /* =======================================================
     ACTIVE CANDIDATE IDS
  ======================================================= */

  const activeCandidateIds =
    activeCandidateIdsResult.data ?? [];

  /* =======================================================
     ACTIVE WORKFLOW DATA
  ======================================================= */

  const activeStageCandidates =
    activeCandidatesStageResult.data ?? [];

  /* =======================================================
     PROCESSING / HOLD BREAKDOWN

     Active is divided into:

       processing
       hold

     IMPORTANT:
     We do NOT change the main Active count.

       activeCandidates =
         processingCandidates + holdCandidates
  ======================================================= */

  const processingCandidates =
    activeStageCandidates.filter(
      (candidate) =>
        normalizeWorkflowState(
          candidate.workflow_state,
        ) === "processing",
    );

  const holdCandidates =
    activeStageCandidates.filter(
      (candidate) =>
        normalizeWorkflowState(
          candidate.workflow_state,
        ) === "hold",
    );

  const processingCandidatesCount =
    processingCandidates.length;

  const holdCandidatesCount =
    holdCandidates.length;

  /* =======================================================
     HOLD REASON BREAKDOWN
  ======================================================= */

  const holdReasonMap =
    new Map<string, number>();

  for (const candidate of holdCandidates) {
    const reason =
      typeof candidate.hold_reason ===
      "string"
        ? candidate.hold_reason.trim()
        : "";

    const normalizedReason =
      reason || "manual_hold";

    holdReasonMap.set(
      normalizedReason,
      (holdReasonMap.get(
        normalizedReason,
      ) ?? 0) + 1,
    );
  }

  const holdReasons =
    Array.from(
      holdReasonMap.entries(),
    )
      .sort(
        ([, countA], [, countB]) =>
          countB - countA,
      )
      .map(
        ([reason, count]) => ({
          reason,
          label:
            getHoldReasonLabel(
              reason,
            ),
          count,
        }),
      );

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

     Active candidates without
     any medical record.

     HOLD candidates are still Active,
     therefore they remain part of this
     existing KPI.
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
     BMET CANDIDATE IDS
  ======================================================= */

  const bmetCandidateIds =
    new Set(
      (
        bmetCandidateIdsResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(Boolean),
    );

  /* =======================================================
     PROCESSING PIPELINE

     VERY IMPORTANT:

     Only processing candidates enter the pipeline.

     Hold candidates are completely excluded.

     Existing stage order is preserved:

       medical
       ↓
       mofa
       ↓
       finger
       ↓
       police clearance
       ↓
       takamul
       ↓
       visa
       ↓
       flight

     BMET and Iqama remain independent service checks.
  ======================================================= */

  const pipelineCounts = {
    medical: 0,
    mofa: 0,
    finger: 0,
    police_clearance: 0,
    takamul: 0,
    visa: 0,
    flight: 0,
    bmet: 0,
    iqama: 0,
  };

  /* =======================================================
     ONLY PROCESSING CANDIDATES
  ======================================================= */

  for (
    const candidate of
    processingCandidates
  ) {
    const stage =
      normalizeStage(
        candidate.current_stage,
      );

    const stagesFrom = (
      stages: string[],
    ) =>
      stages.includes(stage);

    /* -----------------------------------------------------
       Medical or beyond
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "medical",
        "mofa",
        "finger",
        "police clearance",
        "takamul",
        "visa",
        "flight",
      ])
    ) {
      pipelineCounts.medical += 1;
    }

    /* -----------------------------------------------------
       MOFA or beyond
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "mofa",
        "finger",
        "police clearance",
        "takamul",
        "visa",
        "flight",
      ])
    ) {
      pipelineCounts.mofa += 1;
    }

    /* -----------------------------------------------------
       Finger or beyond
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "finger",
        "police clearance",
        "takamul",
        "visa",
        "flight",
      ])
    ) {
      pipelineCounts.finger += 1;
    }

    /* -----------------------------------------------------
       Police Clearance or beyond
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "police clearance",
        "takamul",
        "visa",
        "flight",
      ])
    ) {
      pipelineCounts.police_clearance += 1;
    }

    /* -----------------------------------------------------
       Takamul or beyond
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "takamul",
        "visa",
        "flight",
      ])
    ) {
      pipelineCounts.takamul += 1;
    }

    /* -----------------------------------------------------
       Visa or beyond
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "visa",
        "flight",
      ])
    ) {
      pipelineCounts.visa += 1;
    }

    /* -----------------------------------------------------
       Flight
    ----------------------------------------------------- */

    if (
      stagesFrom([
        "flight",
      ])
    ) {
      pipelineCounts.flight += 1;
    }

    /* -----------------------------------------------------
       BMET

       BMET is not a current_stage.

       Only PROCESSING candidates are considered.
    ----------------------------------------------------- */

    if (
      bmetCandidateIds.has(
        candidate.id,
      )
    ) {
      pipelineCounts.bmet += 1;
    }

    /* -----------------------------------------------------
       Iqama

       Iqama is still controlled by
       requested_services.

       Only PROCESSING candidates are considered.
    ----------------------------------------------------- */

    const requestedServices =
      candidate.requested_services as
        | Record<string, unknown>
        | null
        | undefined;

    if (
      requestedServices?.iqama === true
    ) {
      pipelineCounts.iqama += 1;
    }
  }

  /* =======================================================
     PIPELINE

     Compatibility note:

     The existing dashboard-pipeline.tsx expects an
     "Active" item and uses it as the denominator for
     percentages.

     We KEEP the key "active", but its value now represents
     PROCESSING candidates only.

     Therefore:

       Pipeline Active = Processing

     HOLD NEVER ENTERS PIPELINE.
  ======================================================= */

  const pipeline = [
    {
      key: "active" as const,
      label: "Active",
      value: processingCandidatesCount,
    },

    {
      key: "medical" as const,
      label: "Medical",
      value: pipelineCounts.medical,
    },

    {
      key: "mofa" as const,
      label: "MOFA",
      value: pipelineCounts.mofa,
    },

    {
      key: "finger" as const,
      label: "Finger",
      value: pipelineCounts.finger,
    },

    {
      key: "police_clearance" as const,
      label: "Police Clearance",
      value:
        pipelineCounts.police_clearance,
    },

    {
      key: "takamul" as const,
      label: "Takamul",
      value: pipelineCounts.takamul,
    },

    {
      key: "visa" as const,
      label: "Visa",
      value: pipelineCounts.visa,
    },

    {
      key: "bmet" as const,
      label: "BMET",
      value: pipelineCounts.bmet,
    },

    {
      key: "flight" as const,
      label: "Flight",
      value: pipelineCounts.flight,
    },

    {
      key: "iqama" as const,
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
          normalizeWorkflowState(
            candidate.workflow_state,
          ),

        hold_reason:
          candidate.hold_reason ??
          null,
      }),
    );

  /* =======================================================
     FINAL DASHBOARD DATA
  ======================================================= */

  return {
    /* -----------------------------------------------------
       STATS
    ----------------------------------------------------- */

    stats: {
      /* Main status */

      totalCandidates,

      activeCandidates,

      completeCandidates,

      cancelledCandidates,

      returnedCandidates,

      /* Active breakdown */

      processingCandidates:
        processingCandidatesCount,

      holdCandidates:
        holdCandidatesCount,

      holdReasons,

      /* Medical */

      medicalPending,

      medicalFit,

      medicalUnfit,

      /* MOFA */

      mofaPending,

      mofaApproved,

      /* Visa */

      visaPending,

      visaIssued,

      /* Flight */

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