import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processed"
  | "failed";

type RequestType =
  | "income"
  | "expense";

interface AccountRequest {
  id: string;

  module: string;
  event: string;

  sourceType: string;
  sourceId: string;

  candidateId?: string | null;
  candidateName?: string | null;

  partyId?: string | null;
  partyName?: string | null;
  partyType?: string | null;

  serviceName?: string | null;
  serviceCode?: string | null;

  amount: number;
  transactionType: RequestType;

  accountName?: string | null;
  categoryName?: string | null;

  description?: string | null;
  reference?: string | null;

  requestDate: string;

  requestedBy?: string | null;

  status: RequestStatus;

  rejectionReason?: string | null;

  transactionGroupId?: string | null;

  createdAt: string;
}

/*
 * ------------------------------------------------------------------
 * TEMP DATA ADAPTER
 * ------------------------------------------------------------------
 *
 * This page is UI-ready.
 *
 * Later replace:
 *
 *   loadAccountRequests()
 *   approveAccountRequest()
 *   rejectAccountRequest()
 *
 * with the real Accounts request service.
 *
 * No dummy transaction is created here.
 */

async function loadAccountRequests(): Promise<
  AccountRequest[]
> {
  /*
   * TODO:
   *
   * return getAccountRequests();
   */

  return [];
}


async function approveAccountRequest(
  request: AccountRequest,
): Promise<void> {
  /*
   * TODO:
   *
   * This should eventually:
   *
   * 1. Load request
   * 2. Validate it is pending
   * 3. Build CreateTransactionGroupInput
   * 4. Call existing:
   *
   *    createTransactionGroup(...)
   *
   * 5. Mark request as processed
   */

  console.log(
    "Approve account request:",
    request.id,
  );
}


async function rejectAccountRequest(
  request: AccountRequest,
  reason: string,
): Promise<void> {
  /*
   * TODO:
   *
   * Update request:
   *
   * status = rejected
   * rejection_reason = reason
   */

  console.log(
    "Reject account request:",
    request.id,
    reason,
  );
}


/*
 * ------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------
 */

function formatCurrency(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}


function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}


function label(
  value: string,
) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


function statusClass(
  status: RequestStatus,
) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";

    case "processed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "approved":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";

    case "rejected":
    case "failed":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";

    default:
      return "";
  }
}


/*
 * ------------------------------------------------------------------
 * PAGE
 * ------------------------------------------------------------------
 */

export function AccountRequestsPage() {
  const [
    requests,
    setRequests,
  ] = useState<AccountRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<
    RequestStatus | "all"
  >("pending");

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<AccountRequest | null>(
    null,
  );

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    rejectOpen,
    setRejectOpen,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(
    null,
  );


  /*
   * --------------------------------------------------------------
   * LOAD
   * --------------------------------------------------------------
   */

  const loadRequests =
    useCallback(
      async () => {
        try {
          const data =
            await loadAccountRequests();

          setRequests(data);
        } catch (error) {
          console.error(
            "Failed to load account requests:",
            error,
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);


  /*
   * --------------------------------------------------------------
   * COUNTS
   * --------------------------------------------------------------
   */

  const pendingCount =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            "pending",
        ).length,
      [requests],
    );

  const processedCount =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            "processed",
        ).length,
      [requests],
    );

  const rejectedCount =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            "rejected",
        ).length,
      [requests],
    );


  /*
   * --------------------------------------------------------------
   * FILTER
   * --------------------------------------------------------------
   */

  const filteredRequests =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          if (
            filter !== "all" &&
            request.status !==
              filter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            request.module,
            request.event,
            request.serviceName,
            request.serviceCode,
            request.candidateName,
            request.partyName,
            request.accountName,
            request.categoryName,
            request.reference,
            request.description,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(query),
            );
        },
      );
    }, [
      requests,
      search,
      filter,
    ]);


  /*
   * --------------------------------------------------------------
   * APPROVE
   * --------------------------------------------------------------
   */

  async function handleApprove(
    request: AccountRequest,
  ) {
    if (
      request.status !== "pending"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Approve ${formatCurrency(request.amount)} ${request.transactionType} transaction?`,
      );

    if (!confirmed) {
      return;
    }

    setProcessingId(
      request.id,
    );

    try {
      await approveAccountRequest(
        request,
      );

      setRequests(
        (previous) =>
          previous.map(
            (item) =>
              item.id === request.id
                ? {
                    ...item,
                    status:
                      "processed",
                  }
                : item,
          ),
      );

      setSelectedRequest(
        (previous) =>
          previous?.id === request.id
            ? {
                ...previous,
                status:
                  "processed",
              }
            : previous,
      );
    } catch (error) {
      console.error(
        "Failed to approve account request:",
        error,
      );
    } finally {
      setProcessingId(null);
    }
  }


  /*
   * --------------------------------------------------------------
   * REJECT
   * --------------------------------------------------------------
   */

  function openReject(
    request: AccountRequest,
  ) {
    setSelectedRequest(
      request,
    );

    setRejectionReason("");

    setRejectOpen(true);
  }


  async function handleReject() {
    if (
      !selectedRequest ||
      selectedRequest.status !==
        "pending"
    ) {
      return;
    }

    if (
      !rejectionReason.trim()
    ) {
      return;
    }

    setProcessingId(
      selectedRequest.id,
    );

    try {
      await rejectAccountRequest(
        selectedRequest,
        rejectionReason,
      );

      setRequests(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              selectedRequest.id
                ? {
                    ...item,
                    status:
                      "rejected",
                    rejectionReason:
                      rejectionReason.trim(),
                  }
                : item,
          ),
      );

      setRejectOpen(false);
    } catch (error) {
      console.error(
        "Failed to reject account request:",
        error,
      );
    } finally {
      setProcessingId(null);
    }
  }


  /*
   * --------------------------------------------------------------
   * LOADING
   * --------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="space-y-4">

        <div className="grid gap-3 md:grid-cols-3">

          {Array.from({
            length: 3,
          }).map(
            (_, index) => (
              <Card
                key={index}
                className="animate-pulse"
              >
                <CardContent className="h-24" />
              </Card>
            ),
          )}

        </div>

        <Card className="animate-pulse">
          <CardContent className="h-72" />
        </Card>

      </div>
    );
  }


  /*
   * --------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------
   */

  return (
    <div className="space-y-5">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <h2 className="text-xl font-semibold tracking-tight">
              Account Requests
            </h2>

            {pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full"
              >
                {pendingCount} pending
              </Badge>
            )}

          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Review ERP financial requests before creating real transactions.
          </p>

        </div>


        <Button
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadRequests();
          }}
        >

          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh

        </Button>

      </div>


      {/* SUMMARY */}

      <div className="grid gap-3 md:grid-cols-3">

        <Card>
          <CardContent className="flex items-center gap-4 p-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>

              <p className="text-xs text-muted-foreground">
                Pending
              </p>

              <p className="text-2xl font-semibold">
                {pendingCount}
              </p>

            </div>

          </CardContent>
        </Card>


        <Card>
          <CardContent className="flex items-center gap-4 p-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>

              <p className="text-xs text-muted-foreground">
                Processed
              </p>

              <p className="text-2xl font-semibold">
                {processedCount}
              </p>

            </div>

          </CardContent>
        </Card>


        <Card>
          <CardContent className="flex items-center gap-4 p-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <XCircle className="h-5 w-5" />
            </div>

            <div>

              <p className="text-xs text-muted-foreground">
                Rejected
              </p>

              <p className="text-2xl font-semibold">
                {rejectedCount}
              </p>

            </div>

          </CardContent>
        </Card>

      </div>


      {/* TOOLBAR */}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">

        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search requests..."
            className="pl-9"
          />

        </div>


        <Tabs
          value={filter}
          onValueChange={(value) =>
            setFilter(
              value as
                | RequestStatus
                | "all",
            )
          }
        >

          <TabsList>

            <TabsTrigger value="pending">
              Pending
            </TabsTrigger>

            <TabsTrigger value="processed">
              Processed
            </TabsTrigger>

            <TabsTrigger value="rejected">
              Rejected
            </TabsTrigger>

            <TabsTrigger value="all">
              All
            </TabsTrigger>

          </TabsList>

        </Tabs>

      </div>


      {/* REQUESTS */}

      <div className="space-y-3">

        {filteredRequests.length ===
        0 ? (
          <Card>

            <CardContent className="flex flex-col items-center justify-center py-16 text-center">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </div>

              <h3 className="font-semibold">
                No requests
              </h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                There are no account requests matching your current filter.
              </p>

            </CardContent>

          </Card>
        ) : (
          filteredRequests.map(
            (request) => (
              <Card
                key={request.id}
                className="overflow-hidden transition-shadow hover:shadow-sm"
              >

                <CardContent className="p-4">

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <Badge variant="outline">
                          {label(
                            request.module,
                          )}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={statusClass(
                            request.status,
                          )}
                        >
                          {label(
                            request.status,
                          )}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          {formatDate(
                            request.requestDate,
                          )}
                        </span>

                      </div>


                      <h3 className="mt-2 font-semibold">
                        {request.serviceName ??
                          label(
                            request.event,
                          )}
                      </h3>


                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">

                        {request.candidateName && (
                          <span>
                            Candidate:{" "}
                            {request.candidateName}
                          </span>
                        )}

                        {request.partyName && (
                          <span>
                            {label(
                              request.partyType ??
                                "party",
                            )}
                            :{" "}
                            {request.partyName}
                          </span>
                        )}

                        {request.accountName && (
                          <span>
                            Account:{" "}
                            {request.accountName}
                          </span>
                        )}

                        {request.categoryName && (
                          <span>
                            Category:{" "}
                            {request.categoryName}
                          </span>
                        )}

                      </div>


                      {(request.reference ||
                        request.description) && (
                        <div className="mt-2 text-xs text-muted-foreground">

                          {request.reference && (
                            <span className="mr-4">
                              Ref:{" "}
                              {request.reference}
                            </span>
                          )}

                          {request.description && (
                            <span>
                              {request.description}
                            </span>
                          )}

                        </div>
                      )}

                    </div>


                    {/* AMOUNT */}

                    <div className="shrink-0 lg:min-w-[150px] lg:text-right">

                      <p className="text-xs text-muted-foreground">
                        {request.transactionType ===
                        "expense"
                          ? "Expense"
                          : "Income"}
                      </p>

                      <p
                        className={`text-xl font-bold ${
                          request.transactionType ===
                          "expense"
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {request.transactionType ===
                        "expense"
                          ? "-"
                          : "+"}

                        {formatCurrency(
                          request.amount,
                        )}
                      </p>

                    </div>


                    {/* ACTIONS */}

                    <div className="flex shrink-0 items-center gap-2">

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRequest(
                            request,
                          );

                          setDetailsOpen(
                            true,
                          );
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>


                      {request.status ===
                        "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={
                              processingId ===
                              request.id
                            }
                            onClick={() =>
                              openReject(
                                request,
                              )
                            }
                          >
                            <X className="mr-1.5 h-4 w-4" />
                            Reject
                          </Button>


                          <Button
                            size="sm"
                            disabled={
                              processingId ===
                              request.id
                            }
                            onClick={() =>
                              void handleApprove(
                                request,
                              )
                            }
                          >
                            <Check className="mr-1.5 h-4 w-4" />

                            {processingId ===
                            request.id
                              ? "Processing..."
                              : "Approve"}
                          </Button>
                        </>
                      )}

                    </div>

                  </div>

                </CardContent>

              </Card>
            ),
          )
        )}

      </div>


      {/* DETAILS */}

      <Dialog
        open={detailsOpen}
        onOpenChange={
          setDetailsOpen
        }
      >

        <DialogContent className="max-w-lg">

          {selectedRequest && (
            <>
              <DialogHeader>

                <div className="flex items-center gap-2">

                  <Badge variant="outline">
                    {label(
                      selectedRequest.module,
                    )}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={statusClass(
                      selectedRequest.status,
                    )}
                  >
                    {label(
                      selectedRequest.status,
                    )}
                  </Badge>

                </div>

                <DialogTitle className="pt-2">
                  {selectedRequest.serviceName ??
                    "Account Request"}
                </DialogTitle>

                <DialogDescription>
                  Review the accounting impact of this ERP request.
                </DialogDescription>

              </DialogHeader>


              <div className="space-y-4">

                <div className="rounded-xl border bg-muted/30 p-4">

                  <p className="text-xs text-muted-foreground">
                    Transaction Amount
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatCurrency(
                      selectedRequest.amount,
                    )}
                  </p>

                </div>


                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Transaction
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {label(
                        selectedRequest.transactionType,
                      )}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-muted-foreground">
                      Module
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {label(
                        selectedRequest.module,
                      )}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {selectedRequest.accountName ??
                        "Not specified"}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-muted-foreground">
                      Category
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {selectedRequest.categoryName ??
                        "Not specified"}
                    </p>
                  </div>


                  {selectedRequest.candidateName && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Candidate
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {
                          selectedRequest.candidateName
                        }
                      </p>
                    </div>
                  )}


                  {selectedRequest.partyName && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Party
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {
                          selectedRequest.partyName
                        }
                      </p>
                    </div>
                  )}

                </div>


                {selectedRequest.reference && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Reference
                    </p>

                    <p className="mt-1 text-sm">
                      {
                        selectedRequest.reference
                      }
                    </p>
                  </div>
                )}


                {selectedRequest.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Description
                    </p>

                    <p className="mt-1 text-sm">
                      {
                        selectedRequest.description
                      }
                    </p>
                  </div>
                )}


                {selectedRequest.rejectionReason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">

                    <p className="font-medium">
                      Rejection reason
                    </p>

                    <p className="mt-1">
                      {
                        selectedRequest.rejectionReason
                      }
                    </p>

                  </div>
                )}

              </div>


              <DialogFooter>

                {selectedRequest.status ===
                  "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDetailsOpen(
                          false,
                        );

                        openReject(
                          selectedRequest,
                        );
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>

                    <Button
                      disabled={
                        processingId ===
                        selectedRequest.id
                      }
                      onClick={() =>
                        void handleApprove(
                          selectedRequest,
                        )
                      }
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve & Create Transaction
                    </Button>
                  </>
                )}

              </DialogFooter>

            </>
          )}

        </DialogContent>

      </Dialog>


      {/* REJECT */}

      <Dialog
        open={rejectOpen}
        onOpenChange={
          setRejectOpen
        }
      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>
              Reject Request
            </DialogTitle>

            <DialogDescription>
              Please provide a reason. This request will not create a transaction.
            </DialogDescription>

          </DialogHeader>


          <div className="space-y-2">

            <label className="text-sm font-medium">
              Reason
            </label>

            <Input
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value,
                )
              }
              placeholder="Why are you rejecting this request?"
            />

          </div>


          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setRejectOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={
                !rejectionReason.trim() ||
                processingId !== null
              }
              onClick={() =>
                void handleReject()
              }
            >
              <X className="mr-2 h-4 w-4" />
              Reject Request
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}