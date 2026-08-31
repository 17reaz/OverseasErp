import { useCallback, useEffect, useMemo, useState } from "react";
import { TradeTestForm } from "./components/takamul-form";
import { TradeTestTable } from "./components/takamul-table";
import { TradeTestToolbar, type ResultFilter } from "./components/takamul-toolbar";
import {
  deleteTradeTest,
  getTradeTests,
  type TradeTest,
} from "./takamul-service";
import { getCandidates } from "../candidates/candidate-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

export function TradeTestPage() {
  const [records, setRecords] = useState<TradeTest[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TradeTest | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tradeTests, candidatesData] = await Promise.all([
        getTradeTests(),
        getCandidates(),
      ]);

      setRecords(tradeTests);
      setCandidates(
        candidatesData.map((c) => ({
          id: c.id,
          name: c.name,
          passport_no: c.passport_no,
        })),
      );
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
      const candidate = candidates.find((c) => c.id === record.candidate_id);

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
    const candidate = candidates.find((c) => c.id === record.candidate_id);
    const confirmed = window.confirm(
      `Delete Trade Test #${record.sl}${candidate ? ` for ${candidate.name}` : ""}?`,
    );

    if (!confirmed) return;

    try {
      await deleteTradeTest(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
    } catch (error) {
      console.error("Failed to delete trade test:", error);
    }
  }

  function handleFormSuccess(savedRecord: TradeTest) {
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
      

      <TradeTestToolbar
        search={search}
        onSearchChange={setSearch}
        resultFilter={resultFilter}
        onResultFilterChange={setResultFilter}
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        onCreate={handleCreate}
        refreshing={refreshing}
      />

      <div className="min-h-0 flex-1">
        <TradeTestTable
          records={filteredRecords}
          candidates={candidates}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <TradeTestForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRecord(null);
        }}
        record={editingRecord}
        candidates={candidates}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}