import { useEffect, useState } from "react";

import { getAgents } from "../../../agents/agents-service";
import type { Agent } from "../../../agents/types";
import { getMofaAgencies, type MofaAgency } from "../../../mofa/mofa-service";

export function useRegistrationLookups() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState("");
  const [agencies, setAgencies] = useState<MofaAgency[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setAgentsLoading(true);
      setAgentLoadError("");

      try {
        const data = await getAgents();
        if (cancelled) return;

        setAgents(
          data.filter((agent) => agent.is_active && !agent.is_deleted),
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load agents:", error);
        setAgentLoadError("Could not load agents. Please try again.");
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    }

    void loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAgencies() {
      const result = await getMofaAgencies();
      if (cancelled) return;

      if (result.error) {
        console.error("Failed to load MOFA agencies:", result.error);
        return;
      }

      setAgencies(result.data ?? []);
    }

    void loadAgencies();

    return () => {
      cancelled = true;
    };
  }, []);

  return { agents, agentsLoading, agentLoadError, agencies };
}

export type RegistrationLookups = ReturnType<typeof useRegistrationLookups>;
