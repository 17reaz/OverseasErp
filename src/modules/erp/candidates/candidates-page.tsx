import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PageToolbar,
} from "../shared/page-toolbar";

import {
  CandidatesTable,
} from "./components/candidates-table";

import {
  CandidateFormDialog,
} from "./components/candidate-form-dialog";

import {
  CandidateDeleteDialog,
} from "./components/candidate-delete-dialog";

import {
  getCandidates,
  type Candidate,
} from "./candidate-service";


export function CandidatesPage() {
  const [
    candidates,
    setCandidates,
  ] = useState<Candidate[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  // ======================================================
  // DIALOG STATE
  // ======================================================

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingCandidate,
    setEditingCandidate,
  ] = useState<Candidate | null>(
    null,
  );

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    deletingCandidate,
    setDeletingCandidate,
  ] = useState<Candidate | null>(
    null,
  );


  // ======================================================
  // LOAD CANDIDATES
  // ======================================================

  const loadCandidates =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const {
            data,
            error,
          } = await getCandidates();

          if (error) {
            console.error(
              "Failed to load candidates:",
              error,
            );

            setCandidates([]);

            setError(
              "Failed to load candidates. Please try again.",
            );

            return;
          }

          setCandidates(
            data ?? [],
          );
        } catch (error) {
          console.error(error);

          setCandidates([]);

          setError(
            "Failed to load candidates. Please try again.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    loadCandidates();
  }, [
    loadCandidates,
  ]);


  // ======================================================
  // SEARCH
  // ======================================================

  const filteredCandidates =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return candidates;
      }

      return candidates.filter(
        (candidate) => {
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
        },
      );
    }, [
      candidates,
      search,
    ]);


  // ======================================================
  // CREATE
  // ======================================================

  function handleCreate() {
    setEditingCandidate(null);
    setFormOpen(true);
  }


  // ======================================================
  // EDIT
  // ======================================================

  function handleEdit(
    candidate: Candidate,
  ) {
    setEditingCandidate(
      candidate,
    );

    setFormOpen(true);
  }


  // ======================================================
  // DELETE
  // ======================================================

  function handleDelete(
    candidate: Candidate,
  ) {
    setDeletingCandidate(
      candidate,
    );

    setDeleteOpen(true);
  }


  return (
    <div className="space-y-6">

      {/* Toolbar */}

      <PageToolbar
        title="Candidates"

        search={search}

        searchPlaceholder="Search name, passport..."

        onSearchChange={
          setSearch
        }

        onFilter={() => {
          console.log(
            "Candidate filters",
          );
        }}

        onSort={() => {
          console.log(
            "Candidate sorting",
          );
        }}

        onRefresh={
          loadCandidates
        }

        onCreate={
          handleCreate
        }

        refreshing={
          loading
        }
      />


      {/* Error */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">

          <p className="text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadCandidates
            }
            className="text-sm font-medium underline"
          >
            Try again
          </button>

        </div>
      )}


      {/* Table */}

      <CandidatesTable
        candidates={
          filteredCandidates
        }
        loading={loading}
        onEdit={
          handleEdit
        }
        onDelete={
          handleDelete
        }
      />


      {/* Create / Edit */}

      <CandidateFormDialog
        open={formOpen}

        candidate={
          editingCandidate
        }

        onOpenChange={
          setFormOpen
        }

        onSuccess={() => {
          loadCandidates();
        }}
      />


      {/* Delete */}

      <CandidateDeleteDialog
        open={deleteOpen}

        candidate={
          deletingCandidate
        }

        onOpenChange={
          setDeleteOpen
        }

        onSuccess={() => {
          setDeletingCandidate(
            null,
          );

          loadCandidates();
        }}
      />

    </div>
  );
}