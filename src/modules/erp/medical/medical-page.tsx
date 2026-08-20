import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  getMedicals,
  deleteMedical,
  type Medical,
} from "./medical-service";

import {
  MedicalTable,
} from "./components/medical-table";

import {
  MedicalFormDialog,
} from "./components/medical-form-dialog";

export function MedicalPage() {
  const [
    medicals,
    setMedicals,
  ] = useState<Medical[]>([]);

  const [
    loading,
    setLoading,
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


  // =====================================================
  // LOAD
  // =====================================================

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
            console.error(
              error,
            );

            toast.error(
              "Failed to load medical records.",
              "Please try again.",
            );

            return;
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


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadMedicals();
  }, [
    loadMedicals,
  ]);


  // =====================================================
  // CREATE
  // =====================================================

  function handleCreate() {
    setEditingMedical(
      null,
    );

    setFormOpen(true);
  }


  // =====================================================
  // EDIT
  // =====================================================

  function handleEdit(
    medical: Medical,
  ) {
    setEditingMedical(
      medical,
    );

    setFormOpen(true);
  }


  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(
    medical: Medical,
  ) {
    const confirmed =
      window.confirm(
        `Delete medical record for ${medical.candidate?.name ?? "this candidate"}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } = await deleteMedical(
        medical.id,
      );

      if (error) {
        console.error(
          error,
        );

        toast.error(
          "Failed to delete medical record.",
          "Please try again.",
        );

        return;
      }

      setMedicals(
        (current) =>
          current.filter(
            (item) =>
              item.id !== medical.id,
          ),
      );

      toast.success(
        "Medical record deleted.",
        "The medical record was removed successfully.",
      );
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


  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Medical
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage candidate medical records.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="icon"
            onClick={
              loadMedicals
            }
            disabled={
              loading
            }
          >
            <RefreshCw />
          </Button>

          <Button
            onClick={
              handleCreate
            }
          >
            <Plus />
            Add Medical
          </Button>

        </div>

      </div>


      {/* =================================================
          TABLE
          ================================================= */}

      <MedicalTable
        medicals={
          medicals
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
          FORM
          ================================================= */}

      <MedicalFormDialog
        open={
          formOpen
        }

        onOpenChange={
          setFormOpen
        }

        medical={
          editingMedical
        }

        onSuccess={
          async () => {
            setFormOpen(
              false,
            );

            await loadMedicals();
          }
        }
      />

    </div>
  );
}