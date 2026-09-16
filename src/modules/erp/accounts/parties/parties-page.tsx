import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { PartySheet } from "./party-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  deleteParty,
  getParties,
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
    case "customer":
      return "Customer";
    default:
      return type;
  }
}

function getPartyIcon(type: FinancePartyType) {
  switch (type) {
    case "agent":
      return UserRound;
    case "vendor":
      return Store;
    case "customer":
      return Users;
    default:
      return Building2;
  }
}

export function PartiesPage() {
  const [parties, setParties] = useState<FinanceParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [partySheetOpen, setPartySheetOpen] = useState(false);
  const [filter, setFilter] = useState<PartyFilter>("all");
  const [search, setSearch] = useState("");

  async function loadParties() {
    try {
      setLoading(true);
      setError(null);

      const data = await getParties();
      setParties(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load parties.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadParties();
  }, []);

  async function handleDeleteParty(party: FinanceParty) {
    const confirmed = window.confirm(
      `Delete "${party.name}" from party accounts?`,
    );

    if (!confirmed) {
      return;
    }

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
  }

  const filteredParties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return parties.filter((party) => {
      const matchesType =
        filter === "all" || party.partyType === filter;

      if (!matchesType) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        party.name.toLowerCase().includes(query) ||
        party.phone?.toLowerCase().includes(query) ||
        getPartyTypeLabel(party.partyType)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [parties, filter, search]);

  const counts = useMemo(
    () => ({
      all: parties.length,
      agent: parties.filter(
        (party) => party.partyType === "agent",
      ).length,
      vendor: parties.filter(
        (party) => party.partyType === "vendor",
      ).length,
      customer: parties.filter(
        (party) => party.partyType === "customer",
      ).length,
    }),
    [parties],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Party Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage agents, vendors, and customers.
          </p>
        </div>

        <Button onClick={() => setPartySheetOpen(true)}>
  <Plus className="mr-2 size-4" />
  Add Party
</Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex min-h-40 items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-destructive">
                  {error}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void loadParties()}
                >
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                  <span className="ml-2 text-xs opacity-70">
                    {counts.all}
                  </span>
                </Button>

                <Button
                  variant={
                    filter === "agent" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setFilter("agent")}
                >
                  Agents
                  <span className="ml-2 text-xs opacity-70">
                    {counts.agent}
                  </span>
                </Button>

                <Button
                  variant={
                    filter === "vendor" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setFilter("vendor")}
                >
                  Vendors
                  <span className="ml-2 text-xs opacity-70">
                    {counts.vendor}
                  </span>
                </Button>

                <Button
                  variant={
                    filter === "customer"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setFilter("customer")}
                >
                  Customers
                  <span className="ml-2 text-xs opacity-70">
                    {counts.customer}
                  </span>
                </Button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search parties..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Grid */}
            {filteredParties.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-48 items-center justify-center">
                  <div className="text-center">
                    <Building2 className="mx-auto mb-3 size-8 text-muted-foreground" />

                    <p className="text-sm font-medium">
                      No parties found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Add agents, vendors, or customers to start
                      managing party accounts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredParties.map((party) => {
                  const Icon = getPartyIcon(
                    party.partyType,
                  );

                  return (
                    <Card key={party.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                              <Icon className="size-5 text-muted-foreground" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {party.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {getPartyTypeLabel(
                                  party.partyType,
                                )}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  void handleDeleteParty(party)
                                }
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Phone
                            </span>

                            <span>
                              {party.phone || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status
                            </span>

                            <span
                              className={
                                party.isActive
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }
                            >
                              {party.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <PartySheet
  open={partySheetOpen}
  onOpenChange={setPartySheetOpen}
  onCreated={loadParties}
/>
    </div>
  );
}