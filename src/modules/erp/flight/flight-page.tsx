import { useCallback, useEffect, useMemo, useState } from "react";

import { FlightForm } from "./components/flight-form";
import { FlightTable } from "./components/flight-table";
import { FlightToolbar } from "./components/flight-toolbar";

import {
  deleteFlight,
  getFlights,
  markIqamaComplete,
  type Flight,
} from "./flight-service";

import {
  getCandidates,
  type Candidate,
} from "../candidates/candidate-service";

import {
  getVisas,
  type Visa,
} from "../visa/visa-service";

export function FlightPage() {
  const [records, setRecords] = useState<Flight[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [visas, setVisas] = useState<Visa[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Flight | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [flightList, candidatesData, visasData] = await Promise.all([
        getFlights(),
        getCandidates(),
        getVisas(),
      ]);

      setRecords(flightList);
      setCandidates(candidatesData);
      setVisas(visasData);
    } catch (error) {
      console.error("Failed to load flight module:", error);
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

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const candidate = candidates.find(
        (candidate) => candidate.id === record.candidate_id,
      );

      return (
        candidate?.name?.toLowerCase().includes(query) ||
        candidate?.passport_no?.toLowerCase().includes(query) ||
        record.flight_no?.toLowerCase().includes(query) ||
        record.airline?.toLowerCase().includes(query) ||
        record.departure_city?.toLowerCase().includes(query) ||
        record.arrival_city?.toLowerCase().includes(query)
      );
    });
  }, [records, candidates, search]);

  function handleCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEdit(record: Flight) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleDelete(record: Flight) {
    const candidate = candidates.find(
      (candidate) => candidate.id === record.candidate_id,
    );

    const confirmed = window.confirm(
      `Delete Flight #${record.flight_no ?? record.sl}${
        candidate ? ` for ${candidate.name}` : ""
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteFlight(record.id);

      setRecords((prev) =>
        prev.filter((item) => item.id !== record.id),
      );
    } catch (error) {
      console.error("Failed to delete flight:", error);
    }
  }

  async function handleMarkIqamaComplete(record: Flight) {
    if (record.status !== "departed") {
      window.alert(
        "Iqama can only be completed after the candidate has departed.",
      );
      return;
    }

    if (!record.needs_iqama) {
      window.alert("Iqama is not required for this flight.");
      return;
    }

    if (record.iqama_status === "completed") {
      return;
    }

    const candidate = candidates.find(
      (item) => item.id === record.candidate_id,
    );

    const confirmed = window.confirm(
      `Mark Iqama as completed for ${
        candidate?.name ?? "this candidate"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const updatedRecord = await markIqamaComplete(record.id);

      setRecords((prev) =>
        prev.map((item) =>
          item.id === updatedRecord.id ? updatedRecord : item,
        ),
      );
    } catch (error) {
      console.error("Failed to mark Iqama as complete:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to mark Iqama as complete.",
      );
    }
  }

  function handleFormSuccess(savedRecord: Flight) {
    setRecords((prev) => {
      const exists = prev.some(
        (item) => item.id === savedRecord.id,
      );

      if (exists) {
        return prev.map((item) =>
          item.id === savedRecord.id ? savedRecord : item,
        );
      }

      return [savedRecord, ...prev];
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <FlightToolbar
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
        <FlightTable
          records={filteredRecords}
          candidates={candidates}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkIqamaComplete={handleMarkIqamaComplete}
        />
      </div>

      <FlightForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setEditingRecord(null);
          }
        }}
        record={editingRecord}
        candidates={candidates}
        visas={visas}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}