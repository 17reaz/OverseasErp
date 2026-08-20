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
    status,
    setStatus,
  ] = useState<
    MedicalStatus | "all"
  >("all");


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
            "Failed to load pending candidates.",
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


  useEffect(() => {

    loadAll();

  }, [
    loadAll,
  ]);


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
            medical.status ===
              status;

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


  return (
    <div className="space-y-6">

      <MedicalToolbar
        search={search}
        status={status}
        loading={loading}
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