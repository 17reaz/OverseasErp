import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  MofaForm,
} from "./components/mofa-form";

import {
  MofaTable,
} from "./components/mofa-table";

import {
  MofaToolbar,
  type MofaFilterState,
  type MofaSortState,
  type MofaViewMode,
} from "./components/mofa-toolbar";

import {
  deleteMofa,
  getMofaCandidates,
  getMofas,
  type Mofa,
  type MofaCandidate,
} from "./mofa-service";


/* =========================================================
 * DEFAULT FILTER
 * ========================================================= */

const defaultFilter: MofaFilterState = {
  view: "all",
  month: "all",
};


/* =========================================================
 * DEFAULT SORT
 * ========================================================= */

const defaultSort: MofaSortState = {
  mode: "descending",
  field: "created_at",
};


/* =========================================================
 * PAGE
 * ========================================================= */

export function MofaPage() {

  /* =======================================================
   * MOFA DATA
   * ======================================================= */

  const [
    mofas,
    setMofas,
  ] = useState<Mofa[]>([]);


  /* =======================================================
   * CANDIDATES
   * ======================================================= */

  const [
    candidates,
    setCandidates,
  ] = useState<MofaCandidate[]>([]);


  /* =======================================================
   * LOADING
   * ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    candidatesLoading,
    setCandidatesLoading,
  ] = useState(false);


  /* =======================================================
   * FORM
   * ======================================================= */

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    editingMofa,
    setEditingMofa,
  ] = useState<Mofa | null>(null);


  const [
    selectedCandidate,
    setSelectedCandidate,
  ] = useState<MofaCandidate | null>(null);


  /* =======================================================
   * SEARCH
   * ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");


  /* =======================================================
   * FILTER
   * ======================================================= */

  const [
    filter,
    setFilter,
  ] = useState<MofaFilterState>(
    defaultFilter,
  );


  /* =======================================================
   * SORT
   * ======================================================= */

  const [
    sort,
    setSort,
  ] = useState<MofaSortState>(
    defaultSort,
  );


  /* =======================================================
   * VIEW
   * ======================================================= */

  const [
    viewMode,
    setViewMode,
  ] = useState<MofaViewMode>(
    "list",
  );


  /* =======================================================
   * LOAD MOFA
   * ======================================================= */

  const loadMofas = useCallback(
    async () => {

      try {

        setLoading(true);

        const {
          data,
          error,
        } = await getMofas();

        if (error) {
          throw error;
        }

        setMofas(
          data ?? [],
        );

      } catch (error) {

        console.error(
          error,
        );

        toast.error(
          "Failed to load MOFA records.",
          "Please try again.",
        );

      } finally {

        setLoading(false);

      }

    },
    [],
  );


  /* =======================================================
   * LOAD CANDIDATES
   *
   * MOFA does NOT require medical.
   *
   * Therefore candidates are loaded independently.
   * ======================================================= */

  const loadCandidates = useCallback(
    async () => {

      try {

        setCandidatesLoading(true);

        const {
          data,
          error,
        } = await getMofaCandidates();

        if (error) {
          throw error;
        }

        setCandidates(
          data ?? [],
        );

      } catch (error) {

        console.error(
          error,
        );

        toast.error(
          "Failed to load candidates.",
          "Please try again.",
        );

      } finally {

        setCandidatesLoading(false);

      }

    },
    [],
  );


  /* =======================================================
   * INITIAL LOAD
   * ======================================================= */

  useEffect(() => {

    void loadMofas();
    void loadCandidates();

  }, [
    loadMofas,
    loadCandidates,
  ]);


  /* =======================================================
   * FILTER + SEARCH + SORT
   * ======================================================= */

  const filteredMofas = useMemo(
    () => {

      const query =
        search
          .trim()
          .toLowerCase();


      let result =
        mofas.filter(
          (mofa) => {

            /* =============================================
             * SEARCH
             * ============================================= */

            const matchesSearch =
              !query ||
              (
                mofa.candidate?.name
                  ?.toLowerCase()
                  .includes(query)
              ) ||
              (
                mofa.candidate?.passport_no
                  ?.toLowerCase()
                  .includes(query)
              ) ||
              (
                mofa.application_number
                  ?.toLowerCase()
                  .includes(query)
              ) ||
              (
                mofa.trade
                  ?.toLowerCase()
                  .includes(query)
              ) ||
              (
                mofa.agency?.name
                  ?.toLowerCase()
                  .includes(query)
              );


            /* =============================================
             * STAGE
             * ============================================= */

            const matchesStage =
              filter.view === "all" ||
              mofa.stage === filter.view;


            /* =============================================
             * MONTH
             *
             * Toolbar gives:
             *
             * 2026-08
             *
             * So compare YYYY-MM directly.
             * ============================================= */

            let matchesMonth = true;

            if (
              filter.month !== "all"
            ) {

              const date =
                mofa.application_date;

              if (!date) {

                matchesMonth = false;

              } else {

                const monthKey =
                  date.slice(0, 7);

                matchesMonth =
                  monthKey === filter.month;

              }

            }


            return (
              matchesSearch &&
              matchesStage &&
              matchesMonth
            );

          },
        );


      /* =====================================================
       * SORT
       * ===================================================== */

      result = [
        ...result,
      ].sort(
        (a, b) => {

          let first = "";
          let second = "";


          switch (
            sort.field
          ) {

            case "name":

              first =
                a.candidate?.name ??
                "";

              second =
                b.candidate?.name ??
                "";

              break;


            case "passport_no":

              first =
                a.candidate?.passport_no ??
                "";

              second =
                b.candidate?.passport_no ??
                "";

              break;


            case "application_number":

              first =
                a.application_number ??
                "";

              second =
                b.application_number ??
                "";

              break;


            case "application_date":

              first =
                a.application_date ??
                "";

              second =
                b.application_date ??
                "";

              break;


            case "updated_at":

              first =
                a.updated_at ??
                "";

              second =
                b.updated_at ??
                "";

              break;


            case "created_at":

            default:

              first =
                a.created_at ??
                "";

              second =
                b.created_at ??
                "";

              break;

          }


          const comparison =
            first.localeCompare(
              second,
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              },
            );


          if (
            sort.mode ===
            "descending"
          ) {
            return -comparison;
          }


          return comparison;

        },
      );


      return result;

    },
    [
      mofas,
      search,
      filter,
      sort,
    ],
  );


  /* =======================================================
   * CREATE
   * ======================================================= */

  function handleCreate() {

    setEditingMofa(null);

    setSelectedCandidate(null);

    setFormOpen(true);

  }


  /* =======================================================
   * CREATE FROM CANDIDATE
   *
   * Reserved for future Candidate → MOFA flow.
   * ======================================================= */

  function handleAddMofa(
    candidate: MofaCandidate,
  ) {

    setEditingMofa(null);

    setSelectedCandidate(
      candidate,
    );

    setFormOpen(true);

  }


  /* =======================================================
   * EDIT
   * ======================================================= */

  function handleEdit(
    mofa: Mofa,
  ) {

    setEditingMofa(
      mofa,
    );

    setSelectedCandidate(
      null,
    );

    setFormOpen(true);

  }


  /* =======================================================
   * DELETE
   * ======================================================= */

  async function handleDelete(
    mofa: Mofa,
  ) {

    const confirmed =
      window.confirm(
        `Delete MOFA record for ${
          mofa.candidate?.name ??
          "this candidate"
        }?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error,
      } = await deleteMofa(
        mofa.id,
      );


      if (error) {
        throw error;
      }


      toast.success(
        "MOFA deleted.",
        "The MOFA record was deleted successfully.",
      );


      await loadMofas();

    } catch (error) {

      console.error(
        error,
      );


      toast.error(
        "Failed to delete MOFA.",
        "Please try again.",
      );

    }

  }


  /* =======================================================
   * FORM SUCCESS
   * ======================================================= */

  function handleFormSuccess() {

    setFormOpen(false);

    setEditingMofa(null);

    setSelectedCandidate(null);

    void loadMofas();

  }


  /* =======================================================
   * FORM OPEN CHANGE
   * ======================================================= */

  function handleFormOpenChange(
    open: boolean,
  ) {

    setFormOpen(open);


    if (!open) {

      setEditingMofa(null);

      setSelectedCandidate(null);

    }

  }


  /* =======================================================
   * REFRESH
   * ======================================================= */

  async function handleRefresh() {

    await Promise.all([
      loadMofas(),
      loadCandidates(),
    ]);

  }


  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <div
      className="
        flex
        min-h-0
        flex-col
        gap-6
      "
    >

      {/* =================================================
       * TOOLBAR
       * ================================================= */}

      <MofaToolbar

        search={
          search
        }

        searchPlaceholder="
          Search candidate, passport or application...
        "

        onSearchChange={
          setSearch
        }

        onRefresh={
          handleRefresh
        }

        onCreate={
          handleCreate
        }

        refreshing={
          loading ||
          candidatesLoading
        }

        filter={
          filter
        }

        onFilterChange={
          setFilter
        }

        sort={
          sort
        }

        onSortChange={
          setSort
        }

        viewMode={
          viewMode
        }

        onViewModeChange={
          setViewMode
        }

      />


      {/* =================================================
       * TABLE
       * ================================================= */}

      <MofaTable

        mofas={
          filteredMofas
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

      />


      {/* =================================================
       * FORM
       * ================================================= */}

      <MofaForm

        open={
          formOpen
        }

        mofa={
          editingMofa
        }

        selectedCandidate={
          selectedCandidate
        }

        candidates={
          candidates
        }

        onOpenChange={
          handleFormOpenChange
        }

        onSuccess={
          handleFormSuccess
        }

      />

    </div>
  );
}