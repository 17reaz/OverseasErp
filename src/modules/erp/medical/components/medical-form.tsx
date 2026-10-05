import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Checkbox,
} from "@/components/ui/checkbox";

import {
  Check,
  ChevronsUpDown,
  Lock,
  Wallet,
  Building2,
  Receipt,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  UniversalSheet,
} from "../../shared/forms/universal-sheet";

import {
  FormSection,
} from "../../shared/forms/form-section";

import {
  cn,
} from "@/lib/utils";

import {
  createMedical,
  updateMedical,
  type Medical,
  type MedicalCandidate,
  type MedicalStatus,
} from "../medical-service";

import {
  getTransactionAccounts,
  getTransactionCategories,
  getTransactionParties,
} from "@/modules/erp/accounts/transactions/transaction-service";

import type {
  TransactionAccount,
  TransactionCategory,
  TransactionParty,
} from "@/modules/erp/accounts/transactions/transaction-types";

interface MedicalFormProps {
  open: boolean;

  medical: Medical | null;

  selectedCandidate:
    | MedicalCandidate
    | null;

  candidates:
    MedicalCandidate[];

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: () => void;
}

export function MedicalForm({
  open,
  medical,
  selectedCandidate,
  candidates,
  onOpenChange,
  onSuccess,
}: MedicalFormProps) {
  const [
    candidateId,
    setCandidateId,
  ] = useState("");

  const [
    medicalDate,
    setMedicalDate,
  ] = useState("");

  const [
    fitDate,
    setFitDate,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<MedicalStatus>(
    "new",
  );

  const [
    candidateOpen,
    setCandidateOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    advanceStage,
    setAdvanceStage,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * =========================================================
   * FINANCE STATE
   * =========================================================
   */

  const [
    financeEnabled,
    setFinanceEnabled,
  ] = useState(false);

  const [
    financeAmount,
    setFinanceAmount,
  ] = useState("");

  const [
    financeAccountId,
    setFinanceAccountId,
  ] = useState("");

  const [
    financeCategoryId,
    setFinanceCategoryId,
  ] = useState("");

  const [
    financeVendorId,
    setFinanceVendorId,
  ] = useState("");

  const [
    financeAccounts,
    setFinanceAccounts,
  ] = useState<TransactionAccount[]>(
    [],
  );

  const [
    financeCategories,
    setFinanceCategories,
  ] = useState<TransactionCategory[]>(
    [],
  );

  const [
    financeParties,
    setFinanceParties,
  ] = useState<TransactionParty[]>(
    [],
  );

  const [
    financeLoading,
    setFinanceLoading,
  ] = useState(false);

  const [
    financeError,
    setFinanceError,
  ] = useState("");

  /*
   * =========================================================
   * FIT CONFIRMATION
   * =========================================================
   */

  const [
    showFitConfirmation,
    setShowFitConfirmation,
  ] = useState(false);

  /*
   * =========================================================
   * CANDIDATE LOCK
   * =========================================================
   */

  const candidateLocked =
    Boolean(
      medical ||
      selectedCandidate,
    );

  /*
   * =========================================================
   * VENDOR LIST
   * =========================================================
   */

  const vendors = useMemo(
    () =>
      financeParties.filter(
        (party) =>
          party.partyType ===
          "vendor",
      ),
    [financeParties],
  );

  /*
   * =========================================================
   * EXPENSE CATEGORIES
   * =========================================================
   *
   * Only categories suitable for expense
   * transactions are shown.
   *
   * If the category type is unavailable or
   * different in the current database, we
   * simply keep all active categories.
   */

  const expenseCategories = useMemo(() => {
    const expenses =
      financeCategories.filter(
        (category) =>
          category.type ===
          "expense",
      );

    return expenses.length > 0
      ? expenses
      : financeCategories;
  }, [financeCategories]);

  /*
   * =========================================================
   * LOAD FINANCE OPTIONS
   * =========================================================
   *
   * Finance options are loaded only when creating
   * a Medical record.
   *
   * Editing an existing Medical does not create
   * a new Finance event.
   */

  useEffect(() => {
    if (!open || medical) {
      return;
    }

    let cancelled = false;

    async function loadFinanceOptions() {
      try {
        setFinanceLoading(true);
        setFinanceError("");

        const [
          accounts,
          categories,
          parties,
        ] = await Promise.all([
          getTransactionAccounts(),
          getTransactionCategories(),
          getTransactionParties(),
        ]);

        if (cancelled) {
          return;
        }

        setFinanceAccounts(
          accounts,
        );

        setFinanceCategories(
          categories,
        );

        setFinanceParties(
          parties,
        );
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load Finance options:",
          loadError,
        );

        setFinanceError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load Finance options.",
        );
      } finally {
        if (!cancelled) {
          setFinanceLoading(false);
        }
      }
    }

    void loadFinanceOptions();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    medical,
  ]);

  /*
   * =========================================================
   * RESET / LOAD FORM
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (medical) {
      setCandidateId(
        medical.candidate_id,
      );

      setMedicalDate(
        medical.medical_date ??
          "",
      );

      setFitDate(
        medical.fit_date ??
          "",
      );

      setStatus(
        medical.status,
      );

      /*
       * Finance is intentionally disabled
       * while editing.
       */
      setFinanceEnabled(
        false,
      );

      setFinanceAmount(
        "",
      );

      setFinanceAccountId(
        "",
      );

      setFinanceCategoryId(
        "",
      );

      setFinanceVendorId(
        "",
      );
    } else if (
      selectedCandidate
    ) {
      setCandidateId(
        selectedCandidate.id,
      );

      setMedicalDate(
        "",
      );

      setFitDate(
        "",
      );

      setStatus(
        "new",
      );

      setFinanceEnabled(
        false,
      );

      setFinanceAmount(
        "",
      );

      setFinanceAccountId(
        "",
      );

      setFinanceCategoryId(
        "",
      );

      setFinanceVendorId(
        "",
      );

      setAdvanceStage(
        true,
      );
    } else {
      /*
       * Add Medical from toolbar.
       *
       * Candidate remains searchable.
       */

      setCandidateId(
        "",
      );

      setMedicalDate(
        "",
      );

      setFitDate(
        "",
      );

      setStatus(
        "new",
      );

      setFinanceEnabled(
        false,
      );

      setFinanceAmount(
        "",
      );

      setFinanceAccountId(
        "",
      );

      setFinanceCategoryId(
        "",
      );

      setFinanceVendorId(
        "",
      );

      setAdvanceStage(
        true,
      );
    }

    setCandidateOpen(
      false,
    );

    setError("");

    setFinanceError("");

    setShowFitConfirmation(
      false,
    );
  }, [
    medical,
    selectedCandidate,
    open,
  ]);

  /*
   * =========================================================
   * CURRENT CANDIDATE
   * =========================================================
   */

  const currentCandidate =
    useMemo(
      () =>
        candidates.find(
          (candidate) =>
            candidate.id ===
            candidateId,
        ) ??
        selectedCandidate ??
        medical?.candidate ??
        null,
      [
        candidates,
        candidateId,
        selectedCandidate,
        medical,
      ],
    );

  /*
   * =========================================================
   * HAS CHANGES
   * =========================================================
   */

  const hasChanges =
    Boolean(
      candidateId ||
      medicalDate ||
      fitDate ||
      status !== "new" ||
      financeEnabled ||
      financeAmount ||
      financeAccountId ||
      financeCategoryId ||
      financeVendorId,
    );

  /*
   * =========================================================
   * STATUS CHANGE
   * =========================================================
   */

  function handleStatusChange(
    value: string,
  ) {
    const nextStatus =
      value as MedicalStatus;

    /*
     * New → Fit
     *
     * Do not change the actual
     * form state until confirmed.
     */

    if (
      status === "new" &&
      nextStatus === "fit"
    ) {
      setShowFitConfirmation(
        true,
      );

      return;
    }

    setStatus(
      nextStatus,
    );

    /*
     * Fit Date only belongs
     * to Fit status.
     */

    if (
      nextStatus !== "fit"
    ) {
      setFitDate(
        "",
      );
    }

    setError("");
  }

  /*
   * =========================================================
   * CONFIRM NEW → FIT
   * =========================================================
   */

  function handleConfirmFit() {
    setStatus(
      "fit",
    );

    /*
     * Automatically set today's
     * date when candidate becomes Fit.
     */

    setFitDate(
      new Date()
        .toISOString()
        .slice(0, 10),
    );

    setError("");

    setShowFitConfirmation(
      false,
    );
  }

  /*
   * =========================================================
   * FINANCE TOGGLE
   * =========================================================
   */

  function handleFinanceToggle(
    checked: boolean,
  ) {
    setFinanceEnabled(
      checked,
    );

    setFinanceError("");

    if (!checked) {
      /*
       * Clear Finance-only fields when
       * Finance is disabled.
       */

      setFinanceAmount(
        "",
      );

      setFinanceAccountId(
        "",
      );

      setFinanceCategoryId(
        "",
      );

      setFinanceVendorId(
        "",
      );
    }
  }

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    /*
     * Candidate required
     */

    if (!candidateId) {
      setError(
        "Candidate is required.",
      );

      return;
    }

    /*
     * Fit requires Fit Date
     */

    if (
      status === "fit" &&
      !fitDate
    ) {
      setError(
        "Fit date is required when status is Fit.",
      );

      return;
    }

    /*
     * =======================================================
     * FINANCE VALIDATION
     * =======================================================
     */

    if (
      !medical &&
      financeEnabled
    ) {
      const amount =
        Number(financeAmount);

      if (
        !financeAmount ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setError(
          "Medical cost must be greater than zero when Finance is enabled.",
        );

        return;
      }

      if (!financeAccountId) {
        setError(
          "Please select a Finance account.",
        );

        return;
      }
    }

    try {
      setLoading(
        true,
      );

      setError("");

      /*
       * =====================================================
       * BUILD INPUT
       * =====================================================
       */

      const input = {
        candidate_id:
          candidateId,

        medical_date:
          medicalDate ||
          null,

        fit_date:
          status === "fit"
            ? fitDate ||
              null
            : null,

        status,

        advance_stage:
          medical
            ? undefined
            : advanceStage,

        /*
         * Finance is only included when:
         *
         * 1. Creating a Medical
         * 2. User explicitly enabled Finance
         */

        ...(
          !medical &&
          financeEnabled
            ? {
                finance: {
                  enabled:
                    true,

                  amount:
                    Number(
                      financeAmount,
                    ),

                  accountId:
                    financeAccountId,

                  categoryId:
                    financeCategoryId ||
                    null,

                  partyId:
                    financeVendorId ||
                    null,

                  /*
                   * Medical cost is an expense.
                   */
                  transactionType:
                    "expense" as const,
                },
              }
            : {
                finance: {
                  enabled:
                    false,
                },
              }
        ),
      };

      const result =
        medical
          ? await updateMedical(
              medical.id,
              input,
            )
          : await createMedical(
              input,
            );

      if (
        result.error
      ) {
        throw result.error;
      }

      onSuccess();
    } catch (
      submitError
    ) {
      console.error(
        "Failed to save medical:",
        submitError,
      );

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Failed to save medical record.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <>
      <UniversalSheet
        open={
          open
        }
        onOpenChange={
          onOpenChange
        }
        title={
          medical
            ? "Edit Medical"
            : "Add Medical"
        }
        description={
          medical
            ? "Update the candidate medical record."
            : "Create a new candidate medical record."
        }
        onSubmit={
          handleSubmit
        }
        submitLabel={
          medical
            ? "Update Medical"
            : "Create Medical"
        }
        loading={
          loading
        }
        disabled={
          !candidateId
        }
        hasChanges={
          hasChanges
        }
      >
        {/* =====================================================
            ERROR
            ===================================================== */}

        {error && (
          <div
            className="
              rounded-md
              border
              border-destructive/30
              bg-destructive/10
              px-3
              py-2
              text-sm
              text-destructive
            "
          >
            {error}
          </div>
        )}

        {/* =====================================================
            CANDIDATE INFORMATION
            ===================================================== */}

        <FormSection
          title="Candidate Information"
          description={
            candidateLocked
              ? "Candidate is locked for this medical record."
              : "Select the candidate for this medical record."
          }
        >
          <div
            className="
              space-y-2
            "
          >
            <Label>
              Candidate
            </Label>

            {/* =================================================
                LOCKED CANDIDATE
                ================================================= */}

            {candidateLocked ? (
              <div
                className="
                  flex
                  min-h-10
                  w-full
                  items-center
                  justify-between
                  rounded-md
                  border
                  bg-muted/40
                  px-3
                  py-2
                "
              >
                <div
                  className="
                    min-w-0
                  "
                >
                  {currentCandidate ? (
                    <>
                      <p
                        className="
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {
                          currentCandidate.name
                        }
                      </p>

                      <p
                        className="
                          truncate
                          text-xs
                          text-muted-foreground
                        "
                      >
                        Passport:{" "}
                        {
                          currentCandidate.passport_no
                        }
                      </p>
                    </>
                  ) : (
                    <p
                      className="
                        text-sm
                        text-muted-foreground
                      "
                    >
                      Candidate
                    </p>
                  )}
                </div>

                <Lock
                  className="
                    ml-3
                    h-4
                    w-4
                    shrink-0
                    text-muted-foreground
                  "
                />
              </div>
            ) : (
              /* =================================================
                 SEARCHABLE CANDIDATE
                 ================================================= */

              <Popover
                open={
                  candidateOpen
                }
                onOpenChange={
                  setCandidateOpen
                }
              >
                <PopoverTrigger
                  asChild
                >
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={
                      candidateOpen
                    }
                    disabled={
                      loading
                    }
                    className="
                      w-full
                      justify-between
                      font-normal
                    "
                  >
                    {currentCandidate ? (
                      <span
                        className="
                          truncate
                        "
                      >
                        {
                          currentCandidate.name
                        }
                        {" — "}
                        {
                          currentCandidate.passport_no
                        }
                      </span>
                    ) : (
                      <span
                        className="
                          text-muted-foreground
                        "
                      >
                        Select candidate
                      </span>
                    )}

                    <ChevronsUpDown
                      className="
                        ml-2
                        h-4
                        w-4
                        shrink-0
                        opacity-50
                      "
                    />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  className="
                    w-[var(--radix-popover-trigger-width)]
                    p-0
                  "
                >
                  <Command>
                    <CommandInput
                      placeholder="
                        Search name or passport...
                      "
                    />

                    <CommandList>
                      <CommandEmpty>
                        No candidate found.
                      </CommandEmpty>

                      <CommandGroup>
                        {candidates.map(
                          (
                            candidate,
                          ) => (
                            <CommandItem
                              key={
                                candidate.id
                              }
                              value={`${candidate.name} ${candidate.passport_no}`}
                              onSelect={() => {
                                setCandidateId(
                                  candidate.id,
                                );

                                setCandidateOpen(
                                  false,
                                );

                                setError(
                                  "",
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  candidateId ===
                                    candidate.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />

                              <div>
                                <p
                                  className="
                                    text-sm
                                    font-medium
                                  "
                                >
                                  {
                                    candidate.name
                                  }
                                </p>

                                <p
                                  className="
                                    text-xs
                                    text-muted-foreground
                                  "
                                >
                                  Passport:{" "}
                                  {
                                    candidate.passport_no
                                  }
                                </p>
                              </div>
                            </CommandItem>
                          ),
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* ===================================================
              ADVANCE STAGE
              =================================================== */}

          {!medical && (
            <label
              className="
                mt-3
                flex
                items-start
                gap-2
                text-sm
              "
            >
              <Checkbox
                checked={
                  advanceStage
                }
                onCheckedChange={(
                  checked,
                ) =>
                  setAdvanceStage(
                    checked === true,
                  )
                }
              />

              <span>
                Update candidate stage
                to Medical

                <span
                  className="
                    block
                    text-xs
                    text-muted-foreground
                  "
                >
                  Automatically move the
                  candidate into the Medical stage.
                </span>
              </span>
            </label>
          )}
        </FormSection>

        {/* =====================================================
            MEDICAL INFORMATION
            ===================================================== */}

        <FormSection
          title="Medical Information"
          description="
            Enter medical examination details.
          "
        >
          <div
            className="
              space-y-4
            "
          >
            {/* =================================================
                MEDICAL DATE
                ================================================= */}

            <div
              className="
                space-y-2
              "
            >
              <Label
                htmlFor="medical-date"
              >
                Medical Date
              </Label>

              <Input
                id="medical-date"
                type="date"
                value={
                  medicalDate
                }
                onChange={(
                  event,
                ) =>
                  setMedicalDate(
                    event.target.value,
                  )
                }
                disabled={
                  loading
                }
              />
            </div>

            {/* =================================================
                STATUS
                ================================================= */}

            <div
              className="
                space-y-2
              "
            >
              <Label>
                Status
              </Label>

              <Select
                value={
                  status
                }
                onValueChange={
                  handleStatusChange
                }
                disabled={
                  loading
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem
                    value="new"
                  >
                    New
                  </SelectItem>

                  <SelectItem
                    value="fit"
                  >
                    Fit
                  </SelectItem>

                  <SelectItem
                    value="unfit"
                  >
                    Unfit
                  </SelectItem>

                  <SelectItem
                    value="expired"
                  >
                    Expired
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* =================================================
                FIT DATE
                ================================================= */}

            {status ===
              "fit" && (
              <div
                className="
                  space-y-2
                "
              >
                <Label
                  htmlFor="fit-date"
                >
                  Fit Date
                </Label>

                <Input
                  id="fit-date"
                  type="date"
                  value={
                    fitDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setFitDate(
                      event.target.value,
                    )
                  }
                  disabled={
                    loading
                  }
                />

                <p
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Fit date is automatically
                  set when a New medical is
                  confirmed as Fit.
                </p>
              </div>
            )}
          </div>
        </FormSection>

        {/* =====================================================
            FINANCE
            ===================================================== */}

        {!medical && (
          <FormSection
            title="Finance"
            description="
              Optional. Enable this only when the Medical
              service has a financial cost that should be
              recorded in Finance.
            "
          >
            {/* =================================================
                FINANCE ENABLE
                ================================================= */}

            <div
              className="
                rounded-lg
                border
                bg-muted/20
                p-3
              "
            >
              <label
                className="
                  flex
                  cursor-pointer
                  items-start
                  gap-3
                "
              >
                <Checkbox
                  checked={
                    financeEnabled
                  }
                  onCheckedChange={(
                    checked,
                  ) =>
                    handleFinanceToggle(
                      checked === true,
                    )
                  }
                  disabled={
                    loading ||
                    financeLoading
                  }
                  className="
                    mt-0.5
                  "
                />

                <div
                  className="
                    min-w-0
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Receipt
                      className="
                        h-4
                        w-4
                        text-muted-foreground
                      "
                    />

                    <span
                      className="
                        text-sm
                        font-medium
                      "
                    >
                      Record this Medical in Finance
                    </span>
                  </div>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-relaxed
                      text-muted-foreground
                    "
                  >
                    Turn this on when the Medical
                    is performed by a vendor or
                    creates an actual financial cost.
                  </p>
                </div>
              </label>
            </div>

            {/* =================================================
                FINANCE DETAILS
                ================================================= */}

            {financeEnabled && (
              <div
                className="
                  mt-4
                  space-y-4
                  rounded-lg
                  border
                  bg-background
                  p-4
                "
              >
                {financeError && (
                  <div
                    className="
                      rounded-md
                      border
                      border-destructive/30
                      bg-destructive/10
                      px-3
                      py-2
                      text-xs
                      text-destructive
                    "
                  >
                    {financeError}
                  </div>
                )}

                {/* =============================================
                    COST
                    ============================================= */}

                <div
                  className="
                    space-y-2
                  "
                >
                  <Label
                    htmlFor="medical-finance-cost"
                  >
                    Medical Cost
                    <span
                      className="
                        ml-1
                        text-destructive
                      "
                    >
                      *
                    </span>
                  </Label>

                  <div
                    className="
                      relative
                    "
                  >
                    <Receipt
                      className="
                        absolute
                        left-3
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <Input
                      id="medical-finance-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        financeAmount
                      }
                      onChange={(
                        event,
                      ) =>
                        setFinanceAmount(
                          event.target.value,
                        )
                      }
                      disabled={
                        loading ||
                        financeLoading
                      }
                      className="
                        pl-9
                      "
                    />
                  </div>

                  <p
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    This will be recorded as a
                    Medical service expense.
                  </p>
                </div>

                {/* =============================================
                    ACCOUNT
                    ============================================= */}

                <div
                  className="
                    space-y-2
                  "
                >
                  <Label>
                    Finance Account
                    <span
                      className="
                        ml-1
                        text-destructive
                      "
                    >
                      *
                    </span>
                  </Label>

                  <Select
                    value={
                      financeAccountId
                    }
                    onValueChange={
                      setFinanceAccountId
                    }
                    disabled={
                      loading ||
                      financeLoading
                    }
                  >
                    <SelectTrigger>
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <Wallet
                          className="
                            h-4
                            w-4
                            text-muted-foreground
                          "
                        />

                        <SelectValue
                          placeholder={
                            financeLoading
                              ? "Loading accounts..."
                              : "Select account"
                          }
                        />
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      {financeAccounts.length ===
                      0 ? (
                        <SelectItem
                          value="__no_accounts__"
                          disabled
                        >
                          No active Finance account
                        </SelectItem>
                      ) : (
                        financeAccounts.map(
                          (
                            account,
                          ) => (
                            <SelectItem
                              key={
                                account.id
                              }
                              value={
                                account.id
                              }
                            >
                              {account.name}
                              {account.currency
                                ? ` • ${account.currency}`
                                : ""}
                            </SelectItem>
                          ),
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <p
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    The account from which this
                    Medical cost is financially tracked.
                  </p>
                </div>

                {/* =============================================
                    CATEGORY
                    ============================================= */}

                <div
                  className="
                    space-y-2
                  "
                >
                  <Label>
                    Expense Category
                  </Label>

                  <Select
                    value={
                      financeCategoryId ||
                      "__none__"
                    }
                    onValueChange={(
                      value,
                    ) =>
                      setFinanceCategoryId(
                        value ===
                          "__none__"
                          ? ""
                          : value,
                      )
                    }
                    disabled={
                      loading ||
                      financeLoading
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select category (optional)"
                      />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem
                        value="__none__"
                      >
                        No category
                      </SelectItem>

                      {expenseCategories.map(
                        (
                          category,
                        ) => (
                          <SelectItem
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* =============================================
                    VENDOR
                    ============================================= */}

                <div
                  className="
                    space-y-2
                  "
                >
                  <Label>
                    Medical Vendor
                    <span
                      className="
                        ml-1
                        text-xs
                        font-normal
                        text-muted-foreground
                      "
                    >
                      Optional
                    </span>
                  </Label>

                  <Select
                    value={
                      financeVendorId ||
                      "__none__"
                    }
                    onValueChange={(
                      value,
                    ) =>
                      setFinanceVendorId(
                        value ===
                          "__none__"
                          ? ""
                          : value,
                      )
                    }
                    disabled={
                      loading ||
                      financeLoading
                    }
                  >
                    <SelectTrigger>
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <Building2
                          className="
                            h-4
                            w-4
                            text-muted-foreground
                          "
                        />

                        <SelectValue
                          placeholder="Select vendor (optional)"
                        />
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem
                        value="__none__"
                      >
                        No vendor
                      </SelectItem>

                      {vendors.length ===
                      0 ? (
                        <SelectItem
                          value="__no_vendors__"
                          disabled
                        >
                          No active vendors found
                        </SelectItem>
                      ) : (
                        vendors.map(
                          (
                            vendor,
                          ) => (
                            <SelectItem
                              key={
                                vendor.id
                              }
                              value={
                                vendor.id
                              }
                            >
                              {
                                vendor.name
                              }
                              {vendor.phone
                                ? ` • ${vendor.phone}`
                                : ""}
                            </SelectItem>
                          ),
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <p
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    Select the vendor/agency that
                    performed this Medical. This is
                    optional for internally handled services.
                  </p>
                </div>

                {/* =============================================
                    FINANCE SUMMARY
                    ============================================= */}

                <div
                  className="
                    rounded-md
                    border
                    bg-muted/30
                    px-3
                    py-2.5
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <span
                      className="
                        text-xs
                        text-muted-foreground
                      "
                    >
                      Finance effect
                    </span>

                    <span
                      className="
                        text-sm
                        font-medium
                      "
                    >
                      Expense
                    </span>
                  </div>

                  {financeAmount && (
                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >
                      <span
                        className="
                          text-xs
                          text-muted-foreground
                        "
                      >
                        Amount
                      </span>

                      <span
                        className="
                          text-sm
                          font-semibold
                        "
                      >
                        {financeAmount}
                      </span>
                    </div>
                  )}

                  {financeVendorId && (
                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >
                      <span
                        className="
                          text-xs
                          text-muted-foreground
                        "
                      >
                        Vendor
                      </span>

                      <span
                        className="
                          max-w-[65%]
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {vendors.find(
                          (
                            vendor,
                          ) =>
                            vendor.id ===
                            financeVendorId,
                        )?.name ??
                          "Selected vendor"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </FormSection>
        )}
      </UniversalSheet>

      {/* =======================================================
          NEW → FIT CONFIRMATION
          ======================================================= */}

      <AlertDialog
        open={
          showFitConfirmation
        }
        onOpenChange={
          setShowFitConfirmation
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Medical Fit
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to
              mark{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >
                {
                  currentCandidate?.name ??
                  "this candidate"
                }
              </span>

              {" "}as Fit?

              <br />

              This will move the medical
              record from{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >
                New
              </span>

              {" "}to{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >
                Fit
              </span>

              {" "}and set the Fit Date
              automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={
                handleConfirmFit
              }
            >
              Confirm Fit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}