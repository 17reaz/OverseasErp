import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CandidatesGrid,
} from "./components/candidates-grid";

import {
  CandidatePassportDialog,
} from "./components/candidate-passport-dialog";

import {
  CandidateToolbar,
  type CandidateFilterState,
  type CandidateSortState,
  type ViewMode,
} from "./components/candidate-toolbar";

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
  getCandidateOverallStatus,
} from "./candidate-selectors";

import {
  CANDIDATE_DISPLAY_STATUS,
} from "./candidate-status";

import {
  CANDIDATE_STAGE_DEFINITIONS,
} from "./candidate-stage";

import {
  getCandidates,
  restoreReturnedCandidate,
  type Candidate,
} from "./candidate-service";


export function CandidatesPage() {

  // =====================================================
  // CANDIDATES
  // =====================================================

  const [
    candidates,
    setCandidates,
  ] = useState<Candidate[]>([]);


  // =====================================================
  // SEARCH
  // =====================================================

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    passportCandidate,
    setPassportCandidate,
  ] = useState<Candidate | null>(null);


  // =====================================================
  // FILTER
  // =====================================================

  const [
    candidateFilter,
    setCandidateFilter,
  ] =
    useState<CandidateFilterState>({
      status: "active",
      agentId: "all",
      stage: "all",
      month: "all",
    });


  // =====================================================
  // SORT
  // =====================================================

  const [
    candidateSort,
    setCandidateSort,
  ] =
    useState<CandidateSortState>({
      mode: "custom",
      field: "created_at",
    });


  // =====================================================
  // VIEW
  // =====================================================

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>("list");


  // =====================================================
  // LOADING / ERROR
  // =====================================================

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  // =====================================================
  // CREATE / EDIT
  // =====================================================

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    editingCandidate,
    setEditingCandidate,
  ] = useState<Candidate | null>(null);


  // =====================================================
  // DELETE
  // =====================================================

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);


  const [
    deletingCandidate,
    setDeletingCandidate,
  ] = useState<Candidate | null>(null);


  // =====================================================
  // RETURN
  // =====================================================

  const [
    returnOpen,
    setReturnOpen,
  ] = useState(false);


  const [
    returningCandidate,
    setReturningCandidate,
  ] = useState<Candidate | null>(null);


  // =====================================================
  // LOAD CANDIDATES
  // =====================================================

  const loadCandidates =
    useCallback(
      async () => {

        setLoading(true);
        setError(null);

        try {

          const data =
            await getCandidates();

          setCandidates(data);

        } catch (error) {

          console.error(
            "Failed to load candidates:",
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


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadCandidates();

  }, [
    loadCandidates,
  ]);


  // =====================================================
  // DERIVED OVERALL STATUS
  // -----------------------------------------------------
  // IMPORTANT:
  //
  // overall_status database column নয়।
  //
  // Candidate Source of Truth থেকে application layer
  // এটি derive করে।
  // =====================================================

  const candidateStatusMap =
    useMemo(() => {

      const map =
        new Map<
          string,
          ReturnType<
            typeof getCandidateOverallStatus
          >
        >();

      candidates.forEach(
        (candidate) => {

          map.set(
            candidate.id,
            getCandidateOverallStatus(
              candidate,
            ),
          );

        },
      );

      return map;

    }, [
      candidates,
    ]);


  // =====================================================
  // STATUS COUNTS
  // =====================================================

  const statusCounts =
    useMemo(() => {

      let active = 0;
      let returned = 0;
      let complete = 0;
      let cancelled = 0;

      candidates.forEach(
        (candidate) => {

          const status =
            getCandidateOverallStatus(
              candidate,
            );

          switch (status) {

            case CANDIDATE_DISPLAY_STATUS.RETURNED:
              returned++;
              break;

            case CANDIDATE_DISPLAY_STATUS.COMPLETE:
              complete++;
              break;

            case CANDIDATE_DISPLAY_STATUS.CANCELLED:
              cancelled++;
              break;

            default:
              active++;
              break;

          }

        },
      );

      return {
        active,
        returned,
        complete,
        cancelled,
      };

    }, [
      candidates,
    ]);


  // =====================================================
  // AGENT OPTIONS
  // =====================================================

  const agentOptions =
    useMemo(() => {

      const agents =
        new Map<
          string,
          string
        >();

      candidates.forEach(
        (candidate) => {

          /*
           * NOTE:
           * যদি Candidate type-এ agent relation থাকে,
           * এখানে existing UI behaviour রাখা যাবে।
           */

          const candidateWithAgent =
            candidate as Candidate & {
              agent?: {
                id?: string;
                name?: string | null;
                code?: string | null;
              };
            };

          if (
            candidateWithAgent.agent?.id
          ) {

            agents.set(
              String(
                candidateWithAgent.agent.id,
              ),
              candidateWithAgent.agent.name ||
                candidateWithAgent.agent.code ||
                "Unknown agent",
            );

          }

        },
      );

      return Array.from(
        agents.entries(),
      )
        .map(
          ([
            value,
            label,
          ]) => ({
            value,
            label,
          }),
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label,
            ),
        );

    }, [
      candidates,
    ]);


  // =====================================================
  // STAGE OPTIONS
  // -----------------------------------------------------
  // IMPORTANT:
  //
  // আর candidate data থেকে random stage বানানো হবে না।
  //
  // Central stage registry হচ্ছে source.
  // =====================================================

  const stageOptions =
    useMemo(() => {

      return CANDIDATE_STAGE_DEFINITIONS
        .map(
          (stage) =>
            stage.value,
        );

    }, []);


  // =====================================================
  // MONTH OPTIONS
  // =====================================================

  const monthOptions =
    useMemo(() => {

      const months =
        new Map<
          string,
          string
        >();

      candidates.forEach(
        (candidate) => {

          if (!candidate.created_at) {
            return;
          }

          const date =
            new Date(
              candidate.created_at,
            );

          if (
            Number.isNaN(
              date.getTime(),
            )
          ) {
            return;
          }

          const value =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1,
            ).padStart(2, "0")}`;

          const label =
            date.toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "long",
              },
            );

          months.set(
            value,
            label,
          );

        },
      );

      return Array.from(
        months.entries(),
      )
        .sort(
          (
            a,
            b,
          ) =>
            b[0].localeCompare(
              a[0],
            ),
        )
        .map(
          ([
            value,
            label,
          ]) => ({
            value,
            label,
          }),
        );

    }, [
      candidates,
    ]);


  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredCandidates =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      const result =
        candidates.filter(
          (candidate) => {

            // -------------------------------------------
            // OVERALL STATUS
            // -------------------------------------------

            const status =
              candidateStatusMap.get(
                candidate.id,
              ) ??
              getCandidateOverallStatus(
                candidate,
              );


            if (
              candidateFilter.status !==
              "all"
            ) {

              if (
                status !==
                candidateFilter.status
              ) {
                return false;
              }

            }


            // -------------------------------------------
            // AGENT
            // -------------------------------------------

            if (
              candidateFilter.agentId !==
              "all"
            ) {

              const candidateWithAgent =
                candidate as Candidate & {
                  agent?: {
                    id?: string;
                  };
                };

              const agentId =
                candidateWithAgent.agent?.id ??
                candidate.agent_id;

              if (
                String(agentId) !==
                candidateFilter.agentId
              ) {
                return false;
              }

            }


            // -------------------------------------------
            // GLOBAL STAGE
            // -------------------------------------------

            if (
              candidateFilter.stage !==
              "all"
            ) {

              if (
                candidate.current_stage !==
                candidateFilter.stage
              ) {
                return false;
              }

            }


            // -------------------------------------------
            // MONTH
            // -------------------------------------------

            if (
              candidateFilter.month !==
              "all"
            ) {

              const date =
                new Date(
                  candidate.created_at,
                );

              if (
                Number.isNaN(
                  date.getTime(),
                )
              ) {
                return false;
              }

              const candidateMonth =
                `${date.getFullYear()}-${String(
                  date.getMonth() + 1,
                ).padStart(2, "0")}`;

              if (
                candidateMonth !==
                candidateFilter.month
              ) {
                return false;
              }

            }


            // -------------------------------------------
            // SEARCH
            // -------------------------------------------

            if (!query) {
              return true;
            }


            return (
              candidate.name
                ?.toLowerCase()
                .includes(query)

              ||

              candidate.passport_no
                ?.toLowerCase()
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

              String(
                candidate.sl ?? "",
              )
                .toLowerCase()
                .includes(query)
            );

          },
        );


      // ===================================================
      // SORT
      // ===================================================

      result.sort(
        (
          a,
          b,
        ) => {

          const getValue =
            (
              candidate: Candidate,
            ): string | number => {

              switch (
                candidateSort.field
              ) {

                case "name":
                  return (
                    candidate.name ||
                    ""
                  ).toLowerCase();


                case "passport_no":
                  return (
                    candidate.passport_no ||
                    ""
                  ).toLowerCase();


                case "created_at":
                  return new Date(
                    candidate.created_at ||
                    0,
                  ).getTime();


                case "updated_at":
                  return new Date(
                    candidate.updated_at ||
                    0,
                  ).getTime();


                default:
                  return 0;

              }

            };


          const first =
            getValue(a);

          const second =
            getValue(b);


          let comparison = 0;


          if (
            typeof first === "number" &&
            typeof second === "number"
          ) {

            comparison =
              first - second;

          } else {

            comparison =
              String(first).localeCompare(
                String(second),
              );

          }


          if (
            candidateSort.mode ===
            "descending"
          ) {
            return -comparison;
          }


          if (
            candidateSort.mode ===
            "ascending"
          ) {
            return comparison;
          }


          // Custom = newest first

          return (
            new Date(
              b.created_at || 0,
            ).getTime()
            -
            new Date(
              a.created_at || 0,
            ).getTime()
          );

        },
      );


      return result;

    }, [
      candidates,
      candidateStatusMap,
      search,
      candidateFilter,
      candidateSort,
    ]);


  // =====================================================
  // CREATE
  // =====================================================

  function handleCreate() {

    setEditingCandidate(null);
    setFormOpen(true);

  }


  // =====================================================
  // EDIT
  // =====================================================

  function handleEdit(
    candidate: Candidate,
  ) {

    setEditingCandidate(
      candidate,
    );

    setFormOpen(true);

  }


  // =====================================================
  // DELETE
  // =====================================================

  function handleDelete(
    candidate: Candidate,
  ) {

    setDeletingCandidate(
      candidate,
    );

    setDeleteOpen(true);

  }


  // =====================================================
  // RETURN
  // =====================================================

  function handleReturn(
    candidate: Candidate,
  ) {

    setReturningCandidate(
      candidate,
    );

    setReturnOpen(true);

  }


  // =====================================================
  // RESTORE RETURNED
  // =====================================================

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


      await restoreReturnedCandidate(
        candidate.id,
      );


      await loadCandidates();

    } catch (error) {

      console.error(
        "Failed to restore candidate:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to restore candidate. Please try again.",
      );

    } finally {

      setLoading(false);

    }

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="space-y-6">

      {/* =================================================
          TOOLBAR
          ================================================= */}

      <CandidateToolbar

        search={search}

        searchPlaceholder="Search name, passport..."

        onSearchChange={
          setSearch
        }

        filter={
          candidateFilter
        }

        onFilterChange={
          setCandidateFilter
        }

        agentOptions={
          agentOptions
        }

        stageOptions={
          stageOptions
        }

        monthOptions={
          monthOptions
        }

        sort={
          candidateSort
        }

        onSortChange={
          setCandidateSort
        }

        viewMode={
          viewMode
        }

        onViewModeChange={
          setViewMode
        }

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


      {/* =================================================
          ERROR
          ================================================= */}

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


      {/* =================================================
          CANDIDATE VIEW
          ================================================= */}

      {viewMode === "list" ? (

        <CandidatesTable

          candidates={
            filteredCandidates
          }

          loading={
            loading
          }

          onPassportAction={
            setPassportCandidate
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

      ) : (

        <CandidatesGrid

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

      )}


      {/* =================================================
          PASSPORT
          ================================================= */}

      <CandidatePassportDialog

        candidate={
          passportCandidate
        }

        open={
          !!passportCandidate
        }

        onOpenChange={(
          open,
        ) => {

          if (!open) {
            setPassportCandidate(null);
          }

        }}

      />


      {/* =================================================
          CREATE / EDIT
          ================================================= */}

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

        onSuccess={
          loadCandidates
        }

      />


      {/* =================================================
          DELETE
          ================================================= */}

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


      {/* =================================================
          RETURN
          ================================================= */}

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


      {/* =================================================
          RESULT SUMMARY
          ================================================= */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-2
        "
      >

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          {filteredCandidates.length} candidates
        </p>


        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Active {statusCounts.active}
          {" · "}
          Returned {statusCounts.returned}
          {" · "}
          Complete {statusCounts.complete}
          {" · "}
          Cancelled {statusCounts.cancelled}
        </p>

      </div>

    </div>
  );
}
