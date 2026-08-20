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
} from "./components/medical-toolbar";

import {
  deleteMedical,
  getCandidatesWithoutMedical,
  getMedicals,
  type Medical,
  type MedicalCandidate,
  type MedicalStatus,
} from "./medical-service";


export function MedicalPage() {

  const [
    medicals,
    setMedicals,
  ] = useState<Medical[]>([]);


  const [
    pendingCandidates,
    setPendingCandidates,
  ] = useState<MedicalCandidate[]>(
    [],
  );


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


  /*
   * all
   * medicalable
   * new
   * fit
   * unfit
   * expired
   */
  const [
    status,
    setStatus,
  ] = useState<
    MedicalStatus |
    "all" |
    "medicalable"
  >("medicalable");


  /*
   * =========================================================
   * LOAD MEDICALS
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

    loadAll();

  }, [
    loadAll,
  ]);


  /*
   * =========================================================
   * FILTER MEDICAL RECORDS
   * =========================================================
   */

  const filteredMedicals =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return medicals.filter(
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
            status === "all" ||
            status === "medicalable" ||
            medical.status === status;


          return (
            matchesSearch &&
            matchesStatus
          );

        },
      );

    }, [
      medicals,
      search,
      status,
    ]);


  /*
   * =========================================================
   * CREATE MEDICAL
   *
   * This means:
   *
   * + Add Medical
   *
   * Candidate is NOT locked yet.
   * User can search/select candidate.
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
   * CREATE MEDICAL FROM MEDICALABLE
   *
   * Candidate becomes locked inside the sheet.
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
   * EDIT MEDICAL
   *
   * Candidate becomes locked inside the sheet.
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


    loadAll();

  }


  /*
   * =========================================================
   * NEXT STAGE
   *
   * IMPORTANT:
   *
   * এখনো MOFA create করছি না।
   *
   * এই জায়গাটা future pipeline connection-এর জন্য।
   * =========================================================
   */

  function handleNext(
    medical: Medical,
  ) {

    toast.info(
      "Next stage",
      `${medical.candidate?.name ?? "Candidate"} is ready for the next stage.`,
    );

  }


  /*
   * =========================================================
   * ACTIVE CONTENT
   * =========================================================
   */

  function renderContent() {

    /*
     * -------------------------------------------------------
     * MEDICALABLE
     * -------------------------------------------------------
     */

    if (
      status === "medicalable"
    ) {

      return (
        <MedicalPending
          candidates={
            pendingCandidates
          }
          loading={
            pendingLoading
          }
          onAddMedical={
            handleAddMedical
          }
        />
      );

    }


    /*
     * -------------------------------------------------------
     * MEDICAL RECORDS
     *
     * All / New / Fit / Unfit / Expired
     * -------------------------------------------------------
     */

    return (
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
    );

  }


  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div
      className="
        space-y-6
      "
    >

      {/* =====================================================
          TOOLBAR
          ===================================================== */}

      <MedicalToolbar

        search={
          search
        }

        status={
          status
        }

        loading={
          loading ||
          pendingLoading
        }

        onSearchChange={
          setSearch
        }

        onStatusChange={
          setStatus
        }

        onRefresh={
          loadAll
        }

        onCreate={
          handleCreate
        }

      />


      {/* =====================================================
          ACTIVE TABLE
          ===================================================== */}

      {renderContent()}


      {/* =====================================================
          MEDICAL FORM
          ===================================================== */}

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