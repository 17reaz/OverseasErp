// src/modules/erp/candidates/stage-service.ts

import { supabase } from "@/lib/supabase/client";

/* =========================================================
   REQUESTED SERVICES
   ---------------------------------------------------------
   `candidates.requested_services` (jsonb) — কোন candidate-এর
   জন্য কোন কোন service প্রযোজ্য সেটার record।

   IMPORTANT:
   এটা `candidate-stage.ts`-এর GLOBAL STAGE engine থেকে
   সম্পূর্ণ আলাদা এবং independent — currentStage/next-stage
   flow-কে এটা কোনোভাবে touch করে না।

   এটা শুধু "এই candidate-এর জন্য এই service লাগবে কিনা"
   টুকু track করে (metadata), workflow progression না।

   NOTE (temporary):
   এই file আপাতত standalone রাখা হয়েছে — future cleanup-এর
   সময় হয়তো `candidate-service.ts` / naming এর সাথে merge
   হবে। এখন কোনো existing file/engine-এ change করা হয়নি।
========================================================= */

export const REQUESTED_SERVICE_DEFINITIONS = [
  { key: "mofa", label: "MOFA" },
  { key: "visa", label: "Visa" },
  { key: "iqama", label: "Iqama" },
  { key: "finger", label: "Finger" },
  { key: "flight", label: "Flight" },
  { key: "medical", label: "Medical" },
  { key: "takamul", label: "Takamul" },
  { key: "manpower", label: "Manpower" },
  { key: "police_clearance", label: "Police Clearance" },
] as const;

export type RequestedServiceKey =
  (typeof REQUESTED_SERVICE_DEFINITIONS)[number]["key"];

export type RequestedServices = Record<RequestedServiceKey, boolean>;

/* ---------------------------------------------------------
   DEFAULT VALUES
   ---------------------------------------------------------
   Supabase column default-এর সাথে mirror করে রাখা হলো, যাতে
   কোনো কারণে value null/missing এলেও UI ভাঙে না।
--------------------------------------------------------- */

export function getDefaultRequestedServices(): RequestedServices {
  return REQUESTED_SERVICE_DEFINITIONS.reduce((acc, definition) => {
    acc[definition.key] = true;
    return acc;
  }, {} as RequestedServices);
}

/* ---------------------------------------------------------
   NORMALIZE
   ---------------------------------------------------------
   DB থেকে আসা raw jsonb value-কে safe, fully-typed
   RequestedServices object-এ normalize করে। Missing key ->
   default (true), unknown key -> ignore.
--------------------------------------------------------- */

function normalizeRequestedServices(
  raw: Partial<Record<string, unknown>> | null | undefined,
): RequestedServices {
  const defaults = getDefaultRequestedServices();

  if (!raw) {
    return defaults;
  }

  const normalized = { ...defaults };

  for (const definition of REQUESTED_SERVICE_DEFINITIONS) {
    const value = raw[definition.key];

    if (typeof value === "boolean") {
      normalized[definition.key] = value;
    }
  }

  return normalized;
}

/* =========================================================
   FETCH REQUESTED SERVICES
   ---------------------------------------------------------
   একটা candidate-এর current requested_services আনে।
========================================================= */

export async function fetchRequestedServices(
  candidateId: string,
): Promise<RequestedServices> {
  const { data, error } = await supabase
    .from("candidates")
    .select("requested_services")
    .eq("id", candidateId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeRequestedServices(
    data?.requested_services as Record<string, unknown> | null | undefined,
  );
}

/* =========================================================
   UPDATE REQUESTED SERVICES
   ---------------------------------------------------------
   পুরো requested_services object write করে (partial merge না
   — sheet সবসময় সবগুলো key-সহ complete object পাঠাবে)।
========================================================= */

export async function updateRequestedServices(
  candidateId: string,
  services: RequestedServices,
): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .update({
      requested_services: services,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    throw error;
  }
}