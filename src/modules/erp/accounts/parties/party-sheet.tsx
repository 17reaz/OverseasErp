import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  createParty,
  getPartyBySource,
} from "./parties-service";
import type { FinancePartyType } from "./party-types";

import { supabase } from "@/lib/supabase/client";

interface AgentOption {
  id: string;
  name: string;
  code: string | null;
}

interface PartySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void | Promise<void>;
}

export function PartySheet({
  open,
  onOpenChange,
  onCreated,
}: PartySheetProps) {
  const [partyType, setPartyType] =
    useState<FinancePartyType>("agent");

  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentSearch, setAgentSearch] = useState("");
  const [selectedAgent, setSelectedAgent] =
    useState<AgentOption | null>(null);

  const [loadingAgents, setLoadingAgents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAgents() {
    try {
      setLoadingAgents(true);
      setError(null);

     const { data, error: agentsError } = await supabase
  .from("agents")
  .select("id, name, code")
  .eq("is_active", true)
  .eq("is_deleted", false)
  .order("name", { ascending: true });

      if (agentsError) {
        throw new Error(agentsError.message);
      }

      setAgents((data ?? []) as AgentOption[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load agents.",
      );
    } finally {
      setLoadingAgents(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    setPartyType("agent");
    setAgentSearch("");
    setSelectedAgent(null);
    setError(null);

    void loadAgents();
  }, [open]);

  const filteredAgents = agents.filter((agent) => {
    const query = agentSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      agent.name.toLowerCase().includes(query) ||
      agent.code?.toLowerCase().includes(query) 
    );
  });

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (partyType !== "agent") {
      setError(
        "Only Agent party creation is available right now.",
      );
      return;
    }

    if (!selectedAgent) {
      setError("Please select an agent.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const existingParty = await getPartyBySource(
        "agent",
        selectedAgent.id,
      );

      if (existingParty) {
        setError(
          `${selectedAgent.name} is already added as a party.`,
        );
        return;
      }

      await createParty({
        partyType: "agent",
        partyId: selectedAgent.id,
        name: selectedAgent.name,
        isActive: true,
      });

      await onCreated?.();

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create party.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Add Party Account</SheetTitle>

          <SheetDescription>
            Connect an existing agent to the accounting party
            ledger.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-1 py-6">
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
                  onClick={() => {
                    setPartyType("agent");
                    setError(null);
                  }}
                >
                  Agent
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled
                >
                  Vendor
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled
                >
                  Customer
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Vendor and customer party creation will be
                added later.
              </p>
            </div>

            {/* Agent Search */}
            {partyType === "agent" && (
              <div className="space-y-3">
                <Label>Select Agent</Label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={agentSearch}
                    onChange={(event) =>
                      setAgentSearch(event.target.value)
                    }
                    placeholder="Search agent..."
                    className="pl-9"
                  />
                </div>

                <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
                  {loadingAgents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredAgents.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No agents found.
                    </div>
                  ) : (
                    filteredAgents.map((agent) => {
                      const selected =
                        selectedAgent?.id === agent.id;

                      return (
                        <button
                          key={agent.id}
                          type="button"
                          className={[
                            "w-full rounded-md border p-3 text-left transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted",
                          ].join(" ")}
                          onClick={() => {
                            setSelectedAgent(agent);
                            setError(null);
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {agent.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {agent.code || "No code"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Selected Agent */}
            {selectedAgent && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Selected Agent
                </p>

                <div className="mt-2">
                  <p className="text-sm font-medium">
                    {selectedAgent.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {selectedAgent.code || "No code"}
                    
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <SheetFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving || !selectedAgent}
            >
              {saving && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Create Party
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}