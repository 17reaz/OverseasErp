import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CandidatesGrid,
} from "./components/candidates-grid";
import { CandidateStageSheet } from "./components/candidate-stage";

import {
  CandidateCancelDialog,
} from "./components/candidate-cancel-dialog";

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
  getCandidates,
  restoreReturnedCandidate,
  reactivateCandidate,
  getCandidateById,
  fetchCandidatesModuleStatuses,
  type Candidate,
} from "./candidate-service";

import type {
  CandidateStage,
} from "./candidate-stage";
import type { ModuleStatus } from "./profile/types";

type CandidateModuleStatusSummary = {
  status: ModuleStatus;
  recordExists: boolean;
};

type CandidateModuleStatusMap = Record<
  string,
  Record<string, CandidateModuleStatusSummary>
>;
import {
  MODULES,
} from "./profile/module-configs";
import {
  ModuleRecordsSheet,
} from "./profile/module-records-sheet";
/* =========================================================
   PAGE
========================================================= */

export function CandidatesPage() {

  /* =======================================================
     CANDIDATES
  ======================================================= */

  const [
    candidates,
    setCandidates,
  ] = useState<Candidate[]>([]);


  /* =======================================================
     SEARCH
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    passportCandidate,
    setPassportCandidate,
  ] = useState<Candidate | null>(null);


  /* =======================================================
     FILTER
  ======================================================= */

  const [
    candidateFilter,
    setCandidateFilter,
  ] =
    useState<CandidateFilterState>({
      status: "all",
      agentId: "all",
      stage: "all",
      month: "all",
    });


  /* =======================================================
     SORT
  ======================================================= */

  const [
    candidateSort,
    setCandidateSort,
  ] =
    useState<CandidateSortState>({
      mode: "custom",
      field: "created_at",
    });


  /* =======================================================
     VIEW
  ======================================================= */

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>("list");


  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [managingServicesCandidate, setManagingServicesCandidate] = useState<Candidate | null>(null);
  const [
  moduleStatuses,
  setModuleStatuses,
] = useState<CandidateModuleStatusMap>({});

const [
  stageSheetOpen,
  setStageSheetOpen,
] = useState(false);

const [
  stageSheetCandidate,
  setStageSheetCandidate,
] = useState<Candidate | null>(null);

const [
  stageSheetModuleKey,
  setStageSheetModuleKey,
] = useState<string | null>(null);

  /* =======================================================
     CREATE / EDIT
  ======================================================= */

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingCandidate,
    setEditingCandidate,
  ] = useState<Candidate | null>(null);


  /* =======================================================
     CANCEL
  ======================================================= */

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    cancellingCandidate,
    setCancellingCandidate,
  ] = useState<Candidate | null>(null);


  /* =======================================================
     DELETE
  ======================================================= */

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    deletingCandidate,
    setDeletingCandidate,
  ] = useState<Candidate | null>(null);


  /* =======================================================
     RETURN
  ======================================================= */

  const [
    returnOpen,
    setReturnOpen,
  ] = useState(false);

  const [
    returningCandidate,
    setReturningCandidate,
  ] = useState<Candidate | null>(null);


  /* =======================================================
     LOAD CANDIDATES
  ======================================================= */

  const loadCandidates =
    useCallback(
      async () => {

        setLoading(true);

        setError(null);


        try {

          const data =
            await getCandidates();

          setCandidates(
            data,
          );

          try {
            const statuses =
              await fetchCandidatesModuleStatuses(
                data.map(
                  (candidate) => candidate.id,
                ),
              );

            setModuleStatuses(
              statuses as CandidateModuleStatusMap,
            );
          } catch (statusError) {
            console.error(
              "Failed to load candidate module statuses:",
              statusError,
            );

            setModuleStatuses({});
          }

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


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadCandidates();

  }, [
    loadCandidates,
  ]);


  /* =======================================================
     DERIVED OVERALL STATUS
  ======================================================= */

  function getDisplayStatus(
    candidate: Candidate,
  ) {

    return getCandidateOverallStatus(
      candidate,
    );

  }

function handleManageServices(candidate: Candidate) {
  setManagingServicesCandidate(candidate);
  setServicesOpen(true);
}

function handleStageClick(candidate: Candidate) {
  const module = candidate.current_stage
    ? MODULES.find(
        (item) => item.key === candidate.current_stage,
      )
    : null;

  if (!module) {
    return;
  }

  setStageSheetCandidate(candidate);
  setStageSheetModuleKey(module.key);
  setStageSheetOpen(true);
}

const stageSheetModule = useMemo(
  () =>
    stageSheetModuleKey
      ? MODULES.find(
          (module) => module.key === stageSheetModuleKey,
        ) ?? null
      : null,
  [stageSheetModuleKey],
);
  /* =======================================================
     STATUS COUNTS
  ======================================================= */

  const statusCounts =
    useMemo(() => {

      let active = 0;

      let hold = 0;

      let returned = 0;

      let complete = 0;

      let cancelled = 0;


      candidates.forEach(
        (candidate) => {

          const status =
            getDisplayStatus(
              candidate,
            );


          switch (status) {

            case "active":
              active++;
              break;

            case "hold":
              hold++;
              break;

            case "returned":
              returned++;
              break;

            case "complete":
              complete++;
              break;

            case "cancelled":
              cancelled++;
              break;

          }

        },
      );


      return {
        active,
        hold,
        returned,
        complete,
        cancelled,
      };

    }, [
      candidates,
    ]);


  /* =======================================================
     AGENT OPTIONS
  ======================================================= */

  const agentOptions =
    useMemo(() => {

      const agents =
        new Map<
          string,
          string
        >();


      candidates.forEach(
        (candidate) => {

          const agent =
            (
              candidate as Candidate & {
                agent?: {
                  id?: string;
                  name?: string | null;
                } | null;
              }
            ).agent;


          if (
            agent?.id
          ) {

            agents.set(
              String(agent.id),
              agent.name ||
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


  /* =======================================================
     STAGE OPTIONS
  ======================================================= */

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
              ): stage is CandidateStage =>
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


  /* =======================================================
     MONTH OPTIONS
  ======================================================= */

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
            candidate.created_at;


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


  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const filteredCandidates =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      const result =
        candidates.filter(
          (candidate) => {

            /* ---------------------------------------------
               STATUS
            --------------------------------------------- */

            const status =
              getDisplayStatus(
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


            /* ---------------------------------------------
               AGENT
            --------------------------------------------- */

            if (
              candidateFilter.agentId !==
              "all"
            ) {

              const agentId =
                (
                  candidate as Candidate & {
                    agent?: {
                      id?: string;
                    } | null;
                  }
                ).agent?.id;


              if (
                String(agentId) !==
                candidateFilter.agentId
              ) {

                return false;

              }

            }


            /* ---------------------------------------------
               STAGE
            --------------------------------------------- */

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


            /* ---------------------------------------------
               MONTH
            --------------------------------------------- */

            if (
              candidateFilter.month !==
              "all"
            ) {

              const rawDate =
                candidate.created_at;


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


            /* ---------------------------------------------
               SEARCH
            --------------------------------------------- */

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
            );

          },
        );


      /* ===================================================
         SORT
      =================================================== */

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


          /* ---------------------------------------------
             CUSTOM

             Existing behaviour:
             newest first.
          --------------------------------------------- */

          return (
            new Date(
              b.created_at ||
                0,
            ).getTime()
            -
            new Date(
              a.created_at ||
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


  /* =======================================================
     CREATE
  ======================================================= */

  function handleCreate() {

    setEditingCandidate(
      null,
    );

    setFormOpen(
      true,
    );

  }


  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit(
    candidate: Candidate,
  ) {

    setEditingCandidate(
      candidate,
    );

    setFormOpen(
      true,
    );

  }


  /* =======================================================
     DELETE
  ======================================================= */

  function handleDelete(
    candidate: Candidate,
  ) {

    setDeletingCandidate(
      candidate,
    );

    setDeleteOpen(
      true,
    );

  }


  /* =======================================================
     RETURN
  ======================================================= */

  function handleReturn(
    candidate: Candidate,
  ) {

    setReturningCandidate(
      candidate,
    );

    setReturnOpen(
      true,
    );

  }


  /* =======================================================
     CANCEL
  ======================================================= */

  function handleCancel(
    candidate: Candidate,
  ) {

    setCancellingCandidate(
      candidate,
    );

    setCancelOpen(
      true,
    );

  }


  /* =======================================================
     RESTORE RETURNED
  ======================================================= */

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

      setLoading(
        true,
      );

      setError(
        null,
      );


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
        "Failed to restore candidate. Please try again.",
      );

    } finally {

      setLoading(
        false,
      );

    }

  }


  /* =======================================================
     REACTIVATE CANCELLED
  ======================================================= */

  async function handleReactivate(
    candidate: Candidate,
  ) {

    const confirmed =
      window.confirm(
        `Reactivate ${candidate.name}?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setLoading(
        true,
      );

      setError(
        null,
      );


      await reactivateCandidate(
        candidate.id,
      );


      await loadCandidates();

    } catch (error) {

      console.error(
        "Failed to reactivate candidate:",
        error,
      );


      setError(
        "Failed to reactivate candidate. Please try again.",
      );

    } finally {

      setLoading(
        false,
      );

    }

  }

  function handleCandidateUpdated(updatedCandidate: Candidate) {
  setCandidates((current) =>
    current.map((candidate) =>
      candidate.id === updatedCandidate.id ? updatedCandidate : candidate,
    ),
  );
}
  /* =======================================================
     CANCEL SUCCESS
  ======================================================= */

  async function handleCancelSuccess(
    updatedCandidate: Candidate,
  ) {

    setCandidates(
      (current) =>
        current.map(
          (candidate) =>
            candidate.id ===
            updatedCandidate.id
              ? updatedCandidate
              : candidate,
        ),
    );


    setCancellingCandidate(
      null,
    );


    /*
     * Safety refresh:
     *
     * Ensures the UI receives the complete
     * database-side candidate state.
     */

    try {

      const freshCandidate =
        await getCandidateById(
          updatedCandidate.id,
        );


      if (freshCandidate) {

        setCandidates(
          (current) =>
            current.map(
              (candidate) =>
                candidate.id ===
                freshCandidate.id
                  ? freshCandidate
                  : candidate,
            ),
        );

      }

    } catch (error) {

      console.error(
        "Failed to refresh cancelled candidate:",
        error,
      );

    }

  }


  /* =======================================================
     RENDER
  ======================================================= */

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

          onCancel={
            handleCancel
          }

          onRestore={
            handleRestore
          }
          onManageServices={handleManageServices}
          onStageClick={handleStageClick}
          moduleStatuses={moduleStatuses}
          onReactivate={
            handleReactivate
          }
          onCandidateUpdated={handleCandidateUpdated}
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

          onCancel={
            handleCancel
          }

          onReactivate={
            handleReactivate
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

        onOpenChange={
          (open) => {

            if (!open) {

              setPassportCandidate(
                null,
              );

            }

          }
        }

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
          () => {

            loadCandidates();

          }
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

        onSuccess={
          () => {

            setDeletingCandidate(
              null,
            );

            loadCandidates();

          }
        }

      />

        <CandidateStageSheet
  open={servicesOpen}
  candidateId={managingServicesCandidate?.id ?? ""}
  candidateName={managingServicesCandidate?.name}
  onOpenChange={setServicesOpen}
  onSuccess={() => {
    setManagingServicesCandidate(null);
    loadCandidates();
  }}
/>

      {/* =================================================
          CURRENT STAGE MODULE
      ================================================= */}

      {stageSheetCandidate && stageSheetModule && (
        <ModuleRecordsSheet
          module={stageSheetModule}
          candidateId={stageSheetCandidate.id}
          tenantId={stageSheetCandidate.tenant_id ?? null}
          open={stageSheetOpen}
          onOpenChange={(open) => {
            setStageSheetOpen(open);

            if (!open) {
              setStageSheetCandidate(null);
              setStageSheetModuleKey(null);
            }
          }}
          onSuccess={() => {
            loadCandidates();
          }}
        />
      )}

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

        onSuccess={
          () => {

            setReturningCandidate(
              null,
            );

            loadCandidates();

          }
        }

      />


      {/* =================================================
          CANCEL
      ================================================= */}

      <CandidateCancelDialog

        open={
          cancelOpen
        }

        candidate={
          cancellingCandidate
        }

        onOpenChange={
          (open) => {

            setCancelOpen(
              open,
            );

            if (!open) {

              setCancellingCandidate(
                null,
              );

            }

          }
        }

        onSuccess={
          handleCancelSuccess
        }

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

          Hold {statusCounts.hold}

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
