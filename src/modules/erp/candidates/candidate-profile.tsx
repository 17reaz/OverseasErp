import {
  ArrowLeft,
  CalendarDays,
  Pencil,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getCandidate,
  type Candidate,
} from "./candidate-service";

export function CandidateProfilePage() {
  const {
    candidateId,
  } = useParams<{
    candidateId: string;
  }>();

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadCandidate() {
      if (!candidateId) {
        const message =
          "Candidate ID is missing.";

        setError(message);
        setLoading(false);

        toast.error(
          "Candidate ID is missing.",
          "Please return to the Candidates page and select a candidate.",
        );

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const {
          data,
          error,
        } = await getCandidate(
          candidateId,
        );

        if (error) {
          throw error;
        }

        if (!data) {
          const message =
            "Candidate not found.";

          setError(message);

          toast.error(
            "Candidate not found.",
            "The requested candidate profile could not be found.",
          );

          return;
        }

        setCandidate(data);

        toast.success(
          "Candidate profile loaded.",
          "Candidate information has been loaded successfully.",
        );
      } catch (error) {
        console.error(error);

        const message =
          "Failed to load candidate profile.";

        setError(message);

        toast.error(
          "Failed to load candidate profile.",
          "Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading candidate...
        </p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-4">

        <Button
          variant="ghost"
          asChild
        >
          <Link to="/app/candidates">
            <ArrowLeft />
            Back to Candidates
          </Link>
        </Button>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error ??
            "Candidate not found."}
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link to="/app/candidates">
              <ArrowLeft />
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {candidate.name}
            </h1>

            <p className="text-sm text-muted-foreground">
              Passport:{" "}
              {candidate.passport_no}
            </p>
          </div>

        </div>

        <Button>
          <Pencil />
          Edit Candidate
        </Button>

      </div>

      {/* Basic Information */}

      <div className="grid gap-6 md:grid-cols-2">

        <Card>

          <CardHeader>
            <CardTitle>
              Personal Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">

            <div>
              <p className="text-xs text-muted-foreground">
                Candidate Name
              </p>

              <p className="mt-1 text-sm font-medium">
                {candidate.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Passport Number
              </p>

              <p className="mt-1 text-sm font-medium">
                {candidate.passport_no}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Country
              </p>

              <p className="mt-1 text-sm font-medium">
                {candidate.country ??
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Received Date
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />

                {candidate.received_date ??
                  "—"}
              </p>
            </div>

          </CardContent>

        </Card>

        {/* Processing */}

        <Card>

          <CardHeader>
            <CardTitle>
              Processing Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">

            <div>
              <p className="text-xs text-muted-foreground">
                Candidate SL
              </p>

              <p className="mt-1 text-sm font-medium">
                {candidate.sl ??
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Current Stage
              </p>

              <p className="mt-1 text-sm font-medium">
                {candidate.current_stage ??
                  "Pending"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Status
              </p>

              <p className="mt-1 text-sm font-medium">
                {candidate.is_returned
                  ? "Returned"
                  : "Active"}
              </p>
            </div>

            {candidate.is_returned && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Returned Date
                </p>

                <p className="mt-1 text-sm font-medium">
                  {candidate.returned_date ??
                    "—"}
                </p>
              </div>
            )}

          </CardContent>

        </Card>

      </div>

    </div>
  );
}