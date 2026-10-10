import { useCallback, useEffect, useState } from "react";
import { Building2, Users, RefreshCw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";

interface ActivePartyStats {
  activeAgencies: number;
  totalAgents: number;
}

export function ActivePartiesCard() {
  const [stats, setStats] = useState<ActivePartyStats>({
    activeAgencies: 0,
    totalAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(async (isCancelled: () => boolean = () => false) => {
    setLoading(true);
    setError(false);

    try {
      const [agenciesResult, agentsResult] = await Promise.all([
        supabase
          .from("agencies")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("agents").select("id", { count: "exact", head: true }),
      ]);

      if (agenciesResult.error) throw agenciesResult.error;
      if (agentsResult.error) throw agentsResult.error;
      if (isCancelled()) return;

      setStats({
        activeAgencies: agenciesResult.count ?? 0,
        totalAgents: agentsResult.count ?? 0,
      });
    } catch (err) {
      console.error("Failed to load agency and agent stats:", err);
      if (!isCancelled()) setError(true);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadStats(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadStats]);

  if (loading) {
    return (
      <Card className="flex flex-row items-center gap-3 px-3 py-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="ml-auto h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-row items-center justify-between gap-3 px-3 py-2">
        <p className="text-sm text-muted-foreground">
          Unable to load agency & agent stats.
        </p>
        <button
          type="button"
          onClick={() => void loadStats()}
          className="rounded-md border p-1.5 transition-colors hover:bg-muted"
          aria-label="Retry loading statistics"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </Card>
    );
  }

  const items = [
    {
      label: "Active Agencies",
      value: stats.activeAgencies,
      icon: Building2,
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Total Agents",
      value: stats.totalAgents,
      icon: Users,
      accent: "bg-blue-500/10 text-blue-600",
    },
  ];

  return (
    <Card className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
      <h3 className="text-sm font-semibold tracking-tight">
        Agency & Agent Overview
      </h3>

      <div className="ml-auto flex items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-md border bg-background px-2 py-1"
            >
              <span
                className={`flex size-6 items-center justify-center rounded ${item.accent}`}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-sm font-semibold tabular-nums">
                {item.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}