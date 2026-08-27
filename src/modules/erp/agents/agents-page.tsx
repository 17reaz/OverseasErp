import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { AgentForm } from "./components/agent-form";
import { AgentsToolbar } from "./components/agents-toolbar";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Card>
        <CardHeader>
          <CardTitle>Agent List</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading agents...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search
                ? "No agents match your search."
                : "No agents found."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>{agent.id}</TableCell>
                    <TableCell>{agent.code ?? "-"}</TableCell>
                    <TableCell>{agent.name ?? "-"}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(agent.id)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
