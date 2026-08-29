// src/modules/erp/agents/agents-page.tsx

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { AgentForm } from "./components/agent-form";
import { AgentsToolbar } from "./components/agents-toolbar";
import { AgentTable } from "./components/agent-table";

import { getAgents, deleteAgent } from "./agents-service";

import type { Agent } from "./types";

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  async function loadTenant() {
    try {
      setTenantLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("User is not authenticated.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.tenant_id) {
        throw new Error("No tenant is assigned to this user.");
      }

      setTenantId(profile.tenant_id);
    } catch (error) {
      console.error("Failed to load tenant:", error);
    } finally {
      setTenantLoading(false);
    }
  }

  const loadAgents = useCallback(async () => {
    try {
      const data = await getAgents();

      setAgents(data);
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this agent?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAgent(id);

      setAgents((current) => current.filter((agent) => agent.id !== id));
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  }

  useEffect(() => {
    loadTenant();
    void loadAgents();
  }, [loadAgents]);

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return agents;
    }

    return agents.filter(
      (agent) =>
        agent.name?.toLowerCase().includes(query) ||
        agent.code?.toLowerCase().includes(query),
    );
  }, [agents, search]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <AgentsToolbar
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => {
          setRefreshing(true);
          void loadAgents();
        }}
        onCreate={() => setShowForm(true)}
        refreshing={refreshing}
        createDisabled={tenantLoading || !tenantId}
      />

      {/* Add Agent Form */}
      <AgentForm
        open={showForm}
        tenantId={tenantId ?? ""}
        onOpenChange={setShowForm}
        onSuccess={() => {
          setShowForm(false);
          void loadAgents();
        }}
      />

      {/* Agents Table */}
      <AgentTable
        agents={filteredAgents}
        loading={loading}
        onDelete={handleDelete}
      />
    </div>
  );
}