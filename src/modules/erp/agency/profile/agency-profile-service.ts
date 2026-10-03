import { supabase } from "@/lib/supabase/client";

import type { Agency } from "../agency-service";

export interface AgencyProfileTransaction {
  id: string;
  transactionDate: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  reference: string | null;
  status: string;
  accountName: string | null;
  categoryName: string | null;
  balance: number;
}

export interface AgencyFinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface AgencyProfileData {
  agency: Agency;
  transactions: AgencyProfileTransaction[];
  summary: AgencyFinancialSummary;
}

export async function getAgencyProfile(
  agencyId: string,
): Promise<AgencyProfileData> {
  /* =====================================================
   * AGENCY
   * ===================================================== */

  const { data: agency, error: agencyError } =
    await supabase
      .from("agencies")
      .select("*")
      .eq("id", agencyId)
      .maybeSingle();

  if (agencyError) {
    throw new Error(agencyError.message);
  }

  if (!agency) {
    throw new Error("Agency not found.");
  }

  /* =====================================================
   * FINANCE PARTY
   *
   * Agency profile → finance.parties
   *                  → finance.transactions
   * ===================================================== */

  const { data: party, error: partyError } =
    await supabase
      .schema("finance")
      .from("parties")
      .select("id")
      .eq("party_type", "agency")
      .eq("party_id", String(agencyId))
      .maybeSingle();

  if (partyError) {
    throw new Error(partyError.message);
  }

  /*
   * Agency may exist before its finance party
   * is created.
   */
  if (!party) {
    return {
      agency,
      transactions: [],
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
      },
    };
  }

  /* =====================================================
   * TRANSACTIONS
   * ===================================================== */

  const {
    data: transactionRows,
    error: transactionError,
  } = await supabase
    .schema("finance")
    .from("transactions")
    .select(
      `
        id,
        transaction_date,
        type,
        amount,
        description,
        reference,
        status,
        account_id,
        category_id
      `,
    )
    .eq("party_id", party.id)
    .order("transaction_date", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (transactionError) {
    throw new Error(transactionError.message);
  }

  const rows = transactionRows ?? [];

  /* =====================================================
   * ACCOUNT + CATEGORY MAPS
   * ===================================================== */

  const accountIds = [
    ...new Set(
      rows
        .map((row) => row.account_id)
        .filter(Boolean),
    ),
  ];

  const categoryIds = [
    ...new Set(
      rows
        .map((row) => row.category_id)
        .filter(Boolean),
    ),
  ];

  const [
    accountsResult,
    categoriesResult,
  ] = await Promise.all([
    accountIds.length > 0
      ? supabase
          .schema("finance")
          .from("accounts")
          .select("id, name")
          .in("id", accountIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    categoryIds.length > 0
      ? supabase
          .schema("finance")
          .from("categories")
          .select("id, name")
          .in("id", categoryIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (accountsResult.error) {
    throw new Error(
      accountsResult.error.message,
    );
  }

  if (categoriesResult.error) {
    throw new Error(
      categoriesResult.error.message,
    );
  }

  const accountMap = new Map(
    (accountsResult.data ?? []).map(
      (account) => [
        account.id,
        account.name,
      ],
    ),
  );

  const categoryMap = new Map(
    (categoriesResult.data ?? []).map(
      (category) => [
        category.id,
        category.name,
      ],
    ),
  );

  /* =====================================================
   * RUNNING BALANCE
   *
   * Calculate oldest → newest.
   * Then display newest → oldest.
   * ===================================================== */

  let runningBalance = 0;

  let totalIncome = 0;
  let totalExpense = 0;

  const chronologicalTransactions =
    rows.map((row) => {
      const amount = Number(row.amount);

      if (row.type === "income") {
        totalIncome += amount;
        runningBalance += amount;
      } else {
        totalExpense += amount;
        runningBalance -= amount;
      }

      return {
        id: row.id,

        transactionDate:
          row.transaction_date,

        type:
          row.type as
            | "income"
            | "expense",

        amount,

        description:
          row.description,

        reference:
          row.reference,

        status:
          row.status,

        accountName:
          accountMap.get(
            row.account_id,
          ) ?? null,

        categoryName:
          row.category_id
            ? categoryMap.get(
                row.category_id,
              ) ?? null
            : null,

        balance:
          runningBalance,
      };
    });

  /* =====================================================
   * DISPLAY NEWEST FIRST
   * ===================================================== */

  chronologicalTransactions.reverse();

  return {
    agency,

    transactions:
      chronologicalTransactions,

    summary: {
      totalIncome,
      totalExpense,
      balance: runningBalance,
      transactionCount: rows.length,
    },
  };
}