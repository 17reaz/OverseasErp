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
  MedicalForm,
} from "./components/medical-form";

import {
  MedicalNextAction,
} from "./components/medical-next-action";

import {
  MedicalPending,
} from "./components/medical-pending";

import {
  MedicalTable,
} from "./components/medical-table";

import {
  MedicalToolbar,
  type MedicalFilterState,
  type MedicalSortState,
  type MedicalViewMode,
} from "./components/medical-toolbar";

import {
  deleteMedical,
  getCandidatesWithoutMedical,
  getMedicals,
  type Medical,
  type MedicalCandidate,
} from "./medical-service";


const defaultFilter: MedicalFilterState = {
  view: "medicalable",
  month: "all",
};

const defaultSort: MedicalSortState = {
  mode: "custom",
  field: "created_at",
};


export function MedicalPage() {

  const [
    medicals,
    setMedicals,
  ] = useState<Medical[]>([]);


  const [
    pendingCandidates,
    setPendingCandidates,
  ] = useState<
    MedicalCandidate[]
  >([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    pendingLoading,
    setPendingLoading,
  ] = useState(true);


  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    editingMedical,
    setEditingMedical,
  ] = useState<Medical | null>(
    null,
  );


  const [
    selectedCandidate,
    setSelectedCandidate,
  ] =
    useState<MedicalCandidate | null>(
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
    useState<MedicalFilterState>(
      defaultFilter,
    );


  const [
    sort,
    setSort,
  ] =
    useState<MedicalSortState>(
      defaultSort,
    );


  const [
    viewMode,
    setViewMode,
  ] =
    useState<MedicalViewMode>(
      "list",
    );


  /*
   * =========================================================
   * LOAD MEDICAL RECORDS
   * =========================================================
   */

  const loadMedicals =
    useCallback(
      async () => {

        try {

          setLoading(true);

          const {
            data,
            error,
          } = await getMedicals();

          if (error) {
            throw error;
          }

          setMedicals(
            data ?? [],
          );

        } catch (error) {

          console.error(
            error,
          );

          toast.error(
            "Failed to load medical records.",
            "Please try again.",
          );

        } finally {

          setLoading(false);

        }

      },
      [],
    );


  /*
   * =========================================================
   * LOAD MEDICALABLE CANDIDATES
   *
   * These are candidates who do not have a medical record yet.
   * =========================================================
   */

  const loadPending =
    useCallback(
      async () => {

        try {

          setPendingLoading(
            true,
          );

          const {
            data,
            error,
          } =
            await getCandidatesWithoutMedical();

          if (error) {
            throw error;
          }

          setPendingCandidates(
            data ?? [],
          );

        } catch (error) {

          console.error(
            error,
          );

          toast.error(
            "Failed to load medicalable candidates.",
            "Please try again.",
          );

        } finally {

          setPendingLoading(
            false,
          );

        }

      },
      [],
    );


  /*
   * =========================================================
   * LOAD EVERYTHING
   * =========================================================
   */

  const loadAll =
    useCallback(
      async () => {

        await Promise.all([
          loadMedicals(),
          loadPending(),
        ]);

      },
      [
        loadMedicals,
        loadPending,
      ],
    );


  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {

    void loadAll();

  }, [
    loadAll,
  ]);


  /*
   * =========================================================
   * SEARCH MEDICALABLE CANDIDATES
   * =========================================================
   */

  const filteredPendingCandidates =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return pendingCandidates;
      }

      return pendingCandidates.filter(
        (candidate) =>
          candidate.name
            ?.toLowerCase()
            .includes(query) ||
          candidate.passport_no
            ?.toLowerCase()
            .includes(query),
      );

    }, [
      pendingCandidates,
      search,
    ]);


  /*
   * =========================================================
   * SEARCH + FILTER MEDICAL RECORDS
   * =========================================================
   */

  const filteredMedicals =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      let result =
        medicals.filter(
          (medical) => {

            const matchesSearch =
              !query ||
              medical.candidate?.name
                ?.toLowerCase()
                .includes(query) ||
              medical.candidate?.passport_no
                ?.toLowerCase()
                .includes(query);

            const matchesStatus =
              filter.view ===
                "all" ||
              filter.view ===
                "medicalable" ||
              medical.status ===
                filter.view;

            return (
              matchesSearch &&
              matchesStatus
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

          let first = "";
          let second = "";

          switch (
            sort.field
          ) {

            case "name":

              first =
                a.candidate
                  ?.name ?? "";

              second =
                b.candidate
                  ?.name ?? "";

              break;


            case "passport_no":

              first =
                a.candidate
                  ?.passport_no ?? "";

              second =
                b.candidate
                  ?.passport_no ?? "";

              break;


            case "medical_date":

              first =
                a.medical_date ?? "";

              second =
                b.medical_date ?? "";

              break;


            case "updated_at":

              first =
                a.updated_at ?? "";

              second =
                b.updated_at ?? "";

              break;


            case "created_at":

            default:

              first =
                a.created_at ?? "";

              second =
                b.created_at ?? "";

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
      medicals,
      search,
      filter.view,
      sort,
    ]);


  /*
   * =========================================================
   * CREATE MEDICAL FROM TOOLBAR
   *
   * Candidate will be selected inside the Universal Sheet.
   * =========================================================
   */

  function handleCreate() {

    setEditingMedical(
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
   * CREATE MEDICAL FROM MEDICALABLE TABLE
   *
   * Candidate is already selected.
   * Universal Sheet will lock the candidate.
   * =========================================================
   */

  function handleAddMedical(
    candidate: MedicalCandidate,
  ) {

    setEditingMedical(
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
   * EDIT EXISTING MEDICAL
   *
   * Candidate will be locked inside the Sheet.
   * =========================================================
   */

  function handleEdit(
    medical: Medical,
  ) {

    setEditingMedical(
      medical,
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
   * DELETE MEDICAL
   * =========================================================
   */

  async function handleDelete(
    medical: Medical,
  ) {

    const confirmed =
      window.confirm(
        `Delete medical record for ${
          medical.candidate?.name ??
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
        await deleteMedical(
          medical.id,
        );


      if (error) {
        throw error;
      }


      toast.success(
        "Medical deleted.",
        "The medical record was deleted successfully.",
      );


      await loadAll();

    } catch (error) {

      console.error(
        error,
      );

      toast.error(
        "Failed to delete medical record.",
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

    setEditingMedical(
      null,
    );

    setSelectedCandidate(
      null,
    );

    void loadAll();

  }


  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  async function handleRefresh() {

    await loadAll();

  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-6">

      <MedicalToolbar
        search={
          search
        }

        searchPlaceholder={
          "Search candidate or passport..."
        }

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
          pendingLoading
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


      {/*
       * =======================================================
       * MEDICALABLE
       *
       * Candidate has no medical record yet.
       * =======================================================
       */}

      {filter.view ===
        "medicalable" && (
        <MedicalPending
          candidates={
            filteredPendingCandidates
          }

          loading={
            pendingLoading
          }

          onAddMedical={
            handleAddMedical
          }
        />
      )}


      {/*
       * =======================================================
       * MEDICAL RECORDS
       *
       * New / Fit / Unfit / Expired / All
       * =======================================================
       */}

      {filter.view !==
        "medicalable" && (
        <MedicalTable
          medicals={
            filteredMedicals
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
      )}


      {/*
       * =======================================================
       * NEXT ACTION
       *
       * Kept separate for the Fit → next-stage flow.
       * =======================================================
       */}

      {filter.view !==
        "medicalable" && (
        <MedicalNextAction
          medicals={
            filteredMedicals
          }
        />
      )}


      {/*
       * =======================================================
       * UNIVERSAL MEDICAL SHEET
       * =======================================================
       */}

      <MedicalForm
        open={
          formOpen
        }

        medical={
          editingMedical
        }

        selectedCandidate={
          selectedCandidate
        }

        candidates={
          pendingCandidates
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