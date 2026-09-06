import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { BmetForm } from "./components/bmet-form";
import { BmetTable } from "./components/bmet-table";
import { BmetToolbar } from "./components/bmet-toolbar";

import {
  deleteBmetRecord,
  getBmetRecords,
  type BmetRecord,
} from "./bmet-service";

import { getCandidates } from "../candidates/candidate-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

type BmetFilter = "all" | "pending" | "complete";

function getBmetStatus(record: BmetRecord): BmetFilter {
  return (
    record.pdo &&
    record.finger &&
    record.nominee &&
    record.bank &&
    record.bmet
  )
    ? "complete"
    : "pending";
}

export function BmetPage() {
  const [records, setRecords] = useState<BmetRecord[]>([]);
  const [candidates, setCandidates] = useState<
    CandidateOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<BmetFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<BmetRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [bmetRecords, candidatesData] =
        await Promise.all([
          getBmetRecords(),
          getCandidates(),
        ]);

      setRecords(bmetRecords);

      setCandidates(
        candidatesData.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          passport_no: candidate.passport_no,
        })),
      );
    } catch (error) {
      console.error(
        "Failed to load BMET module:",
        error,
      );
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
        candidate?.name
          .toLowerCase()
          .includes(query) ||
        candidate?.passport_no
          .toLowerCase()
          .includes(query);

      const status = getBmetStatus(record);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    records,
    candidates,
    search,
    statusFilter,
  ]);

  function handleCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEdit(record: BmetRecord) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleDelete(record: BmetRecord) {
    const candidate = candidates.find(
      (item) => item.id === record.candidate_id,
    );

    const confirmed = window.confirm(
      `Delete BMET record for ${
        candidate?.name ?? "this candidate"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBmetRecord(record.id);

      setRecords((previous) =>
        previous.filter(
          (item) => item.id !== record.id,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to delete BMET record:",
        error,
      );
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    void loadData();
  }

  function handleFormSuccess(
    savedRecord: BmetRecord,
  ) {
    setRecords((previous) => {
      const exists = previous.some(
        (item) => item.id === savedRecord.id,
      );

      if (exists) {
        return previous.map((item) =>
          item.id === savedRecord.id
            ? savedRecord
            : item,
        );
      }

      return [savedRecord, ...previous];
    });
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);

    if (!open) {
      setEditingRecord(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <BmetToolbar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        refreshing={refreshing}
      />

      <div className="min-h-0 flex-1">
        <BmetTable
          records={filteredRecords}
          candidates={candidates}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <BmetForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        record={editingRecord}
        candidates={candidates}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}