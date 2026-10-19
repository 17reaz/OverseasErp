
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { BmetForm } from "./components/bmet-form";
import { BmetTable } from "./components/bmet-table";
import { BmetToolbar } from "./components/bmet-toolbar";
import { BmetAbleTable } from "./components/bmet-able-table";

import {
  deleteBmetRecord,
  getBmetRecords,
  type BmetRecord,
} from "./bmet-service";

import { getCandidates } from "../candidates/candidate-service";
import {
  getVisas,
  type Visa,
} from "../visa/visa-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

type BmetFilter = "all" | "pending" | "complete";

interface CreateTarget {
  candidateId: string;
  visaId: string;
}

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
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [visas, setVisas] = useState<Visa[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<BmetFilter>("all");

  const [bmetAbleMode, setBmetAbleMode] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<BmetRecord | null>(null);

  const [createTarget, setCreateTarget] =
    useState<CreateTarget | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [
        bmetRecords,
        candidatesData,
        visasData,
      ] = await Promise.all([
        getBmetRecords(),
        getCandidates(),
        getVisas(),
      ]);

      setRecords(bmetRecords);
      setVisas(visasData);

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

  // Existing BMET records with search and status filtering.
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const candidate = candidates.find(
        (item) => item.id === record.candidate_id,
      );

      const matchesSearch =
        !query ||
        (candidate?.name ?? "").toLowerCase().includes(query) ||
        (candidate?.passport_no ?? "").toLowerCase().includes(query);

      const status = getBmetStatus(record);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, candidates, search, statusFilter]);

  // A Visa is BMET-able when no BMET record is linked
  // to that exact visa_id.
  const bmetAbleVisas = useMemo(() => {
    const query = search.trim().toLowerCase();

    const linkedVisaIds = new Set(
      records
        .map((record) => record.visa_id)
        .filter((id): id is string => Boolean(id)),
    );

    const candidateMap = new Map(
      candidates.map((candidate) => [
        candidate.id,
        candidate,
      ]),
    );

    return visas
      .filter((visa) => !linkedVisaIds.has(visa.id))
      .map((visa) => ({
        visa,
        candidate: candidateMap.get(visa.candidate_id),
      }))
      .filter(
        (
          item,
        ): item is {
          visa: Visa;
          candidate: CandidateOption;
        } => Boolean(item.candidate),
      )
      .filter(({ visa, candidate }) => {
        if (!query) return true;

        return (
          candidate.name.toLowerCase().includes(query) ||
          candidate.passport_no.toLowerCase().includes(query) ||
          String(visa.sl).includes(query) ||
          (visa.visa_no ?? "").toLowerCase().includes(query)
        );
      });
  }, [visas, records, candidates, search]);

  function handleCreate() {
    setEditingRecord(null);
    setCreateTarget(null);
    setFormOpen(true);
  }

  function handleCreateForVisa(
    candidateId: string,
    visaId: string,
  ) {
    setEditingRecord(null);
    setCreateTarget({
      candidateId,
      visaId,
    });
    setFormOpen(true);
  }

  function handleEdit(record: BmetRecord) {
    setEditingRecord(record);
    setCreateTarget(null);
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

    if (!confirmed) return;

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
      setCreateTarget(null);
    }
  }

  return (
  <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      <BmetToolbar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        bmetAbleMode={bmetAbleMode}
        onBmetAbleToggle={() =>
          setBmetAbleMode((current) => !current)
        }
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        refreshing={refreshing}
      />

      <div className="min-h-0 flex-1">
        {bmetAbleMode ? (
          <BmetAbleTable
            items={bmetAbleVisas}
            loading={loading}
            onCreate={handleCreateForVisa}
          />
        ) : (
          <BmetTable
            records={filteredRecords}
            candidates={candidates}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <BmetForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        record={editingRecord}
        candidates={candidates}
        initialCandidateId={createTarget?.candidateId}
        initialVisaId={createTarget?.visaId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
