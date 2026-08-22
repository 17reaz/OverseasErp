import { useCallback, useEffect, useMemo, useState } from "react";

import { FingerForm } from "./components/finger-form";
import { FingerTable } from "./components/finger-table";
import { FingerToolbar } from "./components/finger-toolbar";

import {
  deleteFingerRecord,
  getFingerRecords,
  type FingerRecord,
  type FingerStatus,
} from "./finger-service";

import { getCandidates } from "../candidates/candidate-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

type StatusFilter = "all" | FingerStatus;

export function FingerPage() {
  const [records, setRecords] = useState<FingerRecord[]>([]);
  const [candidates, setCandidates] = useState<
    CandidateOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<FingerRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fingerRecords, candidateRecords] =
        await Promise.all([
          getFingerRecords(),
          getCandidates(),
        ]);

      setRecords(fingerRecords);

      setCandidates(
        candidateRecords.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          passport_no: candidate.passport_no,
        })),
      );
    } catch (error) {
      console.error(
        "Failed to load finger module:",
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
          .includes(query) ||
        record.finger_type
          .toLowerCase()
          .includes(query) ||
        record.status
          .toLowerCase()
          .includes(query) ||
        record.remarks
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

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

  function handleEdit(record: FingerRecord) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleDelete(record: FingerRecord) {
    const confirmed = window.confirm(
      `Delete finger record #${record.sl}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteFingerRecord(record.id);

      setRecords((previous) =>
        previous.filter(
          (item) => item.id !== record.id,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to delete finger record:",
        error,
      );
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    void loadData();
  }

  function handleFormSuccess(
    savedRecord: FingerRecord,
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
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            Finger
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage candidate fingerprint records.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <FingerToolbar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        refreshing={refreshing}
      />

      {/* Table */}
      <div className="min-h-0 flex-1">
        <FingerTable
          records={filteredRecords}
          candidates={candidates}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Form */}
      <FingerForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        record={editingRecord}
        candidates={candidates}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}