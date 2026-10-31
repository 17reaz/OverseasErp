import { useCallback, useEffect, useMemo, useState } from "react";
import { PoliceClearanceForm } from "./components/police-clearance-form";
import { PoliceClearanceTable } from "./components/police-clearance-table";
import { PoliceClearanceAbleTable } from "./components/police-clearance-able-table";
import { PoliceClearanceToolbar, type PoliceClearanceView } from "./components/police-clearance-toolbar";
import { deletePoliceClearance, getPoliceClearances, type PoliceClearance } from "./police-clearance-service";
import { getCandidates } from "../candidates/candidate-service";
import { getMedicalPipelineItems } from "../medical/medical-service";

interface CandidateOption { id: string; name: string; passport_no: string; }
export interface PoliceClearanceAbleCandidate {
  candidate_id: string;
  sl: number | null;
  name: string;
  passport_no: string;
  fit_date: string | null;
}
type VerificationFilter = "all" | "verified" | "unverified";

export function PoliceClearancePage() {
  const [records, setRecords] = useState<PoliceClearance[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [pcAbleCandidates, setPcAbleCandidates] = useState<PoliceClearanceAbleCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<PoliceClearanceView>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PoliceClearance | null>(null);
  const [initialCandidateId, setInitialCandidateId] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    try {
      const [policeClearances, candidatesData, medicalPipeline] = await Promise.all([
        getPoliceClearances(), getCandidates(), getMedicalPipelineItems(),
      ]);
      if (medicalPipeline.error) throw medicalPipeline.error;

      setRecords(policeClearances);
      setCandidates(candidatesData.map((candidate) => ({
        id: candidate.id, name: candidate.name, passport_no: candidate.passport_no,
      })));

      const existingPcIds = new Set(policeClearances.map((record) => record.candidate_id));
      const eligible = new Map<string, PoliceClearanceAbleCandidate>();
      for (const item of medicalPipeline.data ?? []) {
        const candidate = item.candidate;
        if (existingPcIds.has(candidate.id) || eligible.has(candidate.id)) continue;
        eligible.set(candidate.id, {
          candidate_id: candidate.id, sl: candidate.sl, name: candidate.name,
          passport_no: candidate.passport_no, fit_date: item.medical.fit_date,
        });
      }
      setPcAbleCandidates([...eligible.values()]);
    } catch (error) {
      console.error("Failed to load police clearance module:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const candidate = candidates.find((item) => item.id === record.candidate_id);
      const matchesSearch = !query || candidate?.name.toLowerCase().includes(query) ||
        candidate?.passport_no.toLowerCase().includes(query) || record.remarks?.toLowerCase().includes(query);
      const matchesVerification = verificationFilter === "all" ||
        (verificationFilter === "verified" && record.verified) ||
        (verificationFilter === "unverified" && !record.verified);
      return matchesSearch && matchesVerification;
    });
  }, [records, candidates, search, verificationFilter]);

  const filteredPcAbleCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pcAbleCandidates.filter((candidate) => !query ||
      candidate.name.toLowerCase().includes(query) ||
      candidate.passport_no.toLowerCase().includes(query));
  }, [pcAbleCandidates, search]);

  function handleCreate(candidateId?: string) {
    setInitialCandidateId(candidateId);
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEdit(record: PoliceClearance) {
    setInitialCandidateId(undefined);
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleDelete(record: PoliceClearance) {
    const candidate = candidates.find((item) => item.id === record.candidate_id);
    const label = candidate ? " for " + candidate.name : "";
    if (!window.confirm("Delete PCC #" + record.sl + label + "?")) return;
    try {
      await deletePoliceClearance(record.id);
      setRecords((previous) => previous.filter((item) => item.id !== record.id));
      void loadData();
    } catch (error) {
      console.error("Failed to delete police clearance:", error);
    }
  }

  function handleRefresh() { setRefreshing(true); void loadData(); }

  function handleFormSuccess(savedRecord: PoliceClearance) {
    setRecords((previous) => {
      const exists = previous.some((item) => item.id === savedRecord.id);
      return exists ? previous.map((item) => item.id === savedRecord.id ? savedRecord : item) : [savedRecord, ...previous];
    });
    void loadData();
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) { setEditingRecord(null); setInitialCandidateId(undefined); }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      <PoliceClearanceToolbar
        search={search} onSearchChange={setSearch}
        view={view} onViewChange={setView} pcAbleCount={pcAbleCandidates.length}
        verificationFilter={verificationFilter}
        onVerificationFilterChange={setVerificationFilter}
        onRefresh={handleRefresh} onCreate={() => handleCreate()} refreshing={refreshing}
      />
      <div className="min-h-0 flex-1">
        {view === "all" ? (
          <PoliceClearanceTable records={filteredRecords} candidates={candidates}
            loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
        ) : (
          <PoliceClearanceAbleTable candidates={filteredPcAbleCandidates}
            loading={loading} onCreate={(candidateId) => handleCreate(candidateId)} />
        )}
      </div>
      <PoliceClearanceForm open={formOpen} onOpenChange={handleFormOpenChange}
        record={editingRecord} candidates={candidates}
        initialCandidateId={initialCandidateId} onSuccess={handleFormSuccess} />
    </div>
  );
}
