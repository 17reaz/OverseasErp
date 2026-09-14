import { useCallback, useEffect, useMemo, useState } from "react";
import { VisaForm } from "./components/visa-form";
import { VisaPending } from "./components/visa-pending";
import { VisaTable } from "./components/visa-table";
import { VisaToolbar, type VisaFilterView } from "./components/visa-toolbar";
import {
  deleteVisa,
  getApprovedMofasWithoutVisa,
  getVisas,
  type Visa,
  type VisaEligibleMofa,
} from "./visa-service";
import { getCandidates } from "../candidates/candidate-service";
import { getMofas, type Mofa } from "../mofa/mofa-service";
export function VisaPage() {
  const [records, setRecords] = useState<Visa[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [agencies] = useState<any[]>([]); // setAgencies বাদ দেওয়া হয়েছে
const [mofas, setMofas] = useState<Mofa[]>([]);  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Visa | null>(null);

  /* =======================================================
   * VISAABLE — approved MOFA + finger completed +
   * police clearance verified, no visa yet
   * ======================================================= */

  const [view, setView] = useState<VisaFilterView>("all");

  const [pendingMofas, setPendingMofas] = useState<VisaEligibleMofa[]>([]);

  const [pendingLoading, setPendingLoading] = useState(false);

  const [prefill, setPrefill] = useState<{
    candidate_id: string;
    mofa_id: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [visaList, candidatesData, mofaResult] =
  await Promise.all([
    getVisas(),
    getCandidates(),
    getMofas(),
  ]);

setRecords(visaList);
setCandidates(candidatesData);
setMofas(mofaResult.data ?? []);
    } catch (error) {
      console.error("Failed to load visa module:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      setPendingLoading(true);

      const { data, error } = await getApprovedMofasWithoutVisa();

      if (error) {
        throw error;
      }

      setPendingMofas(data ?? []);
    } catch (error) {
      console.error("Failed to load visaable candidates:", error);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadPending();
  }, [loadData, loadPending]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const candidate = candidates.find((c) => c.id === record.candidate_id);

      return (
        !query ||
        candidate?.name.toLowerCase().includes(query) ||
        candidate?.passport_no.toLowerCase().includes(query) ||
        record.visa_no.toLowerCase().includes(query) ||
        record.visa_type.toLowerCase().includes(query)
      );
    });
  }, [records, candidates, search]);

  const filteredPendingMofas = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return pendingMofas;
    }

    return pendingMofas.filter((item) => {
      const name = item.candidate.name?.toLowerCase() ?? "";
      const passport = item.candidate.passport_no?.toLowerCase() ?? "";
      const applicationNumber =
        item.application_number?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        passport.includes(query) ||
        applicationNumber.includes(query)
      );
    });
  }, [pendingMofas, search]);

  function handleCreate() {
    setEditingRecord(null);
    setPrefill(null);
    setFormOpen(true);
  }

  function handleAddVisa(item: VisaEligibleMofa) {
    setEditingRecord(null);
    setPrefill({
      candidate_id: item.candidate_id,
      mofa_id: item.id,
    });
    setFormOpen(true);
  }

  function handleEdit(record: Visa) {
    setEditingRecord(record);
    setPrefill(null);
    setFormOpen(true);
  }

  async function handleDelete(record: Visa) {
    const candidate = candidates.find((c) => c.id === record.candidate_id);
    const confirmed = window.confirm(
      `Delete Visa #${record.visa_no}${candidate ? ` for ${candidate.name}` : ""}?`,
    );

    if (!confirmed) return;

    try {
      await deleteVisa(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
      void loadPending();
    } catch (error) {
      console.error("Failed to delete visa:", error);
    }
  }

  function handleFormSuccess(savedRecord: Visa) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === savedRecord.id);
      if (exists) {
        return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item));
      }
      return [savedRecord, ...prev];
    });

    void loadPending();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      

      <VisaToolbar
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
          void loadPending();
        }}
        onCreate={handleCreate}
        refreshing={refreshing || pendingLoading}
        view={view}
        onViewChange={setView}
      />

      <div className="min-h-0 flex-1">
        {view === "visaable" ? (
          <VisaPending
            items={filteredPendingMofas}
            loading={pendingLoading}
            onAddVisa={handleAddVisa}
          />
        ) : (
          <VisaTable
            records={filteredRecords}
            candidates={candidates}
            agencies={agencies}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <VisaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingRecord(null);
            setPrefill(null);
          }
        }}
        record={editingRecord}
        candidates={candidates}
        agencies={agencies}
         mofas={mofas}
        prefill={prefill}

        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
