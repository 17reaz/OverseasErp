import { useCallback, useEffect, useMemo, useState } from "react";

import { FingerForm } from "./components/finger-form";
import { FingerTable } from "./components/finger-table";
import { FingerToolbar } from "./components/finger-toolbar";
import { FingerAbleTable } from "./components/finger-able-table";

import {
  deleteFingerRecord,
  getFingerRecords,
  type FingerRecord,
  type FingerStatus,
} from "./finger-service";

import { getCandidates } from "../candidates/candidate-service";
import { getMofas } from "../mofa/mofa-service";
import { getVisas } from "../visa/visa-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

type StatusFilter = "all" | FingerStatus;
type ViewMode = "all" | "finger-able";

export interface FingerAbleCandidate {
  id: string;
  candidate_id: string;
  name: string;
  passport_no: string;
  candidate_sl: number | null;

  mofa_id: string;
  application_number: string | null;
  application_date: string;
  trade: string;

  finger_record: FingerRecord | null;
}

export function FingerPage() {
  const [records, setRecords] = useState<FingerRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [fingerAbleRecords, setFingerAbleRecords] = useState<
    FingerAbleCandidate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<FingerRecord | null>(null);
  const [initialCandidateId, setInitialCandidateId] =
    useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [
        fingerRecords,
        candidatesData,
        mofasResult,
        visas,
      ] = await Promise.all([
        getFingerRecords(),
        getCandidates(),
        getMofas(),
        getVisas(),
      ]);

      if (mofasResult.error) {
        throw mofasResult.error;
      }

      const currentFingerRecords = fingerRecords.filter(
        (record) => record.is_current,
      );

      setRecords(currentFingerRecords);

      const candidateOptions: CandidateOption[] =
        candidatesData.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          passport_no: candidate.passport_no,
        }));

      setCandidates(candidateOptions);

      // Candidate-wise current Finger record
      const fingerByCandidate = new Map<string, FingerRecord>();

      for (const record of currentFingerRecords) {
        if (!fingerByCandidate.has(record.candidate_id)) {
          fingerByCandidate.set(record.candidate_id, record);
        }
      }

      // Candidate IDs that already have a Visa
      const visaCandidateIds = new Set(
        visas.map((visa) => visa.candidate_id),
      );

      // MOFA service returns newest records first.
      // Keep only the newest active MOFA per candidate.
      const activeMofaByCandidate = new Map<
  string,
  NonNullable<typeof mofasResult.data>[number]
>();

      for (const mofa of mofasResult.data ?? []) {
        if (
          mofa.validity_status !== "active" ||
          !mofa.candidate ||
          visaCandidateIds.has(mofa.candidate_id)
        ) {
          continue;
        }

        if (!activeMofaByCandidate.has(mofa.candidate_id)) {
          activeMofaByCandidate.set(mofa.candidate_id, mofa);
        }
      }

      const ableRecords: FingerAbleCandidate[] = [];

      for (const [candidateId, mofa] of activeMofaByCandidate) {
        const candidate = mofa.candidate;

        if (!candidate) continue;

        const fingerRecord =
          fingerByCandidate.get(candidateId) ?? null;

        // Completed Finger means candidate is no longer eligible.
        if (fingerRecord?.status === "completed") {
          continue;
        }

        ableRecords.push({
          id: mofa.id,
          candidate_id: candidateId,
          name: candidate.name,
          passport_no: candidate.passport_no,
          candidate_sl: candidate.sl,

          mofa_id: mofa.id,
          application_number: mofa.application_number,
          application_date: mofa.application_date,
          trade: mofa.trade,

          finger_record: fingerRecord,
        });
      }

      setFingerAbleRecords(ableRecords);
    } catch (error) {
      console.error("Failed to load finger module:", error);
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
      const candidate = candidates.find(
        (item) => item.id === record.candidate_id,
      );

      const matchesSearch =
        !query ||
        candidate?.name.toLowerCase().includes(query) ||
        candidate?.passport_no.toLowerCase().includes(query) ||
        record.finger_type.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        record.remarks?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, candidates, search, statusFilter]);

  const filteredFingerAbleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return fingerAbleRecords;

    return fingerAbleRecords.filter((record) =>
      [
        record.name,
        record.passport_no,
        record.application_number ?? "",
        record.trade,
        record.finger_record?.status ?? "not started",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [fingerAbleRecords, search]);

  function handleCreate(candidateId?: string) {
    setEditingRecord(null);
    setInitialCandidateId(candidateId ?? null);
    setFormOpen(true);
  }

  function handleEdit(record: FingerRecord) {
    setInitialCandidateId(null);
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleDelete(record: FingerRecord) {
    const confirmed = window.confirm(
      `Delete finger record #${record.sl}?`,
    );

    if (!confirmed) return;

    try {
      await deleteFingerRecord(record.id);

      setRecords((previous) =>
        previous.filter((item) => item.id !== record.id),
      );

      // Reload Able data so deleted candidates become eligible again.
      await loadData();
    } catch (error) {
      console.error("Failed to delete finger record:", error);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    void loadData();
  }

  function handleFormSuccess(savedRecord: FingerRecord) {
    setRecords((previous) => {
      const withoutOldCandidateRecord = previous.filter(
        (item) =>
          item.id !== savedRecord.id &&
          item.candidate_id !== savedRecord.candidate_id,
      );

      return [savedRecord, ...withoutOldCandidateRecord];
    });

    // Refresh MOFA/Visa/Finger eligibility after saving.
    void loadData();
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);

    if (!open) {
      setEditingRecord(null);
      setInitialCandidateId(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      <FingerToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={handleRefresh}
        onCreate={() => handleCreate()}
        refreshing={refreshing}
      />

      <div className="min-h-0 flex-1">
        {viewMode === "all" ? (
          <FingerTable
            records={filteredRecords}
            candidates={candidates}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <FingerAbleTable
            records={filteredFingerAbleRecords}
            loading={loading}
            onCreate={handleCreate}
            onEdit={handleEdit}
          />
        )}
      </div>

      <FingerForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        record={editingRecord}
        candidates={candidates}
        initialCandidateId={initialCandidateId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}