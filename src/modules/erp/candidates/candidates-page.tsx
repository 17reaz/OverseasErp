import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CandidatesGrid,
} from "./components/candidates-grid";
import { CandidatePassportDialog } from "./components/candidate-passport-dialog";

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
  getCandidates,
  restoreCandidate,
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

const [passportCandidate, setPassportCandidate] =
  useState<Candidate | null>(null);
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
  ] = useState<string | null>(
    null,
  );


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
  ] = useState<Candidate | null>(
    null,
  );


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
  ] = useState<Candidate | null>(
    null,
  );


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
  ] = useState<Candidate | null>(
    null,
  );


  // =====================================================
  // LOAD CANDIDATES
  // =====================================================

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


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadCandidates();

  }, [
    loadCandidates,
  ]);


  // =====================================================
  // ACTIVE / RETURNED COUNTS
  // =====================================================

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

          if (
            candidate.agent?.id
          ) {

            agents.set(
              String(
                candidate.agent.id,
              ),
              candidate.agent.name ||
                candidate.agent.code ||
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
  // =====================================================

  const stageOptions =
    useMemo(() => {

      return Array.from(
        new Set(
          candidates
            .map(
              (candidate) =>
                candidate.current_stage,
            )
            .filter(
              (
                stage,
              ): stage is string =>
                Boolean(stage),
            ),
        ),
      ).sort(
        (a, b) =>
          a.localeCompare(b),
      );

    }, [
      candidates,
    ]);


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

          const rawDate =
            (
              candidate as Candidate & {
                created_at?: string;
              }
            ).created_at;

          if (!rawDate) {
            return;
          }

          const date =
            new Date(rawDate);

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
            // STATUS
            // -------------------------------------------

            if (
              candidateFilter.status ===
              "active" &&
              candidate.is_returned
            ) {
              return false;
            }

            if (
              candidateFilter.status ===
              "returned" &&
              !candidate.is_returned
            ) {
              return false;
            }


            // -------------------------------------------
            // AGENT
            // -------------------------------------------

            if (
              candidateFilter.agentId !==
              "all"
            ) {

              const agentId =
                candidate.agent?.id;

              if (
                String(agentId) !==
                candidateFilter.agentId
              ) {
                return false;
              }

            }


            // -------------------------------------------
            // STAGE
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

              const rawDate =
                (
                  candidate as Candidate & {
                    created_at?: string;
                  }
                ).created_at;

              if (!rawDate) {
                return false;
              }

              const date =
                new Date(rawDate);

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
                    (
                      candidate as Candidate & {
                        created_at?: string;
                      }
                    ).created_at ||
                      0,
                  ).getTime();

                case "updated_at":
                  return new Date(
                    (
                      candidate as Candidate & {
                        updated_at?: string;
                      }
                    ).updated_at ||
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
            typeof first ===
              "number" &&
            typeof second ===
              "number"
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


          // Custom default:
          // newest first

          return (
            new Date(
              (
                b as Candidate & {
                  created_at?: string;
                }
              ).created_at ||
                0,
            ).getTime()
            -
            new Date(
              (
                a as Candidate & {
                  created_at?: string;
                }
              ).created_at ||
                0,
            ).getTime()
          );

        },
      );


      return result;

    }, [
      candidates,
      search,
      candidateFilter,
      candidateSort,
    ]);


  // =====================================================
  // CREATE
  // =====================================================

  function handleCreate() {

    setEditingCandidate(
      null,
    );

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
  // RESTORE
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


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="
        space-y-6
      "
    >

      {/* =================================================
          TOOLBAR
          ================================================= */}

      <CandidateToolbar

        

        search={
          search
        }

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
          RESULT SUMMARY
          ================================================= */}


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

      {/*
        Grid mode is intentionally not rendered yet.

        The toolbar is already ready for List / Grid.
        Until a CandidatesGrid component is introduced,
        Grid will continue to use the existing table.
      */}

      {viewMode === "list" ? (
  <CandidatesTable
    candidates={filteredCandidates}
    loading={loading}
    onPassportAction={setPassportCandidate}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onReturn={handleReturn}
    onRestore={handleRestore}
  />
) : (
  <CandidatesGrid
    candidates={filteredCandidates}
    loading={loading}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onReturn={handleReturn}
    onRestore={handleRestore}
  />
)}

<CandidatePassportDialog
  candidate={passportCandidate}
  open={!!passportCandidate}
  onOpenChange={(open) => {
    if (!open) setPassportCandidate(null);
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

        onSuccess={() => {

          loadCandidates();

        }}

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
      
      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          {filteredCandidates.length}{" "}
          candidates
        </p>


        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Active {activeCount}
          {" · "}
          Returned {returnedCount}
        </p>

      </div>


    </div>

  );
}