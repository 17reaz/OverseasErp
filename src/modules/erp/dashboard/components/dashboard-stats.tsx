import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface StatsData {
  totalCandidates: number;
  activeCandidates: number;
  completedCandidates: number;
  returnedCandidates: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData>({
    totalCandidates: 0,
    activeCandidates: 0,
    completedCandidates: 0,
    returnedCandidates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);

        // প্যারাレルভাবে কুয়েরিগুলো রান করার জন্য Promise.all ব্যবহার করা হয়েছে
        const [
          totalRes,
          activeRes,
          completedRes,
          returnedRes,
        ] = await Promise.all([
          // ১. Total Candidates (যেগুলো ডিলিট হয়নি)
          supabase
            .from("candidates")
            .select("*", { count: "exact", head: true })
            .eq("is_deleted", false),

          // ২. Active Candidates (ডিলিট বা রিটার্ন হয়নি)
          supabase
            .from("candidates")
            .select("*", { count: "exact", head: true })
            .eq("is_deleted", false)
            .eq("is_returned", false),

          // ৩. Completed Candidates (যাদের ফ্লাইট সম্পন্ন বা প্রসেস শেষ)
          supabase
            .from("flights")
            .select("*", { count: "exact", head: true })
            .eq("status", "departed"),

          // ৪. Returned / Cancelled Candidates (is_returned = true)
          supabase
            .from("candidates")
            .select("*", { count: "exact", head: true })
            .eq("is_returned", true),
        ]);

        setStats({
          totalCandidates: totalRes.count ?? 0,
          activeCandidates: activeRes.count ?? 0,
          completedCandidates: completedRes.count ?? 0,
          returnedCandidates: returnedRes.count ?? 0,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Candidates */}
      <div className="rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Total Candidates</p>
        <p className="mt-2 text-2xl font-semibold">{stats.totalCandidates}</p>
      </div>

      {/* Active Candidates */}
      <div className="rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Active Candidates</p>
        <p className="mt-2 text-2xl font-semibold">{stats.activeCandidates}</p>
      </div>

      {/* Completed Candidates */}
      <div className="rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Completed</p>
        <p className="mt-2 text-2xl font-semibold">{stats.completedCandidates}</p>
      </div>

      {/* Returned / Cancelled */}
      <div className="rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Returned / Cancelled</p>
        <p className="mt-2 text-2xl font-semibold">{stats.returnedCandidates}</p>
      </div>
    </div>
  );
}