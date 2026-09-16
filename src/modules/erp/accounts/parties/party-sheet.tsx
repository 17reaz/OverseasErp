import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { supabase } from "@/lib/supabase/client";

import {
  createParty,
  type CreatePartyInput,
} from "./parties-service";
import type { FinancePartyType } from "./party-types";

interface AgentOption {
  id: string;
  name: string | null;
  code: string | null;
}

interface VendorOption {
  id: string;
  name: string | null;
  code: string | null;
  phone: string | null;
}

interface CustomerOption {
  id: string;
  name: string | null;
  passportNo: string | null;
  phone: string | null;
}

interface PartySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function PartySheet({
  open,
  onOpenChange,
  onCreated,
}: PartySheetProps) {
  const [partyType, setPartyType] =
    useState<FinancePartyType>("agent");

  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [selectedAgent, setSelectedAgent] =
    useState<AgentOption | null>(null);

  const [selectedVendor, setSelectedVendor] =
    useState<VendorOption | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);

  const [loadingSources, setLoadingSources] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedName = useMemo(() => {
    if (partyType === "agent") {
      return selectedAgent?.name ?? "";
    }

    if (partyType === "vendor") {
      return selectedVendor?.name ?? "";
    }

    return selectedCustomer?.name ?? "";
  }, [
    partyType,
    selectedAgent,
    selectedVendor,
    selectedCustomer,
  ]);

  useEffect(() => {
    if (!open) return;

    const loadPartySources = async () => {
      setLoadingSources(true);
      setError(null);

      try {
        const [
          { data: agentData, error: agentsError },
          { data: vendorData, error: vendorsError },
          { data: customerData, error: customersError },
        ] = await Promise.all([
          supabase
            .from("agents")
            .select("id, name, code")
            .eq("is_active", true)
            .eq("is_deleted", false)
            .order("name", { ascending: true }),

          supabase
            .from("agencies")
            .select("id, name, code, phone")
            .eq("is_active", true)
            .order("name", { ascending: true }),

          supabase
            .from("candidates")
            .select("id, name, passport_no, phone")
            .eq("is_deleted", false)
            .order("name", { ascending: true }),
        ]);

        if (agentsError) throw agentsError;
        if (vendorsError) throw vendorsError;
        if (customersError) throw customersError;

        setAgents((agentData ?? []) as AgentOption[]);

        setVendors((vendorData ?? []) as VendorOption[]);

        setCustomers(
          (customerData ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            passportNo: row.passport_no,
            phone: row.phone,
          })),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load party sources.",
        );
      } finally {
        setLoadingSources(false);
      }
    };

    void loadPartySources();
  }, [open]);

  const resetSelection = (nextType: FinancePartyType) => {
    setPartyType(nextType);

    setSelectedAgent(null);
    setSelectedVendor(null);
    setSelectedCustomer(null);

    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);

    let input: CreatePartyInput;

    if (partyType === "agent") {
      if (!selectedAgent) {
        setError("Please select an agent.");
        return;
      }

      input = {
        partyType: "agent",
        partyId: selectedAgent.id,
        name: selectedAgent.name || "Unnamed Agent",
        isActive: true,
      };
    } else if (partyType === "vendor") {
      if (!selectedVendor) {
        setError("Please select a vendor.");
        return;
      }

      input = {
        partyType: "vendor",
        partyId: selectedVendor.id,
        name: selectedVendor.name || "Unnamed Vendor",
        phone: selectedVendor.phone,
        isActive: true,
      };
    } else {
      if (!selectedCustomer) {
        setError("Please select a customer.");
        return;
      }

      input = {
        partyType: "customer",
        partyId: selectedCustomer.id,
        name: selectedCustomer.name || "Unnamed Customer",
        phone: selectedCustomer.phone,
        isActive: true,
      };
    }

    setLoading(true);

    try {
      await createParty(input);

      onCreated?.();

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create party.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Add Party Account</SheetTitle>

          <SheetDescription>
            Link an existing agent, agency, or candidate to a
            finance party account.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
            {/* Party Type */}
            <div className="space-y-2">
              <Label>Party Type</Label>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={
                    partyType === "agent"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => resetSelection("agent")}
                >
                  Agent
                </Button>

                <Button
                  type="button"
                  variant={
                    partyType === "vendor"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => resetSelection("vendor")}
                >
                  Vendor
                </Button>

                <Button
                  type="button"
                  variant={
                    partyType === "customer"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => resetSelection("customer")}
                >
                  Customer
                </Button>
              </div>
            </div>

            {/* Loading */}
            {loadingSources && (
              <div className="flex items-center justify-center rounded-lg border p-6">
                <Loader2 className="mr-2 size-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            )}

            {/* Agent */}
            {!loadingSources && partyType === "agent" && (
              <div className="space-y-2">
                <Label>Agent</Label>

                <Command className="rounded-lg border">
                  <CommandInput placeholder="Search agent..." />

                  <CommandList>
                    <CommandEmpty>
                      No agent found.
                    </CommandEmpty>

                    <CommandGroup>
                      {agents.map((agent) => (
                        <CommandItem
                          key={agent.id}
                          value={`${agent.name ?? ""} ${
                            agent.code ?? ""
                          }`}
                          onSelect={() => {
                            setSelectedAgent(agent);
                            setError(null);
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">
                              {agent.name || "Unnamed Agent"}
                            </span>

                            {agent.code && (
                              <span className="text-xs text-muted-foreground">
                                {agent.code}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>

                {selectedAgent && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="font-medium">
                      {selectedAgent.name ||
                        "Unnamed Agent"}
                    </p>

                    {selectedAgent.code && (
                      <p className="text-xs text-muted-foreground">
                        {selectedAgent.code}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Vendor */}
            {!loadingSources && partyType === "vendor" && (
              <div className="space-y-2">
                <Label>Vendor</Label>

                <Command className="rounded-lg border">
                  <CommandInput placeholder="Search vendor..." />

                  <CommandList>
                    <CommandEmpty>
                      No vendor found.
                    </CommandEmpty>

                    <CommandGroup>
                      {vendors.map((vendor) => (
                        <CommandItem
                          key={vendor.id}
                          value={`${vendor.name ?? ""} ${
                            vendor.code ?? ""
                          } ${vendor.phone ?? ""}`}
                          onSelect={() => {
                            setSelectedVendor(vendor);
                            setError(null);
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">
                              {vendor.name ||
                                "Unnamed Vendor"}
                            </span>

                            {vendor.code && (
                              <span className="text-xs text-muted-foreground">
                                {vendor.code}
                              </span>
                            )}

                            {vendor.phone && (
                              <span className="text-xs text-muted-foreground">
                                {vendor.phone}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>

                {selectedVendor && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="font-medium">
                      {selectedVendor.name ||
                        "Unnamed Vendor"}
                    </p>

                    {selectedVendor.code && (
                      <p className="text-xs text-muted-foreground">
                        {selectedVendor.code}
                      </p>
                    )}

                    {selectedVendor.phone && (
                      <p className="text-xs text-muted-foreground">
                        {selectedVendor.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Customer */}
            {!loadingSources && partyType === "customer" && (
              <div className="space-y-2">
                <Label>Customer</Label>

                <Command className="rounded-lg border">
                  <CommandInput placeholder="Search customer..." />

                  <CommandList>
                    <CommandEmpty>
                      No customer found.
                    </CommandEmpty>

                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.name ?? ""} ${
                            customer.passportNo ?? ""
                          } ${customer.phone ?? ""}`}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setError(null);
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">
                              {customer.name ||
                                "Unnamed Customer"}
                            </span>

                            {customer.passportNo && (
                              <span className="text-xs text-muted-foreground">
                                Passport:{" "}
                                {customer.passportNo}
                              </span>
                            )}

                            {customer.phone && (
                              <span className="text-xs text-muted-foreground">
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>

                {selectedCustomer && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="font-medium">
                      {selectedCustomer.name ||
                        "Unnamed Customer"}
                    </p>

                    {selectedCustomer.passportNo && (
                      <p className="text-xs text-muted-foreground">
                        Passport:{" "}
                        {selectedCustomer.passportNo}
                      </p>
                    )}

                    {selectedCustomer.phone && (
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Summary */}
            {selectedName && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Search className="size-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Selected {partyType}
                    </p>

                    <p className="font-medium">
                      {selectedName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <SheetFooter className="border-t px-4 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                loadingSources ||
                (partyType === "agent" &&
                  !selectedAgent) ||
                (partyType === "vendor" &&
                  !selectedVendor) ||
                (partyType === "customer" &&
                  !selectedCustomer)
              }
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Add Party
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}