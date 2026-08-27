import { supabase } from "@/lib/supabase/client";

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

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
}

function getStartOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();

  /*
   * -------------------------------------------------------
   * CANDIDATES
   * -------------------------------------------------------
   */

  const [
    candidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    recentCandidatesResult,
  ] = await Promise.all([
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
  ]);


  if (candidatesResult.error) {
    throw candidatesResult.error;
  }

  if (activeCandidatesResult.error) {
    throw activeCandidatesResult.error;
  }

  if (returnedCandidatesResult.error) {
    throw returnedCandidatesResult.error;
  }

  if (recentCandidatesResult.error) {
    throw recentCandidatesResult.error;
  }


  /*
   * -------------------------------------------------------
   * MEDICAL
   * -------------------------------------------------------
   */

  const { data: medicals, error: medicalError } =
    await supabase
      .from("medicals")
      .select(`
        id,
        candidate_id,
        medical_date,
        fit_date,
        status
      `);

  if (medicalError) {
    throw medicalError;
  }


  const medicalRows = medicals ?? [];


  const medicalFit = medicalRows.filter(
    (item) =>
      item.status === "fit",
  ).length;


  const medicalUnfit = medicalRows.filter(
    (item) =>
      item.status === "unfit",
  ).length;


  /*
   * Candidate যাদের কোনো medical নেই
   */

  const medicalCandidateIds = new Set(
    medicalRows.map(
      (item) => item.candidate_id,
    ),
  );


  const { data: activeCandidateIds, error: activeIdError } =
    await supabase
      .from("candidates")
      .select("id")
      .eq("is_deleted", false)
      .eq("is_returned", false);

  if (activeIdError) {
    throw activeIdError;
  }


  const medicalPending =
    (activeCandidateIds ?? []).filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    ).length;


  /*
   * -------------------------------------------------------
   * MOFA
   * -------------------------------------------------------
   */

  const { data: mofas, error: mofaError } =
    await supabase
      .from("mofas")
      .select(`
        id,
        candidate_id,
        medical_id,
        stage,
        application_date
      `);

  if (mofaError) {
    throw mofaError;
  }


  const mofaRows = mofas ?? [];


  const mofaPending = mofaRows.filter(
    (item) =>
      item.stage === "new" ||
      item.stage === "medupdated",
  ).length;


  const mofaApproved = mofaRows.filter(
    (item) =>
      item.stage === "approved",
  ).length;


  /*
   * -------------------------------------------------------
   * VISA
   * -------------------------------------------------------
   */

  const { data: visas, error: visaError } =
    await supabase
      .from("visas")
      .select(`
        id,
        candidate_id,
        mofa_id,
        status,
        visa_date,
        expiry_date
      `);

  if (visaError) {
    throw visaError;
  }


  const visaRows = visas ?? [];


  const visaIssued = visaRows.filter(
    (item) => {
      const status =
        String(item.status ?? "")
          .toLowerCase();

      return (
        status === "issued" ||
        status === "approved"
      );
    },
  ).length;


  const visaPending = visaRows.filter(
    (item) => {
      const status =
        String(item.status ?? "")
          .toLowerCase();

      return ![
        "issued",
        "approved",
        "cancelled",
        "expired",
      ].includes(status);
    },
  ).length;


  /*
   * -------------------------------------------------------
   * FLIGHTS
   * -------------------------------------------------------
   */

  const { data: flights, error: flightError } =
    await supabase
      .from("flights")
      .select(`
        id,
        candidate_id,
        visa_id,
        flight_date,
        flight_no,
        airline,
        status
      `);

  if (flightError) {
    throw flightError;
  }


  const flightRows = flights ?? [];


  const flightScheduled =
    flightRows.filter(
      (item) =>
        item.status === "scheduled",
    ).length;


  const flightDeparted =
    flightRows.filter(
      (item) =>
        item.status === "departed",
    ).length;


  /*
   * -------------------------------------------------------
   * 6 MONTH CANDIDATE TREND
   * -------------------------------------------------------
   */

  const sixMonthsAgo = getStartOfMonth(
    new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
    ),
  );


  const { data: trendCandidates, error: trendError } =
    await supabase
      .from("candidates")
      .select("created_at")
      .eq("is_deleted", false)
      .gte(
        "created_at",
        sixMonthsAgo.toISOString(),
      );


  if (trendError) {
    throw trendError;
  }


  const trend = Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1,
      );

      return {
        month: getMonthLabel(date),
        candidates: 0,
        start: date,
      };
    },
  );


  for (
    const candidate of
    trendCandidates ?? []
  ) {
    const created =
      new Date(
        candidate.created_at,
      );

    const item =
      trend.find(
        (month, index) => {
          const next =
            trend[index + 1];

          if (!next) {
            return (
              created >=
              month.start
            );
          }

          return (
            created >=
              month.start &&
            created <
              next.start
          );
        },
      );

    if (item) {
      item.candidates += 1;
    }
  }


  /*
   * -------------------------------------------------------
   * CANDIDATE AGING
   * -------------------------------------------------------
   */

  const { data: agingCandidates, error: agingError } =
    await supabase
      .from("candidates")
      .select("received_date")
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .not(
        "received_date",
        "is",
        null,
      );


  if (agingError) {
    throw agingError;
  }


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
    agingCandidates ?? []
  ) {
    if (!candidate.received_date) {
      continue;
    }

    const received =
      new Date(
        candidate.received_date,
      );

    const days = Math.floor(
      (
        now.getTime() -
        received.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        ),
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


  /*
   * -------------------------------------------------------
   * DOCUMENT ALERTS
   * -------------------------------------------------------
   */

  const {
    data: files,
    error: filesError,
  } = await supabase
    .from("files")
    .select(`
      candidate_id,
      doc_type,
      is_active
    `)
    .eq(
      "is_active",
      true,
    );


  if (filesError) {
    throw filesError;
  }


  const activeCandidates =
    activeCandidateIds ?? [];


  const passportCandidates =
    new Set(
      (files ?? [])
        .filter(
          (file) =>
            file.doc_type ===
              "passport",
        )
        .map(
          (file) =>
            file.candidate_id,
        ),
    );


  const missingPassport =
    activeCandidates.filter(
      (candidate) =>
        !passportCandidates.has(
          candidate.id,
        ),
    ).length;


  /*
   * -------------------------------------------------------
   * RETURN
   * -------------------------------------------------------
   */

  return {
    stats: {
      totalCandidates:
        candidatesResult.count ?? 0,

      activeCandidates:
        activeCandidatesResult.count ?? 0,

      returnedCandidates:
        returnedCandidatesResult.count ?? 0,

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


    pipeline: [
      {
        label: "Candidates",
        value:
          activeCandidatesResult.count ?? 0,
      },
      {
        label: "Medical",
        value:
          medicalRows.length,
      },
      {
        label: "MOFA",
        value:
          mofaRows.length,
      },
      {
        label: "Visa",
        value:
          visaRows.length,
      },
      {
        label: "Flight",
        value:
          flightRows.length,
      },
    ],


    trend: trend.map(
      ({
        month,
        candidates,
      }) => ({
        month,
        candidates,
      }),
    ),


    aging,


    recentCandidates:
      (recentCandidatesResult.data ??
        []) as DashboardCandidate[],


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