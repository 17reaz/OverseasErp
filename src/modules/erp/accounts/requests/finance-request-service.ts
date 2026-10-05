import { supabase } from "@/lib/supabase/client";

import {
  recordFinanceEvent,
} from "@/modules/erp/accounts/events/finance-event-service";

import type {
  FinanceEventInput,
} from "@/modules/erp/accounts/events/finance-event-types";

import type {
  CreateFinanceRequestInput,
  FinanceRequest,
} from "./finance-request-types";

function normalizeRequest(
  row: Record<string, unknown>,
): FinanceRequest {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),

    eventType:
      row.event_type as FinanceRequest["eventType"],

    module:
      row.module as FinanceRequest["module"],

    sourceType:
      row.source_type as FinanceRequest["sourceType"],

    sourceId: String(row.source_id),

    candidateId:
      row.candidate_id
        ? String(row.candidate_id)
        : null,

    partyId:
      row.party_id
        ? String(row.party_id)
        : null,

    partyType:
      (row.party_type as FinanceRequest["partyType"]) ??
      null,

    serviceCode:
      (row.service_code as string | null) ??
      null,

    serviceName:
      (row.service_name as string | null) ??
      null,

    amount: Number(row.amount),

    requestDate: String(row.request_date),

    accountId: String(row.account_id),

    categoryId:
      row.category_id
        ? String(row.category_id)
        : null,

    transactionType:
      row.transaction_type as
        | "income"
        | "expense",

    description:
      (row.description as string | null) ??
      null,

    reference:
      (row.reference as string | null) ??
      null,

    status:
      row.status as FinanceRequest["status"],

    requestedBy:
      row.requested_by
        ? String(row.requested_by)
        : null,

    approvedBy:
      row.approved_by
        ? String(row.approved_by)
        : null,

    rejectedBy:
      row.rejected_by
        ? String(row.rejected_by)
        : null,

    rejectionReason:
      (row.rejection_reason as string | null) ??
      null,

    processingError:
      (row.processing_error as string | null) ??
      null,

    transactionGroupId:
      row.transaction_group_id
        ? String(row.transaction_group_id)
        : null,

    approvedAt:
      (row.approved_at as string | null) ??
      null,

    rejectedAt:
      (row.rejected_at as string | null) ??
      null,

    processedAt:
      (row.processed_at as string | null) ??
      null,

    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: {
      user,
    },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  return user.id;
}

export async function getFinanceRequests(
  status?: FinanceRequest["status"],
) {
  let query = supabase
    .schema("finance")
    .from("finance_requests")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (status) {
    query = query.eq(
      "status",
      status,
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row) =>
      normalizeRequest(
        row as Record<string, unknown>,
      ),
  );
}

export async function createFinanceRequest(
  input: CreateFinanceRequestInput,
) {
  const userId =
    await getCurrentUserId();

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.tenant_id) {
    throw new Error(
      "Tenant information is missing.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("finance")
    .from("finance_requests")
    .insert({
      tenant_id:
        profile.tenant_id,

      event_type:
        input.eventType,

      module:
        input.module,

      source_type:
        input.sourceType,

      source_id:
        input.sourceId,

      candidate_id:
        input.candidateId ?? null,

      party_id:
        input.partyId ?? null,

      party_type:
        input.partyType ?? null,

      service_code:
        input.serviceCode ?? null,

      service_name:
        input.serviceName ?? null,

      amount:
        input.amount,

      request_date:
        input.requestDate ??
        new Date()
          .toISOString()
          .slice(0, 10),

      account_id:
        input.accountId,

      category_id:
        input.categoryId ?? null,

      transaction_type:
        input.transactionType,

      description:
        input.description ?? null,

      reference:
        input.reference ?? null,

      idempotency_key:
        input.idempotencyKey,

      requested_by:
        userId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeRequest(
    data as Record<string, unknown>,
  );
}

export async function rejectFinanceRequest(
  requestId: string,
  reason: string,
) {
  const userId =
    await getCurrentUserId();

  const {
    error,
  } = await supabase
    .schema("finance")
    .from("finance_requests")
    .update({
      status: "rejected",
      rejected_by: userId,
      rejected_at:
        new Date().toISOString(),
      rejection_reason:
        reason.trim(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

export async function approveFinanceRequest(
  requestId: string,
) {
  const userId =
    await getCurrentUserId();

  /*
   * Lock the request logically first.
   *
   * Only a pending request can move forward.
   */
  const {
    data: requestRow,
    error: requestError,
  } = await supabase
    .schema("finance")
    .from("finance_requests")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at:
        new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (requestError) {
    throw requestError;
  }

  if (!requestRow) {
    throw new Error(
      "This Finance request is no longer pending.",
    );
  }

  const request =
    normalizeRequest(
      requestRow as Record<string, unknown>,
    );

  try {
    const event: FinanceEventInput = {
      event:
        request.eventType,

      module:
        request.module,

      source: {
        type:
          request.sourceType,
        id:
          request.sourceId,
      },

      candidateId:
        request.candidateId,

      party:
        request.partyId &&
        request.partyType
          ? {
              type:
                request.partyType,
              id:
                request.partyId,
            }
          : null,

      service:
        request.serviceCode &&
        request.serviceName
          ? {
              code:
                request.serviceCode,
              name:
                request.serviceName,
            }
          : null,

      amount:
        request.amount,

      date:
        request.requestDate,

      description:
        request.description,

      reference:
        request.reference,

      finance: {
        accountId:
          request.accountId,

        categoryId:
          request.categoryId,

        partyId:
          request.partyId,

        transactionType:
          request.transactionType,
      },
    };

    const result =
      await recordFinanceEvent(
        event,
      );

    const {
      error: processedError,
    } = await supabase
      .schema("finance")
      .from("finance_requests")
      .update({
        status: "processed",
        transaction_group_id:
          result.transactionGroupId,
        processed_at:
          new Date().toISOString(),
        processing_error:
          null,
      })
      .eq("id", requestId);

    if (processedError) {
      throw processedError;
    }

    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown finance processing error.";

    await supabase
      .schema("finance")
      .from("finance_requests")
      .update({
        status: "failed",
        processing_error:
          message,
      })
      .eq("id", requestId);

    throw error;
  }
}