import { PageHeader } from "../shared/page-header";
import { PageToolbar } from "../shared/page-toolbar";

import { CandidateFilters } from "./components/candidate-filters";
import { CandidatesTable } from "./components/candidates-table";
import { CandidateDialog } from "./components/candidate-dialog";

import type { Candidate } from "./types/candidate.types";

const candidates: Candidate[] = [];

export function CandidatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Manage and track all candidates."
        actions={<CandidateDialog />}
      />

      <PageToolbar>
        <CandidateFilters />
      </PageToolbar>

      <CandidatesTable candidates={candidates} />
    </div>
  );
}