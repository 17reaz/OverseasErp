// import { supabase } from "@/lib/supabase";
import { supabase } from "@/lib/supabase/client";
export interface DashboardActivityData {
  today: {
    candidates: number;
    medical: number;
    mofa: number;
    visa: number;
    flights: number;
    payments: number;
  };
  week: {
    candidates: number;
    medical: number;
    mofa: number;
    visa: number;
    flights: number;
    payments: number;
  };
}

interface CountResult {
  count: number | null;
}

function getDhakaDateRange() {
  const now = new Date();

  const dhakaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const today = dhakaFormatter.format(now);

  const todayStart = new Date(`${today}T00:00:00+06:00`);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return {
    todayStart: todayStart.toISOString(),
    weekStart: weekStart.toISOString(),
    tomorrowStart: tomorrowStart.toISOString(),
  };
}

async function getCount(
  table: string,
  column: string,
  start: string,
  end: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    })
    .gte(column, start)
    .lt(column, end);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getPaymentCount(
  start: string,
  end: string,
): Promise<number> {
  const { count, error } = await supabase
    .schema("finance")
    .from("transactions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("type", "income")
    .gte("transaction_date", start)
    .lt("transaction_date", end);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getDashboardActivity(): Promise<DashboardActivityData> {
  const {
    todayStart,
    weekStart,
    tomorrowStart,
  } = getDhakaDateRange();

  const [
    todayCandidates,
    todayMedical,
    todayMofa,
    todayVisa,
    todayFlights,
    todayPayments,
    weekCandidates,
    weekMedical,
    weekMofa,
    weekVisa,
    weekFlights,
    weekPayments,
  ] = await Promise.all([
    getCount(
      "candidates",
      "created_at",
      todayStart,
      tomorrowStart,
    ),
    getCount(
      "medicals",
      "created_at",
      todayStart,
      tomorrowStart,
    ),
    getCount(
      "mofas",
      "created_at",
      todayStart,
      tomorrowStart,
    ),
    getCount(
      "visas",
      "created_at",
      todayStart,
      tomorrowStart,
    ),
    getCount(
      "flights",
      "created_at",
      todayStart,
      tomorrowStart,
    ),
    getPaymentCount(
      todayStart,
      tomorrowStart,
    ),

    getCount(
      "candidates",
      "created_at",
      weekStart,
      tomorrowStart,
    ),
    getCount(
      "medicals",
      "created_at",
      weekStart,
      tomorrowStart,
    ),
    getCount(
      "mofas",
      "created_at",
      weekStart,
      tomorrowStart,
    ),
    getCount(
      "visas",
      "created_at",
      weekStart,
      tomorrowStart,
    ),
    getCount(
      "flights",
      "created_at",
      weekStart,
      tomorrowStart,
    ),
    getPaymentCount(
      weekStart,
      tomorrowStart,
    ),
  ]);

  return {
    today: {
      candidates: todayCandidates,
      medical: todayMedical,
      mofa: todayMofa,
      visa: todayVisa,
      flights: todayFlights,
      payments: todayPayments,
    },
    week: {
      candidates: weekCandidates,
      medical: weekMedical,
      mofa: weekMofa,
      visa: weekVisa,
      flights: weekFlights,
      payments: weekPayments,
    },
  };
}