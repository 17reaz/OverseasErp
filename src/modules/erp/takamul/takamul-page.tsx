
import { useCallback, useEffect, useMemo, useState } from "react";

import { TradeTestForm } from "./components/takamul-form";
import { TradeTestTable } from "./components/takamul-table";
import {
  TradeTestToolbar,
  type ResultFilter,
} from "./components/takamul-toolbar";
import {
  deleteTradeTest,
  getTradeTests,
  type TradeTest,
} from "./takamul-service";

import { getCandidates } from "../candidates/candidate-service";
import { getMofas } from "../mofa/mofa-service";
import { getVisas } from "../visa/visa-service";

import {
  TakamulAbleTable,
  type TakamulAbleCandidate,
} from "./components/takamul-able-table";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

export function TradeTestPage() {
  const [viewMode, setViewMode] = useState<"all" | "takamul-able">("all");

  const [records, setRecords] = useState<TradeTest[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [takamulAbleRecords, setTakamulAbleRecords] = useState<
    TakamulAbleCandidate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TradeTest | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tradeTests, candidatesData, mofaResult, visas] =
        await Promise.all([
          getTradeTests(),
          getCandidates(),
          getMofas(),
          getVisas(),
        ]);

      if (mofaResult.error) {
        throw mofaResult.error;
      }

      // All Trade Test records
      setRecords(tradeTests);

      // Candidate options for Trade Test form and table
      const candidateOptions: CandidateOption[] = candidatesData.map((c) => ({
        id: c.id,
        name: c.name,
        passport_no: c.passport_no,
      }));

      setCandidates(candidateOptions);

      // Candidates who already have a Visa record
      const candidateVisaIds = new Set(
        visas.map((visa) => visa.candidate_id),
      );

      // Active MOFA + no Visa + candidate relation exists
      const activeMofas = (mofaResult.data ?? []).filter(
        (mofa) =>
          mofa.validity_status === "active" &&
          !candidateVisaIds.has(mofa.candidate_id) &&
          Boolean(mofa.candidate),
      );

      // Takamul-able table data
      const takamulAbleData: TakamulAbleCandidate[] = activeMofas.map(
        (mofa) => ({
          id: mofa.id,
          candidate_id: mofa.candidate_id,
          name: mofa.candidate!.name,
          passport_no: mofa.candidate!.passport_no,
          mofa_id: mofa.id,
          application_number: mofa.application_number,
          application_date: mofa.application_date,
          profession: mofa.trade,
          mofa_status: mofa.validity_status,
        }),
      );

      setTakamulAbleRecords(takamulAbleData);
    } catch (error) {
      console.error("Failed to load trade test module:", error);
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
        (c) => c.id === record.candidate_id,
      );

      const matchesSearch =
        !query ||
        candidate?.name.toLowerCase().includes(query) ||
        candidate?.passport_no.toLowerCase().includes(query) ||
        record.test_center.toLowerCase().includes(query) ||
        record.remarks?.toLowerCase().includes(query);

      const matchesResult =
        resultFilter === "all" || record.result === resultFilter;

      return matchesSearch && matchesResult;
    });
  }, [records, candidates, search, resultFilter]);

  function handleCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEdit(record: TradeTest) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleDelete(record: TradeTest) {
    const candidate = candidates.find(
      (c) => c.id === record.candidate_id,
    );

    const confirmed = window.confirm(
      `Delete Trade Test #${record.sl}${
        candidate ? ` for ${candidate.name}` : ""
      }?`,
    );

    if (!confirmed) return;

    try {
      await deleteTradeTest(record.id);

      setRecords((prev) =>
        prev.filter((item) => item.id !== record.id),
      );
    } catch (error) {
      console.error("Failed to delete trade test:", error);
    }
  }

  function handleFormSuccess(savedRecord: TradeTest) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === savedRecord.id);

      if (exists) {
        return prev.map((item) =>
          item.id === savedRecord.id ? savedRecord : item,
        );
      }

      return [savedRecord, ...prev];
    });
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      <TradeTestToolbar
        search={search}
        onSearchChange={setSearch}
        resultFilter={resultFilter}
        onResultFilterChange={setResultFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        onCreate={handleCreate}
        refreshing={refreshing}
      />

      <div className="min-h-0 flex-1">
        {viewMode === "all" ? (
          <TradeTestTable
            records={filteredRecords}
            candidates={candidates}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <TakamulAbleTable
            records={takamulAbleRecords}
            loading={loading}
          />
        )}
      </div>

      <TradeTestForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setEditingRecord(null);
          }
        }}
        record={editingRecord}
        candidates={candidates}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
