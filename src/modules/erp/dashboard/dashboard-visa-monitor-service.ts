import { supabase } from "@/lib/supabase/client";

export interface DashboardVisaWarning {
  id: string;
  candidateId: string;
  candidateName: string;
  passportNo: string | null;
  sl: number | null;
  visaNo: string;
  expiryDate: string;
  daysRemaining: number;
}

interface VisaRow {
  id: string;
  candidate_id: string;
  sl: number | null;
  visa_no: string | null;
  expiry_date: string | null;
  candidate:
    | {
        id: string;
        name: string | null;
        passport_no: string | null;
        sl: number | null;
      }
    | {
        id: string;
        name: string | null;
        passport_no: string | null;
        sl: number | null;
      }[]
    | null;
}

interface FlightRow {
  visa_id: string | null;
}

function getDaysRemaining(expiryDate: string) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

export async function getDashboardVisaWarnings(): Promise<
  DashboardVisaWarning[]
> {
  /*
   * Get visas that have an expiry date.
   *
   * We intentionally do not filter by visa.status here because
   * the current Visa module uses "processing" and the actual
   * workflow progression is represented by Flight records.
   */
  const { data: visas, error: visaError } = await supabase
    .from("visas")
    .select(`
      id,
      candidate_id,
      sl,
      visa_no,
      expiry_date,
      candidate:candidates (
        id,
        name,
        passport_no,
        sl
      )
    `)
    .not("expiry_date", "is", null)
    .order("expiry_date", {
      ascending: true,
    });

  if (visaError) {
    throw new Error(visaError.message);
  }

  if (!visas?.length) {
    return [];
  }

  /*
   * Any visa that already has a Flight record is no longer
   * considered a Visa Warning.
   *
   * We use visa_id because flights.visa_id is the direct
   * relationship between Flight and Visa.
   */
  const visaIds = visas.map((visa) => visa.id);

  const { data: flights, error: flightError } = await supabase
    .from("flights")
    .select("visa_id")
    .in("visa_id", visaIds);

  if (flightError) {
    throw new Error(flightError.message);
  }

  const visaIdsWithFlights = new Set(
    (flights ?? [])
      .map((flight: FlightRow) => flight.visa_id)
      .filter(
        (visaId): visaId is string =>
          Boolean(visaId),
      ),
  );

  const warnings: DashboardVisaWarning[] = [];

  for (const visa of visas as VisaRow[]) {
    /*
     * Flight already exists:
     * this candidate has moved beyond Visa.
     */
    if (visaIdsWithFlights.has(visa.id)) {
      continue;
    }

    if (!visa.expiry_date) {
      continue;
    }

    const daysRemaining = getDaysRemaining(
      visa.expiry_date,
    );

    /*
     * Only expired visas and visas expiring within
     * the next 30 days are dashboard warnings.
     */
    if (daysRemaining > 30) {
      continue;
    }

    const candidate = Array.isArray(visa.candidate)
      ? visa.candidate[0]
      : visa.candidate;

    if (!candidate) {
      continue;
    }

    warnings.push({
      id: visa.id,
      candidateId: visa.candidate_id,
      candidateName:
        candidate.name?.trim() || "Unknown Candidate",
      passportNo: candidate.passport_no ?? null,
      sl: candidate.sl ?? visa.sl ?? null,
      visaNo: visa.visa_no ?? "—",
      expiryDate: visa.expiry_date,
      daysRemaining,
    });
  }

  return warnings.sort(
    (a, b) =>
      a.daysRemaining - b.daysRemaining,
  );
}