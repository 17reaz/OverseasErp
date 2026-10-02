import { supabase } from "@/lib/supabase/client";

import type {
  CreateTransactionGroupInput,
  Transaction,
  TransactionGroup,
} from "./transaction-types";

import {
  getTransactionAccounts,
  getTransactionCategories,
  getTransactionParties,
} from "./transaction-service";


async function getCurrentUserContext() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error } =
    await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile?.tenant_id) {
    throw new Error(
      "Your account is not linked to a tenant.",
    );
  }

  return {
    userId: user.id,
    tenantId: profile.tenant_id as string,
  };
}


/* =========================================================
 * GET GROUPS
 * ========================================================= */

export async function getTransactionGroups(): Promise<
  TransactionGroup[]
> {
  const [
    accounts,
    categories,
    parties,
  ] = await Promise.all([
    getTransactionAccounts(),
    getTransactionCategories(),
    getTransactionParties(),
  ]);


  const { data: groups, error: groupError } =
    await supabase
      .schema("finance")
      .from("transaction_groups")
      .select(
        `
          id,
          tenant_id,
          group_date,
          description,
          reference,
          status,
          created_by,
          created_at,
          updated_at
        `,
      )
      .order("group_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });


  if (groupError) {
    throw new Error(groupError.message);
  }


  const { data: transactions, error } =
    await supabase
      .schema("finance")
      .from("transactions")
      .select(
        `
          id,
          tenant_id,
          group_id,
          account_id,
          category_id,
          type,
          amount,
          transaction_date,
          description,
          reference,
          status,
          party_id,
          created_by,
          created_at,
          updated_at
        `,
      )
      .not("group_id", "is", null)
      .order("transaction_date", {
        ascending: false,
      });


  if (error) {
    throw new Error(error.message);
  }


  const accountMap =
    new Map(
      accounts.map((item) => [
        item.id,
        item,
      ]),
    );

  const categoryMap =
    new Map(
      categories.map((item) => [
        item.id,
        item,
      ]),
    );

  const partyMap =
    new Map(
      parties.map((item) => [
        item.id,
        item,
      ]),
    );


  const normalizedTransactions: Transaction[] =
    (transactions ?? []).map((row) => ({
      id: row.id,

      tenantId:
        row.tenant_id,

      groupId:
        row.group_id,

      accountId:
        row.account_id,

      categoryId:
        row.category_id,

      type:
        row.type as Transaction["type"],

      amount:
        Number(row.amount),

      date:
        row.transaction_date,

      description:
        row.description,

      reference:
        row.reference,

      status:
        row.status as Transaction["status"],

      partyId:
        row.party_id,

      createdBy:
        row.created_by,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,

      account:
        accountMap.get(
          row.account_id,
        ) ?? null,

      category:
        row.category_id
          ? categoryMap.get(
              row.category_id,
            ) ?? null
          : null,

      party:
        row.party_id
          ? partyMap.get(
              row.party_id,
            ) ?? null
          : null,
    }));


  return (groups ?? []).map(
    (group) => {
      const groupTransactions =
        normalizedTransactions.filter(
          (transaction) =>
            transaction.groupId ===
            group.id,
        );


      const totalIncome =
        groupTransactions
          .filter(
            (item) =>
              item.type === "income",
          )
          .reduce(
            (sum, item) =>
              sum + item.amount,
            0,
          );


      const totalExpense =
        groupTransactions
          .filter(
            (item) =>
              item.type === "expense",
          )
          .reduce(
            (sum, item) =>
              sum + item.amount,
            0,
          );


      return {
        id: group.id,

        tenantId:
          group.tenant_id,

        groupDate:
          group.group_date,

        description:
          group.description,

        reference:
          group.reference,

        status:
          group.status as TransactionGroup["status"],

        createdBy:
          group.created_by,

        createdAt:
          group.created_at,

        updatedAt:
          group.updated_at,

        transactions:
          groupTransactions,

        totalIncome,

        totalExpense,

        netAmount:
          totalIncome -
          totalExpense,
      };
    },
  );
}


/* =========================================================
 * CREATE GROUP
 * ========================================================= */

export async function createTransactionGroup(
  input: CreateTransactionGroupInput,
): Promise<TransactionGroup> {
  const {
    userId,
    tenantId,
  } = await getCurrentUserContext();


  if (
    !input.transactions.length
  ) {
    throw new Error(
      "At least one transaction is required.",
    );
  }


  for (
    const transaction of input.transactions
  ) {
    if (
      !transaction.accountId
    ) {
      throw new Error(
        "Every transaction must have an account.",
      );
    }

    if (
      !transaction.amount ||
      transaction.amount <= 0
    ) {
      throw new Error(
        "Every transaction amount must be greater than zero.",
      );
    }
  }


  const {
    data: group,
    error: groupError,
  } =
    await supabase
      .schema("finance")
      .from("transaction_groups")
      .insert({
        tenant_id:
          tenantId,

        group_date:
          input.groupDate,

        description:
          input.description,

        reference:
          input.reference,

        status:
          input.status,

        created_by:
          userId,
      })
      .select()
      .single();


  if (groupError) {
    throw new Error(
      groupError.message,
    );
  }


  const rows =
    input.transactions.map(
      (transaction) => ({
        tenant_id:
          tenantId,

        group_id:
          group.id,

        account_id:
          transaction.accountId,

        category_id:
          transaction.categoryId,

        type:
          transaction.type,

        amount:
          transaction.amount,

        transaction_date:
          transaction.date,

        description:
          transaction.description,

        reference:
          transaction.reference,

        status:
          transaction.status,

        party_id:
          transaction.partyId,

        created_by:
          userId,
      }),
    );


  const {
    error: transactionError,
  } =
    await supabase
      .schema("finance")
      .from("transactions")
      .insert(rows);


  if (transactionError) {
    await supabase
      .schema("finance")
      .from("transaction_groups")
      .delete()
      .eq("id", group.id);

    throw new Error(
      transactionError.message,
    );
  }


  const groups =
    await getTransactionGroups();

  const created =
    groups.find(
      (item) =>
        item.id === group.id,
    );


  if (!created) {
    throw new Error(
      "Transaction group was created but could not be loaded.",
    );
  }


  return created;
}


/* =========================================================
 * DELETE GROUP
 * ========================================================= */

export async function deleteTransactionGroup(
  id: string,
): Promise<void> {
  const { error } =
    await supabase
      .schema("finance")
      .from("transaction_groups")
      .delete()
      .eq("id", id);

  if (error) {
    throw new Error(
      error.message,
    );
  }
}