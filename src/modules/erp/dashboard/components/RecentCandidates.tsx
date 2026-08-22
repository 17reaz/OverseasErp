import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface Candidate {
  id: string;
  name: string;
  passport_no: string;
  created_at: string;
  current_stage: string | null;
}

export function RecentCandidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentCandidates() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("candidates")
          .select("id, name, passport_no, created_at, current_stage")
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setCandidates(data ?? []);
      } catch (error) {
        console.error("Failed to fetch recent candidates:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchRecentCandidates();
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Candidates</CardTitle>
          <CardDescription>Latest candidates added to the system</CardDescription>
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
        {candidates.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No candidates found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors"
                onClick={() => navigate(`/app/candidates`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {candidate.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Passport: {candidate.passport_no}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {candidate.current_stage || "New"}
                  </span>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}