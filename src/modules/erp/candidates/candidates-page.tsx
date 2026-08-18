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
  restoreCandidate,
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
  // CANDIDATE VIEW
  // active | returned
  // ======================================================

  const [
    candidateView,
    setCandidateView,
  ] = useState<
    "active" | "returned"
  >("active");


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
  // CREATE / EDIT
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
  // DELETE
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
  // RETURN
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
  // ACTIVE / RETURNED COUNTS
  // ======================================================

  const activeCount =
    useMemo(() => {

      return candidates.filter(
        (candidate) =>
          !candidate.is_returned,
      ).length;

    }, [
      candidates,
    ]);


  const returnedCount =
    useMemo(() => {

      return candidates.filter(
        (candidate) =>
          candidate.is_returned,
      ).length;

    }, [
      candidates,
    ]);


  // ======================================================
  // SEARCH + ACTIVE / RETURNED FILTER
  // ======================================================

  const filteredCandidates =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return candidates.filter(
        (candidate) => {

          // -----------------------------------------------
          // VIEW FILTER
          // -----------------------------------------------

          const matchesView =
            candidateView === "active"
              ? !candidate.is_returned
              : candidate.is_returned;


          if (!matchesView) {
            return false;
          }


          // -----------------------------------------------
          // SEARCH
          // -----------------------------------------------

          if (!query) {
            return true;
          }


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
      candidateView,
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
  // RESTORE
  // ======================================================

  async function handleRestore(
    candidate: Candidate,
  ) {

    const confirmed =
      window.confirm(
        `Restore ${candidate.name} and mark the candidate as active?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setLoading(true);

      setError(null);


      const {
        data,
        error,
      } =
        await restoreCandidate(
          candidate.id,
        );


      if (error) {

        console.error(
          "Failed to restore candidate:",
          error,
        );

        setError(
          error.message ||
            "Failed to restore candidate. Please try again.",
        );

        return;
      }


      if (data) {

        setCandidates(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                data.id
                  ? data
                  : item,
            ),
        );

      } else {

        await loadCandidates();

      }

    } catch (error) {

      console.error(
        error,
      );

      setError(
        "Failed to restore candidate. Please try again.",
      );

    } finally {

      setLoading(false);

    }

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
          ACTIVE / RETURNED TOGGLE
          ================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div
          className="
            inline-flex
            items-center
            rounded-lg
            border
            bg-muted/40
            p-1
          "
        >

          {/* =================================================
              ACTIVE
              ================================================= */}

          <button
            type="button"
            onClick={() => {

              setCandidateView(
                "active",
              );

              setSearch("");

            }}
            className={`
              rounded-md
              px-4
              py-2
              text-sm
              font-medium
              transition-all

              ${
                candidateView ===
                "active"
                  ? `
                    bg-background
                    text-foreground
                    shadow-sm
                  `
                  : `
                    text-muted-foreground
                    hover:text-foreground
                  `
              }
            `}
          >

            Active

            <span
              className="
                ml-2
                text-xs
                text-muted-foreground
              "
            >
              {activeCount}
            </span>

          </button>


          {/* =================================================
              RETURNED
              ================================================= */}

          <button
            type="button"
            onClick={() => {

              setCandidateView(
                "returned",
              );

              setSearch("");

            }}
            className={`
              rounded-md
              px-4
              py-2
              text-sm
              font-medium
              transition-all

              ${
                candidateView ===
                "returned"
                  ? `
                    bg-background
                    text-foreground
                    shadow-sm
                  `
                  : `
                    text-muted-foreground
                    hover:text-foreground
                  `
              }
            `}
          >

            Returned

            <span
              className="
                ml-2
                text-xs
                text-muted-foreground
              "
            >
              {returnedCount}
            </span>

          </button>

        </div>


        {/* =================================================
            CURRENT VIEW LABEL
            ================================================= */}

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          {candidateView ===
          "active"
            ? "Active candidates"
            : "Returned candidates"}
        </p>

      </div>


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

        onRestore={
          handleRestore
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