import { supabase } from "@/lib/supabase/client";

export interface DashboardDeadline {
  id: string;
  candidateId: string;
  candidateName: string;
  passportNo: string;
  type: "flight";
  title: string;
  date: string;
  daysUntil: number;
  status: "overdue" | "today" | "soon" | "upcoming";
}

function getDeadlineStatus(
  daysUntil: number,
): DashboardDeadline["status"] {
  if (daysUntil < 0) {
    return "overdue";
  }

  if (daysUntil === 0) {
    return "today";
  }

  if (daysUntil <= 3) {
    return "soon";
  }

  return "upcoming";
}

export async function getDashboardUpcomingDeadlines(
  days = 30,
): Promise<DashboardDeadline[]> {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);

  endDate.setDate(
    endDate.getDate() + days,
  );

  const {
    data: flights,
    error,
  } = await supabase
    .from("flights")
    .select(
      `
        id,
        candidate_id,
        flight_date,
        flight_no,
        status
      `,
    )
    .in("status", [
      "scheduled",
      "rescheduled",
    ])
    .not(
      "flight_date",
      "is",
      null,
    )
    .gte(
      "flight_date",
      today.toISOString().slice(0, 10),
    )
    .lte(
      "flight_date",
      endDate.toISOString().slice(0, 10),
    )
    .order(
      "flight_date",
      {
        ascending: true,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  const rows = flights ?? [];

  if (rows.length === 0) {
    return [];
  }

  const candidateIds = [
    ...new Set(
      rows.map(
        (row) =>
          row.candidate_id,
      ),
    ),
  ];

  const {
    data: candidates,
    error: candidateError,
  } = await supabase
    .from("candidates")
    .select(
      `
        id,
        name,
        passport_no
      `,
    )
    .in(
      "id",
      candidateIds,
    )
    .eq(
      "is_deleted",
      false,
    );

  if (candidateError) {
    throw new Error(
      candidateError.message,
    );
  }

  const candidateMap =
    new Map(
      (candidates ?? []).map(
        (candidate) => [
          candidate.id,
          candidate,
        ],
      ),
    );

  return rows
    .map((flight) => {
      if (!flight.flight_date) {
        return null;
      }

      const candidate =
        candidateMap.get(
          flight.candidate_id,
        );

      if (!candidate) {
        return null;
      }

      const deadlineDate =
        new Date(
          `${flight.flight_date}T00:00:00`,
        );

      const daysUntil =
        Math.round(
          (
            deadlineDate.getTime() -
            today.getTime()
          ) /
            86_400_000,
        );

      const title =
        flight.flight_no
          ? `Flight ${flight.flight_no}`
          : "Flight departure";

      return {
        id: flight.id,
        candidateId:
          candidate.id,
        candidateName:
          candidate.name,
        passportNo:
          candidate.passport_no,
        type: "flight",
        title,
        date:
          flight.flight_date,
        daysUntil,
        status:
          getDeadlineStatus(
            daysUntil,
          ),
      } satisfies DashboardDeadline;
    })
    .filter(
      (
        item,
      ): item is DashboardDeadline =>
        item !== null,
    );
}