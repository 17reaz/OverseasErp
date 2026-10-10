import { useEffect, useState } from "react";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { useCandidateStore } from "@/store/candidate-store";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CANDIDATE_STAGE_DEFINITIONS } from "../stage-service";
import {
  checkPassportDuplicate,
  createCandidate,
  updateCandidate,
  type Candidate,
  type CandidateInput,
} from "../candidate-service";

interface Agent {
  id: string;
  name: string | null;
  code: string | null;
}

interface CandidateFormDialogProps {
  open: boolean;
  candidate?: Candidate | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (candidate: Candidate) => void;
}

const countries = [
  "Saudi Arabia",
  "Mauritius",
  "Laos",
  "Malaysia",
  "Belarus",
  "Fiji",
  "UAE",
] as const;

// Local date (YYYY-MM-DD) - toISOString() would use UTC and can show yesterday.
function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Removes every kind of digit (English, Bangla, etc.)
// function stripNumbers(value: string) {
//   return value.replace(/\p{N}/gu, "");
// }

export function CandidateFormDialog({
  open,
  candidate,
  onOpenChange,
  onSuccess,
}: CandidateFormDialogProps) {
  const isEdit = Boolean(candidate);

  // Form state (persisted in Zustand)
  const draft = useCandidateStore((state) => state.draft);
  const setDraft = useCandidateStore((state) => state.setDraft);
  const resetDraft = useCandidateStore((state) => state.resetDraft);
  const selectedAgentId = useCandidateStore((state) => state.selectedAgentId);
  const setSelectedAgentId = useCandidateStore(
    (state) => state.setSelectedAgentId,
  );

  // Agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);

  // General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passport duplicate
  const [passportChecking, setPassportChecking] = useState(false);
  const [passportDuplicate, setPassportDuplicate] = useState(false);

  // Duplicate check needs a tenant id (available in edit mode).
  // The DB unique constraint still protects the final insert.
  const tenantId = (
    candidate as (Candidate & { tenant_id?: string }) | null | undefined
  )?.tenant_id;

  // Load agents
  useEffect(() => {
    if (!open) return;

    async function loadAgents() {
      setAgentLoading(true);

      const { data, error } = await supabase
        .from("agents")
        .select("id, name, code")
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed to load agents:", error);
        setAgents([]);
      } else {
        setAgents(data ?? []);
      }

      setAgentLoading(false);
    }

    loadAgents();
  }, [open]);

  // Load candidate (or defaults) into the form
  useEffect(() => {
    if (!open) return;

    setDraft("passportNo", candidate?.passport_no ?? "");
setDraft("name", (candidate?.name ?? "").toUpperCase());    setDraft(
  "receivedDate",
  candidate
    ? candidate.received_date ?? ""
    : getToday(),
);
    setDraft("country", candidate?.country ?? "");
    setDraft("currentStage", candidate?.current_stage ?? "candidate");
    setSelectedAgentId(candidate?.agent_id ?? null);

    setError(null);
    setPassportDuplicate(false);
    setPassportChecking(false);
  }, [open, candidate, setDraft, setSelectedAgentId]);

  // Passport duplicate check (debounced)
  useEffect(() => {
    const normalizedPassport = draft.passportNo.trim().toUpperCase();

    if (!normalizedPassport || !tenantId) {
      setPassportChecking(false);
      setPassportDuplicate(false);
      return;
    }

    setPassportChecking(true);
    setPassportDuplicate(false);

    const timer = window.setTimeout(async () => {
      try {
        const isDuplicate = await checkPassportDuplicate(
          normalizedPassport,
          tenantId,
          candidate?.id,
        );
        setPassportDuplicate(isDuplicate);
      } catch (err) {
        console.error("Passport duplicate check failed:", err);
        setPassportDuplicate(false);
      } finally {
        setPassportChecking(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [draft.passportNo, tenantId, candidate?.id]);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  // Submit
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!draft.passportNo.trim()) {
      setError("Passport number is required.");
      return;
    }

    if (passportDuplicate) {
      setError("This passport number already exists.");
      return;
    }

    const cleanName = draft.name
  .replace(/\p{N}/gu, "")
  .trim()
  .toUpperCase();

if (!cleanName) {
  setError("Candidate name is required.");
  return;
}

    try {
      setLoading(true);
      setError(null);

      const input: CandidateInput = {
        passport_no: draft.passportNo.trim().toUpperCase(),
        name: cleanName,
        received_date: draft.receivedDate || null,
        country: draft.country
          ? (draft.country as CandidateInput["country"])
          : null,
        agent_id: selectedAgentId,
        current_stage: draft.currentStage,
      };

      const result = isEdit
        ? await updateCandidate(candidate!.id, input)
        : await createCandidate(input);

      if (result.error) {
        console.error(result.error);

        // PostgreSQL unique_violation (protects against race conditions)
        if (result.error.code === "23505") {
          setPassportDuplicate(true);
          setError("This passport number already exists.");
        } else {
          setError(result.error.message || "Failed to save candidate.");
        }

        return;
      }

      if (result.data) {
        onSuccess(result.data);
      }

      // Clear persisted Zustand form data so the next one starts fresh
      resetDraft();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Candidate" : "Create Candidate"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update candidate information." : "Add a new candidate."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Passport */}
          <div className="space-y-2">
            <Label htmlFor="passport_no">Passport Number</Label>

            <Input
              id="passport_no"
              value={draft.passportNo}
              onChange={(event) => {
                setDraft("passportNo", event.target.value.toUpperCase());
                setPassportDuplicate(false);
                setError(null);
              }}
              placeholder="A12345678"
              disabled={loading}
              className={
                passportDuplicate
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />

            {passportChecking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking passport...
              </div>
            )}

            {!passportChecking && passportDuplicate && (
              <p className="text-xs text-destructive">
                This passport number already exists.
              </p>
            )}

            {!passportChecking &&
              !passportDuplicate &&
              draft.passportNo.trim() && (
                <p className="text-xs text-green-600">
                  Passport number is available.
                </p>
              )}
          </div>

          {/* Name (no numbers allowed) */}
          <div className="space-y-2">
            <Label htmlFor="candidate_name">Candidate Name</Label>

            <Input
              id="candidate_name"
              value={draft.name}
              onChange={(event) =>
  setDraft(
    "name",
    event.target.value
      .replace(/\p{N}/gu, "")
      .toUpperCase(),
  )
}
              placeholder="Full name"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          {/* Agent */}
          <div className="space-y-2">
            <Label>Agent</Label>

            <Popover open={agentOpen} onOpenChange={setAgentOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={agentOpen}
                  disabled={loading || agentLoading}
                  className="w-full justify-between font-normal"
                >
                  {agentLoading
                    ? "Loading agents..."
                    : selectedAgent
                      ? selectedAgent.name
                      : "Select agent..."}

                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
              >
                <Command>
                  <CommandInput placeholder="Search agent..." />

                  <CommandList>
                    <CommandEmpty>No agent found.</CommandEmpty>

                    <CommandGroup>
                      <CommandItem
                        value="no agent"
                        onSelect={() => {
                          setSelectedAgentId(null);
                          setAgentOpen(false);
                        }}
                      >
                        No Agent
                        {selectedAgentId === null && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>

                      {agents.map((agent) => (
                        <CommandItem
                          key={agent.id}
                          value={`${agent.name ?? ""} ${agent.code ?? ""}`}
                          onSelect={() => {
                            setSelectedAgentId(agent.id);
                            setAgentOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{agent.name || "Unnamed Agent"}</span>

                            {agent.code && (
                              <span className="text-xs text-muted-foreground">
                                {agent.code}
                              </span>
                            )}
                          </div>

                          {selectedAgentId === agent.id && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Received date (defaults to today) */}
          <div className="space-y-2">
            <Label htmlFor="received_date">Received Date</Label>

            <Input
              id="received_date"
              type="date"
              value={draft.receivedDate}
              onChange={(event) => setDraft("receivedDate", event.target.value)}
              disabled={loading}
            />
          </div>

          {/* Country (radio boxes) */}
          <div className="space-y-2">
            <Label id="country_label">Country</Label>

            <div
              role="radiogroup"
              aria-labelledby="country_label"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {countries.map((item) => {
                const selected = draft.country === item;

                return (
                  <label
                    key={item}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-input hover:bg-accent"
                    } ${loading ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="country"
                      value={item}
                      checked={selected}
                      onChange={() => setDraft("country", item)}
                      disabled={loading}
                      className="sr-only"
                    />

                    <span>{item}</span>

                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Current stage */}
          <div className="space-y-2">
            <Label htmlFor="current_stage">Current Stage</Label>

            <select
              id="current_stage"
              value={draft.currentStage}
              onChange={(event) => setDraft("currentStage", event.target.value)}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
            >
              {CANDIDATE_STAGE_DEFINITIONS.map((definition) => (
                <option key={definition.value} value={definition.value}>
                  {definition.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              সাধারণত এটা Next বাটন দিয়েই এগোয় — এখানে সরাসরি বদলালে candidate
              কোনো stage skip করে চলে যেতে পারবে (পুরনো data পরে add করা যাবে)।
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
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
              disabled={loading || passportChecking || passportDuplicate}
            >
              {loading && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Candidate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
