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
  CandidateReturnDialog,
} from "./components/candidate-return-dialog";

import {
  getCandidates,
  type Candidate,
} from "./candidate-service";


export function CandidatesPage() {

  // ======================================================
  // CANDIDATES
  // ======================================================

  const [
    candidates,
    setCandidates,
  ] = useState<Candidate[]>([]);


  // ======================================================
  // SEARCH
  // ======================================================

  const [
    search,
    setSearch,
  ] = useState("");


  // ======================================================
  // LOADING / ERROR
  // ======================================================

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
  // CREATE / EDIT DIALOG
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


  // ======================================================
  // DELETE DIALOG
  // ======================================================

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
  // RETURN DIALOG
  // ======================================================

  const [
    returnOpen,
    setReturnOpen,
  ] = useState(false);

  const [
    returningCandidate,
    setReturningCandidate,
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

          console.error(
            error,
          );


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


  // ======================================================
  // INITIAL LOAD
  // ======================================================

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
              .includes(query)

            ||

            candidate.passport_no
              .toLowerCase()
              .includes(query)

            ||

            candidate.country
              ?.toLowerCase()
              .includes(query)

            ||

            candidate.current_stage
              ?.toLowerCase()
              .includes(query)

            ||

            candidate.agent?.name
              ?.toLowerCase()
              .includes(query)

            ||

            candidate.agent?.code
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

    setEditingCandidate(
      null,
    );

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


  // ======================================================
  // RETURN
  // ======================================================

  function handleReturn(
    candidate: Candidate,
  ) {

    setReturningCandidate(
      candidate,
    );

    setReturnOpen(true);

  }


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="space-y-6">

      {/* ==================================================
          TOOLBAR
          ================================================== */}

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


      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (

        <div
          className="
            flex
            items-center
            justify-between
            rounded-lg
            border
            border-destructive/30
            bg-destructive/5
            p-4
          "
        >

          <p
            className="
              text-sm
              text-destructive
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={
              loadCandidates
            }
            className="
              text-sm
              font-medium
              underline
            "
          >
            Try again
          </button>

        </div>

      )}


      {/* ==================================================
          TABLE
          ================================================== */}

      <CandidatesTable

        candidates={
          filteredCandidates
        }

        loading={
          loading
        }

        onEdit={
          handleEdit
        }

        onDelete={
          handleDelete
        }

        onReturn={
          handleReturn
        }

      />


      {/* ==================================================
          CREATE / EDIT
          ================================================== */}

      <CandidateFormDialog

        open={
          formOpen
        }

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


      {/* ==================================================
          DELETE
          ================================================== */}

      <CandidateDeleteDialog

        open={
          deleteOpen
        }

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


      {/* ==================================================
          RETURN
          ================================================== */}

      <CandidateReturnDialog

        open={
          returnOpen
        }

        candidate={
          returningCandidate
        }

        onOpenChange={
          setReturnOpen
        }

        onSuccess={() => {

          setReturningCandidate(
            null,
          );

          loadCandidates();

        }}

      />

    </div>

  );

}