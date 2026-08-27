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
  ] = useState<MedicalCandidate[]>([]);


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
  ] = useState<Medical | null>(null);


  const [
    selectedCandidate,
    setSelectedCandidate,
  ] = useState<MedicalCandidate | null>(
    null,
  );


  const [
    search,
    setSearch,
  ] = useState("");


 const [filter, setFilter] = useState<MedicalFilterState>({
  view: "all", // default view = all, medicalable না
  month: "all",
});

  const [
    sort,
    setSort,
  ] = useState<MedicalSortState>(
    defaultSort,
  );


  const [
    viewMode,
    setViewMode,
  ] = useState<MedicalViewMode>(
    "list",
  );


  /*
   * =========================================================
   * LOAD MEDICALS
   * =========================================================
   */

  const loadMedicals = useCallback(
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

        console.error(error);

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
   * =========================================================
   */

  const loadPending = useCallback(
    async () => {

      try {

        setPendingLoading(true);

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

        console.error(error);

        toast.error(
          "Failed to load medicalable candidates.",
          "Please try again.",
        );

      } finally {

        setPendingLoading(false);

      }

    },
    [],
  );


  /*
   * =========================================================
   * LOAD ALL
   * =========================================================
   */

  const loadAll = useCallback(
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


  useEffect(() => {

    void loadAll();

  }, [
    loadAll,
  ]);


  /*
   * =========================================================
   * MEDICALABLE SEARCH
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
        (candidate) => {

          const name =
            candidate.name
              ?.toLowerCase() ?? "";

          const passport =
            candidate.passport_no
              ?.toLowerCase() ?? "";

          return (
            name.includes(query) ||
            passport.includes(query)
          );

        },
      );

    }, [
      pendingCandidates,
      search,
    ]);


  /*
   * =========================================================
   * MEDICAL SEARCH + FILTER + MONTH + SORT
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

            /*
             * Search
             */

            const matchesSearch =
              !query ||
              medical.candidate?.name
                ?.toLowerCase()
                .includes(query) ||
              medical.candidate?.passport_no
                ?.toLowerCase()
                .includes(query);


            /*
             * Status
             */

            const matchesStatus =
              filter.view === "all" ||
              medical.status ===
                filter.view;


            /*
             * Month
             *
             * Month is based on
             * medical_date.
             *
             * Format:
             * YYYY-MM
             */

            const matchesMonth =
              filter.month === "all" ||
              Boolean(
                medical.medical_date &&
                medical.medical_date.startsWith(
                  filter.month,
                ),
              );


            return (
              matchesSearch &&
              matchesStatus &&
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

          let first = "";
          let second = "";


          switch (
            sort.field
          ) {

            case "name":

              first =
                a.candidate?.name ?? "";

              second =
                b.candidate?.name ?? "";

              break;


            case "passport_no":

              first =
                a.candidate?.passport_no ??
                "";

              second =
                b.candidate?.passport_no ??
                "";

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

    }, [
      medicals,
      search,
      filter.view,
      filter.month,
      sort,
    ]);


  /*
   * =========================================================
   * CREATE FROM TOOLBAR
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
   * CREATE FROM MEDICALABLE
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
   * EDIT
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
   * DELETE
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

      console.error(error);

      toast.error(
        "Failed to delete medical record.",
        "Please try again.",
      );

    }

  }


  /*
   * =========================================================
   * FIT → NEXT
   *
   * Actual MOFA connection will be implemented
   * when MOFA module is ready.
   * =========================================================
   */

  function handleNext(
    medical: Medical,
  ) {

    toast.info(
      "Ready for next stage",
      `${
        medical.candidate?.name ??
        "Candidate"
      } is ready for MOFA.`,
    );

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
          loadAll
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


      {filter.view ===
        "medicalable" ? (

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

      ) : (

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

          onNext={
            handleNext
          }

        />

      )}


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