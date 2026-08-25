import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowRight,
  AlertTriangle,
  Stethoscope,
  ShieldCheck,
  Fingerprint,
  FileText,
  Award,
  IdCard,
  Plane,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

/* =========================================================
 * BOTTLENECK MODULE DEFINITIONS
 *
 * Each module counts candidates currently "stuck" in it —
 * i.e. rows whose status/stage is neither a completed nor a
 * failed terminal state. Mirrors the status logic used on
 * the candidate profile page's processing modules.
 * ========================================================= */

interface BottleneckModule {
  key: string;
  title: string;
  table: string;
  icon: LucideIcon;
  href: string;
  countStuck: () => Promise<number>;
}

async function countRows(
  table: string,
  build: (
    query: ReturnType<typeof supabase.from>,
  ) => ReturnType<typeof supabase.from>,
) {
  const base = supabase.from(table).select("id", { count: "exact", head: true });
  const { count, error } = await build(base as never);

  if (error) {
    console.error(`Failed to count ${table}`, error);
    return 0;
  }

  return count ?? 0;
}

const BOTTLENECK_MODULES: BottleneckModule[] = [
  {
    key: "medical",
    title: "Medical",
    table: "medicals",
    icon: Stethoscope,
    href: "/app/medical",
    countStuck: () => countRows("medicals", (q) => q.eq("status", "new")),
  },
  {
    key: "police_clearance",
    title: "Police Clearance",
    table: "police_clearances",
    icon: ShieldCheck,
    href: "/app/police-clearance",
    countStuck: () =>
      countRows("police_clearances", (q) => q.eq("verified", false)),
  },
  {
    key: "finger",
    title: "Finger",
    table: "fingers",
    icon: Fingerprint,
    href: "/app/fingers",
    countStuck: () =>
      countRows("fingers", (q) => q.in("status", ["pending", "scheduled"])),
  },
  {
    key: "mofa",
    title: "MOFA",
    table: "mofas",
    icon: FileText,
    href: "/app/mofa",
    countStuck: () =>
      countRows("mofas", (q) => q.in("stage", ["new", "medupdated"])),
  },
  {
    key: "takamul",
    title: "Takamul",
    table: "trade_tests",
    icon: Award,
    href: "/app/takamul",
    countStuck: () =>
      countRows("trade_tests", (q) =>
        q.in("status", ["scheduled"]).neq("result", "fail"),
      ),
  },
  {
    key: "visa",
    title: "Visa",
    table: "visas",
    icon: IdCard,
    href: "/app/visa",
    countStuck: () =>
      countRows("visas", (q) =>
        q.not("status", "ilike", "%issued%")
          .not("status", "ilike", "%approved%")
          .not("status", "ilike", "%active%")
          .not("status", "ilike", "%reject%")
          .not("status", "ilike", "%cancel%")
          .not("status", "ilike", "%expired%")
          .not("status", "ilike", "%denied%"),
      ),
  },
  {
    key: "flight",
    title: "Flight",
    table: "flights",
    icon: Plane,
    href: "/app/flight",
    countStuck: () =>
      countRows("flights", (q) =>
        q.in("status", ["scheduled", "rescheduled"]),
      ),
  },
];

interface BottleneckResult {
  key: string;
  title: string;
  icon: LucideIcon;
  href: string;
  count: number;
}

export function ModuleBottlenecks() {
  const navigate = useNavigate();
  const [results, setResults] = useState<BottleneckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBottlenecks() {
      try {
        setLoading(true);

        const counts = await Promise.all(
          BOTTLENECK_MODULES.map(async (module) => ({
            key: module.key,
            title: module.title,
            icon: module.icon,
            href: module.href,
            count: await module.countStuck(),
          })),
        );

        counts.sort((a, b) => b.count - a.count);
        setResults(counts);
      } catch (error) {
        console.error("Failed to fetch module bottlenecks:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchBottlenecks();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(1, ...results.map((r) => r.count));
  const topBottleneck = results[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Module Bottlenecks</CardTitle>
          <CardDescription>Candidates currently stuck at each stage</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/app/candidates")}
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {results.every((r) => r.count === 0) ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No candidates currently stuck in any module.
          </div>
        ) : (
          <div className="space-y-4">
            {topBottleneck && topBottleneck.count > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="font-medium">{topBottleneck.title}</span> has
                  the most candidates waiting ({topBottleneck.count}).
                </span>
              </div>
            )}

            <div className="divide-y divide-border">
              {results.map((module) => {
                const Icon = module.icon;
                const widthPct = (module.count / maxCount) * 100;
                const isTop = module.key === topBottleneck?.key && module.count > 0;

                return (
                  <div
                    key={module.key}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded px-2 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/50"
                    onClick={() => navigate(module.href)}
                  >
                    <div className="flex min-w-[140px] items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          isTop
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium leading-none">
                        {module.title}
                      </p>
                    </div>

                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isTop ? "bg-amber-500" : "bg-primary/60",
                          )}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>

                      <span
                        className={cn(
                          "min-w-[2ch] text-right text-sm font-semibold tabular-nums",
                          isTop ? "text-amber-600 dark:text-amber-400" : "text-foreground",
                        )}
                      >
                        {module.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
