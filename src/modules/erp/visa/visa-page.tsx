import { useCallback, useEffect, useMemo, useState } from "react";
import { VisaForm } from "./components/visa-form";
import { VisaTable } from "./components/visa-table";
import { VisaToolbar } from "./components/visa-toolbar";
import { deleteVisa, getVisas, type Visa } from "./visa-service";
import { getCandidates } from "../candidates/candidate-service";

export function VisaPage() {
  const [records, setRecords] = useState<Visa[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [agencies] = useState<any[]>([]); // setAgencies বাদ দেওয়া হয়েছে
  const [mofas] = useState<any[]>([]); // setMofas বাদ দেওয়া হয়েছে
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Visa | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [visaList, candidateResult] = await Promise.all([
        getVisas(),
        getCandidates(),
      ]);

      if (candidateResult.error) throw candidateResult.error;

      setRecords(visaList);
      setCandidates(candidateResult.data ?? []);
    } catch (error) {
      console.error("Failed to load visa module:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  function handleCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEdit(record: Visa) {
    setEditingRecord(record);
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
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Visas</h1>
          <p className="px-0 text-sm text-muted-foreground">
            Manage candidate visa processing and issuance details.
          </p>
        </div>
      </div>

      <VisaToolbar
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        onCreate={handleCreate}
        refreshing={refreshing}
      />

      <div className="min-h-0 flex-1">
        <VisaTable
          records={filteredRecords}
          candidates={candidates}
          agencies={agencies}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <VisaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRecord(null);
        }}
        record={editingRecord}
        candidates={candidates}
        agencies={agencies}
        mofas={mofas}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}