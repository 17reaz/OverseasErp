import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { PageHeader } from "../shared/page-header";
import { PageToolbar } from "../shared/page-toolbar";

import { CandidateFilters } from "./components/candidate-filters";
import { CandidatesTable } from "./components/candidates-table";
import { CandidateDialog } from "./components/candidate-dialog";

import { getCandidates } from "./candidate-service";

import type { Candidate } from "./types/candidate.types";

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<
    Candidate[]
  >([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const loadCandidates = useCallback(async () => {
    setLoading(true);

    const { data, error } = await getCandidates();

    if (error) {
      console.error(
        "Failed to load candidates:",
        error,
      );

      setCandidates([]);
      setLoading(false);

      return;
    }

    setCandidates(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const filteredCandidates = candidates.filter(
    (candidate) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        candidate.full_name
          ?.toLowerCase()
          .includes(query) ||
        candidate.phone
          ?.toLowerCase()
          .includes(query) ||
        candidate.passport_no
          ?.toLowerCase()
          .includes(query)
      );
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Manage and track all candidates."
        actions={<CandidateDialog />}
      />

      <PageToolbar>
        <CandidateFilters
          search={search}
          onSearchChange={setSearch}
          onRefresh={loadCandidates}
          refreshing={loading}
        />
      </PageToolbar>

      <CandidatesTable
        candidates={filteredCandidates}
        loading={loading}
      />
    </div>
  );
}