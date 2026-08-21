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
  getMofas,
  type Mofa,
  type MofaCandidate,
  type MofaStage,
} from "./mofa-service";


const defaultFilter: MofaFilterState = {
  view: "all",
  month: "all",
};


const defaultSort: MofaSortState = {
  mode: "custom",
  field: "created_at",
};


export function MofaPage() {

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [
    mofas,
    setMofas,
  ] = useState<Mofa[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    editingMofa,
    setEditingMofa,
  ] = useState<Mofa | null>(
    null,
  );


  const [
    selectedCandidate,
    setSelectedCandidate,
  ] =
    useState<MofaCandidate | null>(
      null,
    );


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    filter,
    setFilter,
  ] =
    useState<MofaFilterState>(
      defaultFilter,
    );


  const [
    sort,
    setSort,
  ] =
    useState<MofaSortState>(
      defaultSort,
    );


  const [
    viewMode,
    setViewMode,
  ] =
    useState<MofaViewMode>(
      "list",
    );


  /*
   * =========================================================
   * LOAD MOFA
   * =========================================================
   */

  const loadMofas =
    useCallback(
      async () => {

        try {

          setLoading(
            true,
          );


          const {
            data,
            error,
          } =
            await getMofas();


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

          setLoading(
            false,
          );

        }

      },
      [],
    );


  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {

    void loadMofas();

  }, [
    loadMofas,
  ]);


  /*
   * =========================================================
   * FILTER + SEARCH
   * =========================================================
   */

  const filteredMofas =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      let result =
        mofas.filter(
          (mofa) => {

            /*
             * SEARCH
             */

            const matchesSearch =
              !query ||
              mofa.candidate?.name
                ?.toLowerCase()
                .includes(query) ||
              mofa.candidate?.passport_no
                ?.toLowerCase()
                .includes(query) ||
              mofa.application_number
                ?.toLowerCase()
                .includes(query) ||
              mofa.trade
                ?.toLowerCase()
                .includes(query);


            /*
             * STAGE
             */

            const matchesStage =
              filter.view ===
                "all" ||
              mofa.stage ===
                filter.view;


            /*
             * MONTH
             */

            let matchesMonth =
              true;


            if (
              filter.month !==
              "all"
            ) {

              const date =
                mofa.application_date;


              if (!date) {

                matchesMonth =
                  false;

              } else {

                const month =
                  new Date(
                    date,
                  ).getMonth() + 1;


                matchesMonth =
                  String(
                    month,
                  ) ===
                  filter.month;

              }

            }


            return (
              matchesSearch &&
              matchesStage &&
              matchesMonth
            );

          },
        );


      /*
       * =======================================================
       * SORT
       * =======================================================
       */

      result = [
        ...result,
      ].sort(
        (a, b) => {

          let first =
            "";

          let second =
            "";


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


            case "application_date":

              first =
                a.application_date ??
                "";

              second =
                b.application_date ??
                "";

              break;


            case "stage":

              first =
                a.stage ??
                "";

              second =
                b.stage ??
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
                sensitivity:
                  "base",
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

    }, [
      mofas,
      search,
      filter,
      sort,
    ]);


  /*
   * =========================================================
   * CREATE
   * =========================================================
   */

  function handleCreate() {

    setEditingMofa(
      null,
    );


    setSelectedCandidate(
      null,
    );


    setFormOpen(
      true,
    );

  }


  /*
   * =========================================================
   * CREATE FROM CANDIDATE
   *
   * Future use if MOFA is opened from another module.
   * =========================================================
   */

  function handleAddMofa(
    candidate: MofaCandidate,
  ) {

    setEditingMofa(
      null,
    );


    setSelectedCandidate(
      candidate,
    );


    setFormOpen(
      true,
    );

  }


  /*
   * =========================================================
   * EDIT
   * =========================================================
   */

  function handleEdit(
    mofa: Mofa,
  ) {

    setEditingMofa(
      mofa,
    );


    setSelectedCandidate(
      null,
    );


    setFormOpen(
      true,
    );

  }


  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

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
      } =
        await deleteMofa(
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


  /*
   * =========================================================
   * FORM SUCCESS
   * =========================================================
   */

  function handleFormSuccess() {

    setFormOpen(
      false,
    );


    setEditingMofa(
      null,
    );


    setSelectedCandidate(
      null,
    );


    void loadMofas();

  }


  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  async function handleRefresh() {

    await loadMofas();

  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className="
        space-y-6
      "
    >

      {/* ==================================================
          TOOLBAR
          ================================================== */}

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
          loading
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


      {/* ==================================================
          TABLE
          ================================================== */}

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

        onAddMofa={
          handleAddMofa
        }

      />


      {/* ==================================================
          MOFA SHEET
          ================================================== */}

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
          []
        }

        onOpenChange={
          setFormOpen
        }

        onSuccess={
          handleFormSuccess
        }

      />

    </div>
  );
}