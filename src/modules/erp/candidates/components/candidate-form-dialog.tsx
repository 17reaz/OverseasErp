import {
  useEffect,
  useState,
} from "react";
import { CANDIDATE_STAGE_DEFINITIONS } from "../candidate-stage";

import {
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";

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

import { supabase } from "@/lib/supabase/client";

import {
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

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: (
    candidate: Candidate,
  ) => void;
}


const countries = [
  "Saudi Arabia",
  "Mauritius",
  "Laos",
  "Malaysia",
  "Belarus",
] as const;


export function CandidateFormDialog({
  open,
  candidate,
  onOpenChange,
  onSuccess,
}: CandidateFormDialogProps) {

  const isEdit =
    Boolean(candidate);


  // =====================================================
  // FORM STATE
  // =====================================================

  const [passportNo, setPassportNo] =
    useState("");

  const [name, setName] =
    useState("");

  const [receivedDate, setReceivedDate] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [currentStage, setCurrentStage] =
    useState("Pending");


  // =====================================================
  // AGENT STATE
  // =====================================================

  const [agents, setAgents] =
    useState<Agent[]>([]);

  const [selectedAgentId, setSelectedAgentId] =
    useState<string | null>(null);

  const [agentOpen, setAgentOpen] =
    useState(false);

  const [agentLoading, setAgentLoading] =
    useState(false);


  // =====================================================
  // GENERAL STATE
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // =====================================================
  // LOAD AGENTS
  // =====================================================

  useEffect(() => {

    if (!open) {
      return;
    }


    async function loadAgents() {

      setAgentLoading(true);


      const {
        data,
        error,
      } = await supabase
        .from("agents")
        .select(
          "id, name, code",
        )
        .eq(
          "is_active",
          true,
        )
        .eq(
          "is_deleted",
          false,
        )
        .order(
          "name",
          {
            ascending: true,
          },
        );


      if (error) {

        console.error(
          "Failed to load agents:",
          error,
        );

        setAgents([]);

      } else {

        setAgents(
          data ?? [],
        );

      }


      setAgentLoading(false);
    }


    loadAgents();

  }, [open]);


  // =====================================================
  // LOAD CANDIDATE INTO FORM
  // =====================================================

  useEffect(() => {

    if (!open) {
      return;
    }


    setPassportNo(
      candidate?.passport_no ??
        "",
    );


    setName(
      candidate?.name ??
        "",
    );


    setReceivedDate(
      candidate?.received_date ??
        "",
    );


    setCountry(
      candidate?.country ??
        "",
    );


    setCurrentStage(candidate?.current_stage ?? "candidate"); // আগে ছিল "Pending"



    setSelectedAgentId(
      candidate?.agent_id ??
        null,
    );


    setError(null);

  }, [
    open,
    candidate,
  ]);


  // =====================================================
  // SELECTED AGENT
  // =====================================================

  const selectedAgent =
    agents.find(
      (agent) =>
        agent.id ===
        selectedAgentId,
    );


  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent,
  ) {

    event.preventDefault();


    if (!passportNo.trim()) {

      setError(
        "Passport number is required.",
      );

      return;
    }


    if (!name.trim()) {

      setError(
        "Candidate name is required.",
      );

      return;
    }


    try {

      setLoading(true);

      setError(null);


      const input: CandidateInput = {

        passport_no:
          passportNo.trim(),

        name:
          name.trim(),

        received_date:
          receivedDate ||
          null,

        country:
          country
            ? (
                country as CandidateInput[
                  "country"
                ]
              )
            : null,

        agent_id:
          selectedAgentId,

       current_stage: currentStage,  
      };


      const result =
        isEdit
          ? await updateCandidate(
              candidate!.id,
              input,
            )
          : await createCandidate(
              input,
            );


      if (result.error) {

        console.error(
          result.error,
        );


        if (
          result.error.code ===
          "23505"
        ) {

          setError(
            "This passport number already exists.",
          );

        } else {

          setError(
            result.error.message ||
              "Failed to save candidate.",
          );

        }

        return;
      }


      if (result.data) {

        onSuccess(
          result.data,
        );

      }


      onOpenChange(
        false,
      );

    } catch (error) {

      console.error(
        error,
      );


      setError(
        "Something went wrong. Please try again.",
      );

    } finally {

      setLoading(false);

    }

  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >

      <DialogContent
        className="sm:max-w-[520px]"
      >

        <DialogHeader>

          <DialogTitle>

            {isEdit
              ? "Edit Candidate"
              : "Create Candidate"}

          </DialogTitle>


          <DialogDescription>

            {isEdit
              ? "Update candidate information."
              : "Add a new candidate."}

          </DialogDescription>

        </DialogHeader>


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >


          {/* =================================================
              PASSPORT
              ================================================= */}

          <div className="space-y-2">

            <Label
              htmlFor="passport_no"
            >
              Passport Number
            </Label>

            <Input
              id="passport_no"
              value={passportNo}
              onChange={(event) =>
                setPassportNo(
                  event.target.value,
                )
              }
              placeholder="A12345678"
              disabled={loading}
            />

          </div>


          {/* =================================================
              NAME
              ================================================= */}

          <div className="space-y-2">

            <Label
              htmlFor="candidate_name"
            >
              Candidate Name
            </Label>

            <Input
              id="candidate_name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Full name"
              disabled={loading}
            />

          </div>


          {/* =================================================
              AGENT
              ================================================= */}

          <div className="space-y-2">

            <Label>
              Agent
            </Label>


            <Popover
              open={agentOpen}
              onOpenChange={
                setAgentOpen
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
                    agentOpen
                  }
                  disabled={
                    loading ||
                    agentLoading
                  }
                  className="w-full justify-between font-normal"
                >

                  {agentLoading
                    ? "Loading agents..."
                    : selectedAgent
                      ? selectedAgent.name
                      : "Select agent..."}


                  <ChevronsUpDown
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  />

                </Button>

              </PopoverTrigger>


              <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
              >

                <Command>

                  <CommandInput
                    placeholder="Search agent..."
                  />


                  <CommandList>

                    <CommandEmpty>
                      No agent found.
                    </CommandEmpty>


                    <CommandGroup>

                      {/* No Agent */}

                      <CommandItem
                        value="no agent"
                        onSelect={() => {

                          setSelectedAgentId(
                            null,
                          );

                          setAgentOpen(
                            false,
                          );

                        }}
                      >

                        No Agent


                        {selectedAgentId ===
                          null && (

                          <Check
                            className="ml-auto h-4 w-4"
                          />

                        )}

                      </CommandItem>


                      {/* Existing Agents */}

                      {agents.map(
                        (agent) => (

                          <CommandItem
                            key={
                              agent.id
                            }
                            value={`${agent.name ?? ""} ${agent.code ?? ""}`}
                            onSelect={() => {

                              setSelectedAgentId(
                                agent.id,
                              );

                              setAgentOpen(
                                false,
                              );

                            }}
                          >

                            <div className="flex flex-col">

                              <span>

                                {agent.name ||
                                  "Unnamed Agent"}

                              </span>


                              {agent.code && (

                                <span className="text-xs text-muted-foreground">

                                  {
                                    agent.code
                                  }

                                </span>

                              )}

                            </div>


                            {selectedAgentId ===
                              agent.id && (

                              <Check
                                className="ml-auto h-4 w-4"
                              />

                            )}

                          </CommandItem>

                        ),
                      )}

                    </CommandGroup>

                  </CommandList>

                </Command>

              </PopoverContent>

            </Popover>

          </div>


          {/* =================================================
              RECEIVED DATE
              ================================================= */}

          <div className="space-y-2">

            <Label
              htmlFor="received_date"
            >
              Received Date
            </Label>

            <Input
              id="received_date"
              type="date"
              value={
                receivedDate
              }
              onChange={(event) =>
                setReceivedDate(
                  event.target.value,
                )
              }
              disabled={loading}
            />

          </div>


          {/* =================================================
              COUNTRY
              ================================================= */}

          <div className="space-y-2">

            <Label
              htmlFor="country"
            >
              Country
            </Label>


            <select
              id="country"
              value={country}
              onChange={(event) =>
                setCountry(
                  event.target.value,
                )
              }
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
            >

              <option value="">
                Select country
              </option>


              {countries.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                ),
              )}

            </select>

          </div>


          {/* =================================================
              CURRENT STAGE
              ================================================= */}

          <div className="space-y-2">
  <Label htmlFor="current_stage">Current Stage</Label>

  <select
    id="current_stage"
    value={currentStage}
    onChange={(event) => setCurrentStage(event.target.value)}
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


          {/* =================================================
              ERROR
              ================================================= */}

          {error && (

            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">

              {error}

            </div>

          )}


          {/* =================================================
              FOOTER
              ================================================= */}

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
              disabled={loading}
            >
              Cancel
            </Button>


            <Button
              type="submit"
              disabled={loading}
            >

              {loading && (

                <Loader2
                  className="animate-spin"
                />

              )}


              {isEdit
                ? "Save Changes"
                : "Create Candidate"}

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  );
}