// src/modules/erp/candidates/candidates-page.tsx

/* =========================================================
   IMPORTS
========================================================= */

import { useCallback, useEffect, useMemo, useState } from "react";

// ---- UI components (list / grid / dialogs / toolbar) ----
import { CandidatesGrid } from "./components/candidates-grid";
import { CandidateStageSheet } from "./components/candidate-stage";
import { CandidateCancelDialog } from "./components/candidate-cancel-dialog";
import { CandidatePassportDialog } from "./components/candidate-passport-dialog";
import {
  CandidateToolbar,
  type CandidateFilterState,
  type CandidateSortState,
  type ViewMode,
} from "./components/candidate-toolbar";
import { CandidatesTable } from "./components/candidates-table";
import { CandidateFormDialog } from "./components/candidate-form-dialog";
import { CandidateDeleteDialog } from "./components/candidate-delete-dialog";
import { CandidateReturnDialog } from "./components/candidate-return-dialog";

// ---- Data / logic helpers ----
import { useCandidatesLive } from "./candidate-sync";
import { getCandidateOverallStatus } from "./candidate-selectors";
import {
  restoreReturnedCandidate,
  reactivateCandidate,
  getCandidateById,
  type Candidate,
} from "./candidate-service";
import { getLiveWorkflowStates } from "../workflow/workflow-service";
import type { CandidateStage } from "./stage-service";
import {
  getCachedCandidatesFirst,
  refreshCandidatesCache,
} from "./candidate-cache-loader";

/* =========================================================
   PAGE
   Candidates-er main page: list/grid, filter, search, sort
   ebong shob dialog (create, edit, delete, return, cancel)
   ekhane manage hoy.
========================================================= */

export function CandidatesPage() {
  /* =======================================================
     STATE: CANDIDATES DATA
  ======================================================= */

  // Notun add howa candidate-der id (highlight animation-er jonno)
  const [newCandidateIds, setNewCandidateIds] = useState<Set<string>>(
    new Set(),
  );

  // Update howa candidate-der id (highlight animation-er jonno)
  const [updatedCandidateIds, setUpdatedCandidateIds] = useState<Set<string>>(
    new Set(),
  );

  // Kon candidate-er kon kon field change hoyeche (field-level highlight)
  // Map: candidateId -> changed field name-er Set
  const [updatedCandidateFields, setUpdatedCandidateFields] = useState<
    Map<string, Set<string>>
  >(new Map());

  // Main candidates list (screen-e ja dekha jay tar source)
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Dexie (local DB) theke live candidates
  const liveCandidates = useCandidatesLive();
  console.log("DEXIE CANDIDATES:", liveCandidates);

  /* =======================================================
     STATE: SEARCH
  ======================================================= */

  const [search, setSearch] = useState("");

  // Passport dialog-e kon candidate dekhano hobe
  const [passportCandidate, setPassportCandidate] = useState<Candidate | null>(
    null,
  );

  /* =======================================================
     STATE: FILTER
  ======================================================= */

  const [candidateFilter, setCandidateFilter] = useState<CandidateFilterState>(
    {
      status: "all",
      agentId: "all",
      stage: "all",
      month: "all",
    },
  );

  /* =======================================================
     STATE: SORT
  ======================================================= */

  const [candidateSort, setCandidateSort] = useState<CandidateSortState>({
    mode: "custom",
    field: "created_at",
  });

  /* =======================================================
     STATE: VIEW MODE (list / grid)
  ======================================================= */

  const [viewMode, setViewMode] = useState<ViewMode>("list");

  /* =======================================================
     STATE: LOADING / ERROR
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =======================================================
     STATE: MANAGE SERVICES (stage sheet)
  ======================================================= */

  const [servicesOpen, setServicesOpen] = useState(false);
  const [managingServicesCandidate, setManagingServicesCandidate] =
    useState<Candidate | null>(null);

  /* =======================================================
     STATE: CREATE / EDIT DIALOG
  ======================================================= */

  const [formOpen, setFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
    null,
  );

  /* =======================================================
     STATE: CANCEL DIALOG
  ======================================================= */

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellingCandidate, setCancellingCandidate] =
    useState<Candidate | null>(null);

  /* =======================================================
     STATE: DELETE DIALOG
  ======================================================= */

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCandidate, setDeletingCandidate] =
    useState<Candidate | null>(null);

  /* =======================================================
     STATE: RETURN DIALOG
  ======================================================= */

  const [returnOpen, setReturnOpen] = useState(false);
  const [returningCandidate, setReturningCandidate] =
    useState<Candidate | null>(null);

  /* =======================================================
     LOAD CANDIDATES
     1) Age cache theke data dekhay (fast)
     2) Background-e cache refresh kore
     3) Active candidate-der live workflow state hishab kore
  ======================================================= */

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cache theke age data nei (screen taratari dekhanor jonno)
      const data = await getCachedCandidatesFirst();

      // Background-e cache refresh (result-er jonno wait kora hoy na)
      void refreshCandidatesCache().catch((error) => {
        console.error("Failed to refresh candidates cache:", error);
      });

      /* -------------------------------------------------
         LIVE WORKFLOW RECALCULATION

         DB-এর workflow_state stale হতে পারে (কেউ কোনো
         record edit না করলেও validity সময়ের সাথে expire
         হয়ে যায়)। তাই list load হওয়ার সময় active
         candidate-দের জন্য live হিসাব করে overwrite করা
         হচ্ছে — DB-তে কিছু persist হচ্ছে না, শুধু display।
      ------------------------------------------------- */

      // Shudhu active candidate (final_status nai + return hoyni)
      const liveTargets = data.filter(
        (candidate) =>
          candidate.final_status === null && !candidate.is_returned,
      );

      // Default: live hishab fail korle original data-i thakbe
      let mergedData = data;

      try {
        const liveStates = await getLiveWorkflowStates(
          liveTargets.map((candidate) => ({
            id: candidate.id,
            current_stage: candidate.current_stage,
            is_returned: candidate.is_returned,
            final_status: candidate.final_status,
          })),
        );

        // Live state thakle candidate-er workflow_state & hold_reason overwrite
        mergedData = data.map((candidate) => {
          const live = liveStates.get(candidate.id);

          if (!live) {
            return candidate;
          }

          return {
            ...candidate,
            workflow_state: live.workflowState,
            hold_reason: live.holdReason,
          };
        });
      } catch (liveError) {
        console.error("Failed to compute live workflow states:", liveError);
      }

      setCandidates(mergedData);
    } catch (error) {
      console.error("Failed to load candidates:", error);

      setCandidates([]);
      setError("Failed to load candidates. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
     Page open hole ekbar candidates load hobe.
  ======================================================= */

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  /* =======================================================
     DERIVED OVERALL STATUS
     Candidate-er final display status (active/hold/returned/
     complete/cancelled) ber kore.
  ======================================================= */

  function getDisplayStatus(candidate: Candidate) {
    return getCandidateOverallStatus(candidate, {
      moduleStatus: candidate.workflow_state ?? null,
    });
  }

  /* =======================================================
     CHANGED CANDIDATE FIELDS
     Purono ar notun candidate compare kore kon field change
     hoyeche tar Set return kore (highlight-er jonno).
  ======================================================= */

  function getChangedCandidateFields(
    previous: Candidate,
    updated: Candidate,
  ): Set<string> {
    const fields = new Set<string>();

    // Ei field gulo compare kora hobe
    const keys: Array<keyof Candidate> = [
      "sl",
      "passport_no",
      "name",
      "received_date",
      "country",
      "agent_id",
      "current_stage",
      "workflow_state",
      "hold_reason",
      "is_returned",
      "returned_date",
      "returned_reason",
      "final_status",
      "final_reason",
      "is_deleted",
    ];

    for (const key of keys) {
      if (previous[key] !== updated[key]) {
        fields.add(String(key));
      }
    }

    return fields;
  }

  /* =======================================================
     MANAGE SERVICES
     Stage sheet open kore.
  ======================================================= */

  function handleManageServices(candidate: Candidate) {
    setManagingServicesCandidate(candidate);
    setServicesOpen(true);
  }

  /* =======================================================
     STATUS COUNTS
     Page-er niche summary-r jonno status onujayi count.
  ======================================================= */

  const statusCounts = useMemo(() => {
    let active = 0;
    let hold = 0;
    let returned = 0;
    let complete = 0;
    let cancelled = 0;

    candidates.forEach((candidate) => {
      const status = getDisplayStatus(candidate);

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
    });

    return {
      active,
      hold,
      returned,
      complete,
      cancelled,
    };
  }, [candidates]);

  /* =======================================================
     AGENT OPTIONS
     Candidates theke unique agent-er list (filter dropdown-er jonno).
  ======================================================= */

  const agentOptions = useMemo(() => {
    // id -> name (Map use korle duplicate agent auto remove hoy)
    const agents = new Map<string, string>();

    candidates.forEach((candidate) => {
      const agent = (
        candidate as Candidate & {
          agent?: {
            id?: string;
            name?: string | null;
          } | null;
        }
      ).agent;

      if (agent?.id) {
        agents.set(String(agent.id), agent.name || "Unknown agent");
      }
    });

    return Array.from(agents.entries())
      .map(([value, label]) => ({
        value,
        label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // naam onujayi A-Z
  }, [candidates]);

  /* =======================================================
     STAGE OPTIONS
     Candidates-er unique current_stage list (filter dropdown).
  ======================================================= */

  const stageOptions = useMemo(() => {
    return Array.from(
      new Set(
        candidates
          .map((candidate) => candidate.current_stage)
          .filter((stage): stage is CandidateStage => Boolean(stage)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [candidates]);

  /* =======================================================
     MONTH OPTIONS
     created_at theke unique month list (newest age).
     value = "YYYY-MM", label = "Month YYYY".
  ======================================================= */

  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();

    candidates.forEach((candidate) => {
      const rawDate = candidate.created_at;

      // Date na thakle skip
      if (!rawDate) {
        return;
      }

      const date = new Date(rawDate);

      // Invalid date hole skip
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      const label = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      });

      months.set(value, label);
    });

    return Array.from(months.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // newest month age
      .map(([value, label]) => ({
        value,
        label,
      }));
  }, [candidates]);

  /* =======================================================
     FILTER + SEARCH + SORT
     Final list jeta table/grid-e dekhano hoy.
  ======================================================= */

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = candidates.filter((candidate) => {
      /* ---------------------------------------------
         STATUS FILTER
      --------------------------------------------- */

      const status = getDisplayStatus(candidate);

      if (candidateFilter.status !== "all") {
        if (status !== candidateFilter.status) {
          return false;
        }
      }

      /* ---------------------------------------------
         AGENT FILTER
      --------------------------------------------- */

      if (candidateFilter.agentId !== "all") {
        const agentId = (
          candidate as Candidate & {
            agent?: {
              id?: string;
            } | null;
          }
        ).agent?.id;

        if (String(agentId) !== candidateFilter.agentId) {
          return false;
        }
      }

      /* ---------------------------------------------
         STAGE FILTER
      --------------------------------------------- */

      if (candidateFilter.stage !== "all") {
        if (candidate.current_stage !== candidateFilter.stage) {
          return false;
        }
      }

      /* ---------------------------------------------
         MONTH FILTER
      --------------------------------------------- */

      if (candidateFilter.month !== "all") {
        const rawDate = candidate.created_at;

        if (!rawDate) {
          return false;
        }

        const date = new Date(rawDate);

        if (Number.isNaN(date.getTime())) {
          return false;
        }

        const candidateMonth = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        if (candidateMonth !== candidateFilter.month) {
          return false;
        }
      }

      /* ---------------------------------------------
         SEARCH
         name / passport / country / stage-e khoje.
      --------------------------------------------- */

      // Search khali hole sob candidate dekhao
      if (!query) {
        return true;
      }

      return (
        candidate.name?.toLowerCase().includes(query) ||
        candidate.passport_no?.toLowerCase().includes(query) ||
        candidate.country?.toLowerCase().includes(query) ||
        candidate.current_stage?.toLowerCase().includes(query)
      );
    });

    /* ===================================================
       SORT
    =================================================== */

    result.sort((a, b) => {
      // Sort field onujayi compare-er value ber kore
      const getValue = (candidate: Candidate): string | number => {
        switch (candidateSort.field) {
          case "name":
            return (candidate.name || "").toLowerCase();

          case "passport_no":
            return (candidate.passport_no || "").toLowerCase();

          case "created_at":
            return new Date(candidate.created_at || 0).getTime();

          case "updated_at":
            return new Date(candidate.updated_at || 0).getTime();

          default:
            return 0;
        }
      };

      const first = getValue(a);
      const second = getValue(b);

      let comparison = 0;

      if (typeof first === "number" && typeof second === "number") {
        // Number hole subtract
        comparison = first - second;
      } else {
        // Text hole localeCompare
        comparison = String(first).localeCompare(String(second));
      }

      // Descending: ulta
      if (candidateSort.mode === "descending") {
        return -comparison;
      }

      // Ascending: shoja
      if (candidateSort.mode === "ascending") {
        return comparison;
      }

      /* ---------------------------------------------
         CUSTOM

         Existing behaviour:
         newest first.
      --------------------------------------------- */

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

    return result;
  }, [candidates, search, candidateFilter, candidateSort]);

  /* =======================================================
     HANDLER: CREATE
     Form dialog notun candidate-er jonno open kore.
  ======================================================= */

  function handleCreate() {
    setEditingCandidate(null);
    setFormOpen(true);
  }

  /* =======================================================
     HANDLER: EDIT
     Form dialog existing candidate edit-er jonno open kore.
  ======================================================= */

  function handleEdit(candidate: Candidate) {
    setEditingCandidate(candidate);
    setFormOpen(true);
  }

  /* =======================================================
     HANDLER: DELETE
     Delete confirm dialog open kore.
  ======================================================= */

  function handleDelete(candidate: Candidate) {
    setDeletingCandidate(candidate);
    setDeleteOpen(true);
  }

  /* =======================================================
     HANDLER: RETURN
     Return dialog open kore.
  ======================================================= */

  function handleReturn(candidate: Candidate) {
    setReturningCandidate(candidate);
    setReturnOpen(true);
  }

  /* =======================================================
     HANDLER: CANCEL
     Cancel dialog open kore.
  ======================================================= */

  function handleCancel(candidate: Candidate) {
    setCancellingCandidate(candidate);
    setCancelOpen(true);
  }

  /* =======================================================
     HANDLER: RESTORE RETURNED
     Return howa candidate-ke abar active kore.
  ======================================================= */

  async function handleRestore(candidate: Candidate) {
    // User-er confirmation chai
    const confirmed = window.confirm(
      `Restore ${candidate.name} and mark the candidate as active?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await restoreReturnedCandidate(candidate.id);

      // Restore-er pore list abar load
      await loadCandidates();
    } catch (error) {
      console.error("Failed to restore candidate:", error);

      setError("Failed to restore candidate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     HANDLER: REACTIVATE CANCELLED
     Cancel howa candidate-ke abar active kore.
  ======================================================= */

  async function handleReactivate(candidate: Candidate) {
    const confirmed = window.confirm(`Reactivate ${candidate.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await reactivateCandidate(candidate.id);

      // Reactivate-er pore list abar load
      await loadCandidates();
    } catch (error) {
      console.error("Failed to reactivate candidate:", error);

      setError("Failed to reactivate candidate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     HANDLER: CANDIDATE UPDATED
     Candidate update hole:
       1) Kon field change hoyeche ta ber kore
       2) List-e candidate replace kore
       3) Highlight dekhay, 1.4 second pore tule nei
  ======================================================= */

  function handleCandidateUpdated(updatedCandidate: Candidate) {
    // Update-er age candidate-er purono version
    const previousCandidate = candidates.find(
      (candidate) => candidate.id === updatedCandidate.id,
    );

    // Purono version thakle changed field gulo save kori
    if (previousCandidate) {
      const changedFields = getChangedCandidateFields(
        previousCandidate,
        updatedCandidate,
      );

      setUpdatedCandidateFields((current) => {
        const next = new Map(current);

        next.set(updatedCandidate.id, changedFields);

        return next;
      });
    }

    // List-e updated candidate bosiye dei
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === updatedCandidate.id ? updatedCandidate : candidate,
      ),
    );

    // Row highlight on
    setUpdatedCandidateIds((current) => {
      const next = new Set(current);

      next.add(updatedCandidate.id);

      return next;
    });

    // 1.4 second pore highlight off
    window.setTimeout(() => {
      setUpdatedCandidateIds((current) => {
        const next = new Set(current);

        next.delete(updatedCandidate.id);

        return next;
      });

      setUpdatedCandidateFields((current) => {
        const next = new Map(current);

        next.delete(updatedCandidate.id);

        return next;
      });
    }, 1400);
  }

  /* =======================================================
     HANDLER: CANCEL SUCCESS
     Cancel hoye gele list update kore, tarpor DB theke
     fresh data niye abar update kore.
  ======================================================= */

  async function handleCancelSuccess(updatedCandidate: Candidate) {
    // Sathe sathe list-e updated candidate dekhai
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === updatedCandidate.id ? updatedCandidate : candidate,
      ),
    );

    setCancellingCandidate(null);

    /*
     * Safety refresh:
     *
     * Ensures the UI receives the complete
     * database-side candidate state.
     */

    try {
      const freshCandidate = await getCandidateById(updatedCandidate.id);

      if (freshCandidate) {
        setCandidates((current) =>
          current.map((candidate) =>
            candidate.id === freshCandidate.id ? freshCandidate : candidate,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to refresh cancelled candidate:", error);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      {/* =================================================
          TOOLBAR (search, filter, sort, view, refresh, create)
      ================================================= */}

      <CandidateToolbar
        search={search}
        searchPlaceholder="Search name, passport..."
        onSearchChange={setSearch}
        filter={candidateFilter}
        onFilterChange={setCandidateFilter}
        agentOptions={agentOptions}
        stageOptions={stageOptions}
        monthOptions={monthOptions}
        sort={candidateSort}
        onSortChange={setCandidateSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadCandidates}
        onCreate={handleCreate}
        refreshing={loading}
      />

      {/* =================================================
          ERROR MESSAGE
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
            onClick={loadCandidates}
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
          CANDIDATE VIEW (list = table, otherwise grid)
      ================================================= */}

      {viewMode === "list" ? (
        <CandidatesTable
          candidates={filteredCandidates}
          loading={loading}
          onPassportAction={setPassportCandidate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReturn={handleReturn}
          onCancel={handleCancel}
          onRestore={handleRestore}
          onManageServices={handleManageServices}
          onReactivate={handleReactivate}
          onCandidateUpdated={handleCandidateUpdated}
          newCandidateIds={newCandidateIds}
          updatedCandidateIds={updatedCandidateIds}
          updatedCandidateFields={updatedCandidateFields}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CandidatesGrid
            candidates={filteredCandidates}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReturn={handleReturn}
            onRestore={handleRestore}
            onCancel={handleCancel}
            onReactivate={handleReactivate}
          />
        </div>
      )}

      {/* =================================================
          PASSPORT DIALOG
      ================================================= */}

      <CandidatePassportDialog
        candidate={passportCandidate}
        open={!!passportCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setPassportCandidate(null);
          }
        }}
      />

      {/* =================================================
          CREATE / EDIT DIALOG
      ================================================= */}

      <CandidateFormDialog
        open={formOpen}
        candidate={editingCandidate}
        onOpenChange={setFormOpen}
        onSuccess={(newCandidate) => {
          setFormOpen(false);

          // Edit korle: update handler call kore ber hoye jai
          if (editingCandidate) {
            handleCandidateUpdated(newCandidate);

            setEditingCandidate(null);

            return;
          }

          // New candidate: পুরো list reload নয়
          setCandidates((current) => [newCandidate, ...current]);

          // Notun row highlight on
          setNewCandidateIds((current) => {
            const next = new Set(current);

            next.add(newCandidate.id);

            return next;
          });

          // 1.8 second pore highlight off
          window.setTimeout(() => {
            setNewCandidateIds((current) => {
              const next = new Set(current);

              next.delete(newCandidate.id);

              return next;
            });
          }, 1800);
        }}
      />

      {/* =================================================
          DELETE DIALOG
      ================================================= */}

      <CandidateDeleteDialog
        open={deleteOpen}
        candidate={deletingCandidate}
        onOpenChange={setDeleteOpen}
        onSuccess={() => {
          const deletedId = deletingCandidate?.id;

          setDeleteOpen(false);
          setDeletingCandidate(null);

          if (!deletedId) {
            return;
          }

          // List theke deleted candidate bad dei
          setCandidates((current) =>
            current.filter((candidate) => candidate.id !== deletedId),
          );
        }}
      />

      {/* =================================================
          MANAGE SERVICES / STAGE SHEET
      ================================================= */}

      <CandidateStageSheet
        candidate={managingServicesCandidate}
        open={servicesOpen}
        onOpenChange={(open) => {
          setServicesOpen(open);

          // Sheet bondho hole candidate clear kore list reload
          if (!open) {
            setManagingServicesCandidate(null);

            loadCandidates();
          }
        }}
        onSuccess={() => {
          loadCandidates();
        }}
      />

      {/* =================================================
          RETURN DIALOG
      ================================================= */}

      <CandidateReturnDialog
        open={returnOpen}
        candidate={returningCandidate}
        onOpenChange={setReturnOpen}
        onSuccess={() => {
          setReturningCandidate(null);

          loadCandidates();
        }}
      />

      {/* =================================================
          CANCEL DIALOG
      ================================================= */}

      <CandidateCancelDialog
        open={cancelOpen}
        candidate={cancellingCandidate}
        onOpenChange={(open) => {
          setCancelOpen(open);

          if (!open) {
            setCancellingCandidate(null);
          }
        }}
        onSuccess={handleCancelSuccess}
      />

      {/* =================================================
          RESULT SUMMARY (total count + status wise count)
      ================================================= */}

      <div
        className="
          flex
          shrink-0
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
