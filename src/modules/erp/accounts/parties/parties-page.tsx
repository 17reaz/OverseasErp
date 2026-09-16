import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { PartySheet } from "./party-sheet";
import {
  deleteParty,
  getParties,
  setPartyActive,
} from "./parties-service";
import type {
  FinanceParty,
  FinancePartyType,
} from "./party-types";

type PartyFilter = "all" | FinancePartyType;

function getPartyTypeLabel(type: FinancePartyType): string {
  switch (type) {
    case "agent":
      return "Agent";

    case "vendor":
      return "Vendor";

    case "candidate":
      return "Customer";

    default:
      return type;
  }
}

function getPartyTypeBadgeVariant(
  type: FinancePartyType,
): "default" | "secondary" | "outline" {
  switch (type) {
    case "agent":
      return "default";

    case "vendor":
      return "secondary";

    case "candidate":
      return "outline";

    default:
      return "outline";
  }
}

export function PartiesPage() {
  const [parties, setParties] = useState<FinanceParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] =
    useState<PartyFilter>("all");

  const [sheetOpen, setSheetOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadParties = useCallback(async () => {
    try {
      setError(null);

      const data = await getParties();

      setParties(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load party accounts.",
      );
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        await loadParties();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [loadParties]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadParties();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleActive = async (party: FinanceParty) => {
    try {
      setError(null);

      await setPartyActive(party.id, !party.isActive);

      await loadParties();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update party.",
      );
    }
  };

  const handleDelete = async (party: FinanceParty) => {
    const confirmed = window.confirm(
      `Delete ${party.name}?`,
    );

    if (!confirmed) return;

    try {
      setError(null);

      await deleteParty(party.id);

      await loadParties();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete party.",
      );
    }
  };

  const filteredParties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return parties.filter((party) => {
      const matchesType =
        partyFilter === "all" ||
        party.partyType === partyFilter;

      if (!matchesType) return false;

      if (!query) return true;

      return (
        party.name.toLowerCase().includes(query) ||
        party.phone?.toLowerCase().includes(query) ||
        party.partyId.toLowerCase().includes(query)
      );
    });
  }, [parties, partyFilter, search]);

  const counts = useMemo(() => {
    return {
      all: parties.length,

      agent: parties.filter(
        (party) => party.partyType === "agent",
      ).length,

      vendor: parties.filter(
        (party) => party.partyType === "vendor",
      ).length,

      candidate: parties.filter(
        (party) => party.partyType === "candidate",
      ).length,
    };
  }, [parties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Party Accounts
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage agents, vendors, and customers used in
            finance transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={
                refreshing ? "size-4 animate-spin" : "size-4"
              }
            />
          </Button>

          <Button
            type="button"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Add Party
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={
            partyFilter === "all"
              ? "cursor-pointer border-primary"
              : "cursor-pointer"
          }
          onClick={() => setPartyFilter("all")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                All Parties
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {counts.all}
              </p>
            </div>

            <Users className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className={
            partyFilter === "agent"
              ? "cursor-pointer border-primary"
              : "cursor-pointer"
          }
          onClick={() => setPartyFilter("agent")}
        >
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Agents
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {counts.agent}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            partyFilter === "vendor"
              ? "cursor-pointer border-primary"
              : "cursor-pointer"
          }
          onClick={() => setPartyFilter("vendor")}
        >
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Vendors
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {counts.vendor}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            partyFilter === "candidate"
              ? "cursor-pointer border-primary"
              : "cursor-pointer"
          }
          onClick={() => setPartyFilter("candidate")}
        >
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Customers
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {counts.candidate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Party List
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search party..."
              className="sm:max-w-sm"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  partyFilter === "all"
                    ? "default"
                    : "outline"
                }
                onClick={() => setPartyFilter("all")}
              >
                All
              </Button>

              <Button
                type="button"
                size="sm"
                variant={
                  partyFilter === "agent"
                    ? "default"
                    : "outline"
                }
                onClick={() => setPartyFilter("agent")}
              >
                Agent
              </Button>

              <Button
                type="button"
                size="sm"
                variant={
                  partyFilter === "vendor"
                    ? "default"
                    : "outline"
                }
                onClick={() => setPartyFilter("vendor")}
              >
                Vendor
              </Button>

              <Button
                type="button"
                size="sm"
                variant={
                  partyFilter === "candidate"
                    ? "default"
                    : "outline"
                }
                onClick={() => setPartyFilter("candidate")}
              >
                Customer
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-40 items-center justify-center">
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty */}
          {!loading && filteredParties.length === 0 && (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed">
              <Users className="mb-3 size-8 text-muted-foreground" />

              <p className="font-medium">
                No party accounts found
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add an agent, vendor, or customer to get started.
              </p>
            </div>
          )}

          {/* List */}
          {!loading && filteredParties.length > 0 && (
            <div className="divide-y rounded-lg border">
              {filteredParties.map((party) => (
                <div
                  key={party.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Users className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">
                          {party.name}
                        </p>

                        <Badge
                          variant={getPartyTypeBadgeVariant(
                            party.partyType,
                          )}
                        >
                          {getPartyTypeLabel(
                            party.partyType,
                          )}
                        </Badge>

                        {!party.isActive && (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {party.phone && (
                          <span>{party.phone}</span>
                        )}

                        <span>
                          Source ID: {party.partyId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          void handleToggleActive(party)
                        }
                      >
                        <Power className="mr-2 size-4" />

                        {party.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          void handleDelete(party)
                        }
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PartySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={() => {
          void loadParties();
        }}
      />
    </div>
  );
}