import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { AgentForm } from "./agent-form";

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

import {
  getAgents,
  deleteAgent,
} from "./agents-service";

import type { Agent } from "./types";

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [tenantId, setTenantId] = useState<string | null>(
    null,
  );

  const [tenantLoading, setTenantLoading] =
    useState(true);

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
        throw new Error(
          "User is not authenticated.",
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.tenant_id) {
        throw new Error(
          "No tenant is assigned to this user.",
        );
      }

      setTenantId(profile.tenant_id);
    } catch (error) {
      console.error(
        "Failed to load tenant:",
        error,
      );
    } finally {
      setTenantLoading(false);
    }
  }

  async function loadAgents() {
    try {
      setLoading(true);

      const data = await getAgents();

      setAgents(data);
    } catch (error) {
      console.error(
        "Failed to load agents:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this agent?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAgent(id);

      setAgents((current) =>
        current.filter(
          (agent) => agent.id !== id,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to delete agent:",
        error,
      );
    }
  }

  useEffect(() => {
    loadTenant();
    loadAgents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agents
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage your recruitment agents.
          </p>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          disabled={
            tenantLoading || !tenantId
          }
        >
          <Plus />
          Add Agent
        </Button>
      </div>

      {/* Add Agent Form */}
      <AgentForm
  open={showForm}
  tenantId={tenantId ?? ""}
  onOpenChange={setShowForm}
  onSuccess={() => {
    setShowForm(false);
    loadAgents();
  }}
/>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Agent List
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No agents found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    ID
                  </TableHead>

                  <TableHead>
                    Code
                  </TableHead>

                  <TableHead>
                    Name
                  </TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {agents.map((agent) => (
                  <TableRow
                    key={agent.id}
                  >
                    <TableCell>
                      {agent.id}
                    </TableCell>

                    <TableCell>
                      {agent.code ?? "-"}
                    </TableCell>

                    <TableCell>
                      {agent.name ?? "-"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(
                            agent.id,
                          )
                        }
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