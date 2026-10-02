import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

import {
  createTransactionGroup,
} from "../transaction-group-service";

import type {
  CreateTransactionInput,
  TransactionAccount,
  TransactionCategory,
  TransactionGroupStatus,
  TransactionParty,
  TransactionType,
} from "../transaction-types";


interface TransactionGroupSheetProps {
  open: boolean;

  onOpenChange:
    (open: boolean) => void;

  accounts:
    TransactionAccount[];

  categories:
    TransactionCategory[];

  parties:
    TransactionParty[];

  onSuccess:
    () => void;
}


function createEmptyLine(
  accounts: TransactionAccount[],
): CreateTransactionInput {
  return {
    type: "income",

    amount: 0,

    date: new Date()
      .toISOString()
      .slice(0, 10),

    accountId:
      accounts[0]?.id ?? "",

    categoryId:
      null,

    description:
      "",

    reference:
      "",

    status:
      "completed",

    partyId:
      null,

    groupId:
      null,
  };
}


export function TransactionGroupSheet({
  open,
  onOpenChange,
  accounts,
  categories,
  parties,
  onSuccess,
}: TransactionGroupSheetProps) {
  const [
    groupDate,
    setGroupDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    reference,
    setReference,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<TransactionGroupStatus>(
      "completed",
    );

  const [
    lines,
    setLines,
  ] = useState<
    CreateTransactionInput[]
  >([]);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    if (!open) {
      return;
    }

    setGroupDate(
      new Date()
        .toISOString()
        .slice(0, 10),
    );

    setDescription("");
    setReference("");
    setStatus("completed");

    setLines([
      createEmptyLine(accounts),
    ]);

    setError("");
  }, [
    open,
    accounts,
  ]);


  function updateLine(
    index: number,
    field: keyof CreateTransactionInput,
    value: unknown,
  ) {
    setLines((current) =>
      current.map(
        (line, lineIndex) =>
          lineIndex === index
            ? {
                ...line,
                [field]: value,
              }
            : line,
      ),
    );
  }


  function addLine() {
    setLines((current) => [
      ...current,
      createEmptyLine(accounts),
    ]);
  }


  function removeLine(
    index: number,
  ) {
    setLines((current) =>
      current.filter(
        (_, lineIndex) =>
          lineIndex !== index,
      ),
    );
  }


  function getCategories(
    type: TransactionType,
  ) {
    return categories.filter(
      (category) =>
        category.type === type &&
        category.isActive,
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");


    if (!groupDate) {
      setError(
        "Group date is required.",
      );
      return;
    }


    if (!lines.length) {
      setError(
        "Add at least one transaction.",
      );
      return;
    }


    for (
      const line of lines
    ) {
      if (!line.accountId) {
        setError(
          "Every transaction needs an account.",
        );
        return;
      }

      if (
        !line.amount ||
        line.amount <= 0
      ) {
        setError(
          "Every transaction amount must be greater than zero.",
        );
        return;
      }
    }


    try {
      setSaving(true);


      await createTransactionGroup({
        groupDate,

        description:
          description.trim() ||
          null,

        reference:
          reference.trim() ||
          null,

        status,

        transactions:
          lines.map(
            (line) => ({
              ...line,

              description:
                line.description
                  ?.trim() || null,

              reference:
                line.reference
                  ?.trim() || null,
            }),
          ),
      });


      onSuccess();

      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create transaction group.",
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New Transaction Group"
      description="Create one business event containing multiple actual money movements."
      onSubmit={handleSubmit}
      submitLabel="Save Transaction Group"
      loading={saving}
      hasChanges={true}
    >
      <div className="space-y-6">

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}


        {/* GROUP HEADER */}

        <div className="space-y-4 rounded-lg border p-4">

          <div className="space-y-2">
            <Label>
              Group Date
            </Label>

            <Input
              type="date"
              value={groupDate}
              onChange={(event) =>
                setGroupDate(
                  event.target.value,
                )
              }
            />
          </div>


          <div className="space-y-2">
            <Label>
              Description
            </Label>

            <Textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Example: Candidate payment + agency payment"
              rows={2}
            />
          </div>


          <div className="space-y-2">
            <Label>
              Reference
            </Label>

            <Input
              value={reference}
              onChange={(event) =>
                setReference(
                  event.target.value,
                )
              }
              placeholder="Receipt / invoice / event reference"
            />
          </div>


          <div className="space-y-2">
            <Label>
              Status
            </Label>

            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(
                  value as TransactionGroupStatus,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="pending">
                  Pending
                </SelectItem>

                <SelectItem value="completed">
                  Completed
                </SelectItem>

                <SelectItem value="cancelled">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>


        {/* TRANSACTION LINES */}

        <div className="space-y-3">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                Money Movements
              </h3>

              <p className="text-xs text-muted-foreground">
                These are actual income/expense movements.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addLine}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </div>


          {lines.map(
            (line, index) => {
              const lineCategories =
                getCategories(
                  line.type,
                );

              return (
                <div
                  key={index}
                  className="space-y-4 rounded-lg border p-4"
                >

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Transaction {index + 1}
                    </span>

                    {lines.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          removeLine(index)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>


                  <div className="grid grid-cols-2 gap-2">

                    <Button
                      type="button"
                      variant={
                        line.type === "income"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateLine(
                          index,
                          "type",
                          "income",
                        )
                      }
                    >
                      Income
                    </Button>

                    <Button
                      type="button"
                      variant={
                        line.type === "expense"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateLine(
                          index,
                          "type",
                          "expense",
                        )
                      }
                    >
                      Expense
                    </Button>

                  </div>


                  <div className="space-y-2">
                    <Label>
                      Amount
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        line.amount === 0
                          ? ""
                          : line.amount
                      }
                      onChange={(event) =>
                        updateLine(
                          index,
                          "amount",
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label>
                      Account
                    </Label>

                    <Select
                      value={
                        line.accountId
                      }
                      onValueChange={(value) =>
                        updateLine(
                          index,
                          "accountId",
                          value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>

                      <SelectContent>
                        {accounts.map(
                          (account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id}
                            >
                              {account.name}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>


                  <div className="space-y-2">
                    <Label>
                      Category
                    </Label>

                    <Select
                      value={
                        line.categoryId ??
                        "none"
                      }
                      onValueChange={(value) =>
                        updateLine(
                          index,
                          "categoryId",
                          value === "none"
                            ? null
                            : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="none">
                          No category
                        </SelectItem>

                        {lineCategories.map(
                          (category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id}
                            >
                              {category.name}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>


                  <div className="space-y-2">
                    <Label>
                      Related Party
                    </Label>

                    <Select
                      value={
                        line.partyId ??
                        "none"
                      }
                      onValueChange={(value) =>
                        updateLine(
                          index,
                          "partyId",
                          value === "none"
                            ? null
                            : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="none">
                          None
                        </SelectItem>

                        {parties.map(
                          (party) => (
                            <SelectItem
                              key={party.id}
                              value={party.id}
                            >
                              {party.name}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>


                  <div className="space-y-2">
                    <Label>
                      Description
                    </Label>

                    <Input
                      value={
                        line.description ??
                        ""
                      }
                      onChange={(event) =>
                        updateLine(
                          index,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="What happened?"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label>
                      Reference
                    </Label>

                    <Input
                      value={
                        line.reference ??
                        ""
                      }
                      onChange={(event) =>
                        updateLine(
                          index,
                          "reference",
                          event.target.value,
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>

                </div>
              );
            },
          )}

        </div>

      </div>
    </UniversalSheet>
  );
}