import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PageHeader } from "../shared/page-header";
import { PageToolbar } from "../shared/page-toolbar";

import { CandidateFilters } from "./components/candidate-filters";
import { CandidatesTable } from "./components/candidates-table";

import {
  getCandidates,
  type Candidate,
} from "./candidate-service";

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<
    Candidate[]
  >([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await getCandidates();

    if (error) {
      console.error(
        "Failed to load candidates:",
        error,
      );

      setCandidates([]);

      setError(
        "Failed to load candidates. Please try again.",
      );

      setLoading(false);

      return;
    }

    setCandidates(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      return (
        candidate.name
          .toLowerCase()
          .includes(query) ||
        candidate.passport_no
          .toLowerCase()
          .includes(query) ||
        candidate.country
          ?.toLowerCase()
          .includes(query) ||
        candidate.current_stage
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [candidates, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Candidates"
        description="Manage and track all candidates."
      />

      {/* Toolbar */}
      <PageToolbar>
        <CandidateFilters
          search={search}
          onSearchChange={setSearch}
          onRefresh={loadCandidates}
          refreshing={loading}
        />
      </PageToolbar>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={loadCandidates}
            className="text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Table */}
      <CandidatesTable
        candidates={filteredCandidates}
        loading={loading}
      />
    </div>
  );
}