import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FingerForm } from "./components/finger-form";
import { FingerTable } from "./components/finger-table";

import {
  deleteFingerRecord,
  getFingerRecords,
} from "./finger-service";

import type {
  FingerRecord,
  FingerStatus,
} from "./finger.types";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface FingerPageProps {
  candidates: CandidateOption[];
}

type StatusFilter = "all" | FingerStatus;

export function FingerPage({
  candidates,
}: FingerPageProps) {
  const [records, setRecords] = useState<FingerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<FingerRecord | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      const data = await getFingerRecords();
      setRecords(data);
    } catch (error) {
      console.error("Failed to load finger records:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const candidate = candidates.find(
        (item) => item.id === record.candidate_id,
      );

      const matchesSearch =
        !query ||
        candidate?.name.toLowerCase().includes(query) ||
        candidate?.passport_no
          .toLowerCase()
          .includes(query) ||
        record.finger_type.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        record.remarks?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, candidates, search, statusFilter]);

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
        previous.filter((item) => item.id !== record.id),
      );
    } catch (error) {
      console.error("Failed to delete finger record:", error);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    void loadRecords();
  }

  function handleFormSuccess(savedRecord: FingerRecord) {
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

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search candidate, passport..."
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as StatusFilter)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Status
            </SelectItem>

            <SelectItem value="pending">
              Pending
            </SelectItem>

            <SelectItem value="scheduled">
              Scheduled
            </SelectItem>

            <SelectItem value="completed">
              Completed
            </SelectItem>

            <SelectItem value="failed">
              Failed
            </SelectItem>

            <SelectItem value="cancelled">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh finger records"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
        </Button>
      </div>

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
        onOpenChange={setFormOpen}
        record={editingRecord}
        candidates={candidates}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}