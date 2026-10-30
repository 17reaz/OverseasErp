import { useCallback, useEffect, useMemo, useState } from "react";

import { FlightForm } from "./components/flight-form";
import { FlightTable } from "./components/flight-table";
import { FlightToolbar } from "./components/flight-toolbar";
import { FlightAbleTable } from "./components/flight-able-table";

import {
  getBmetRecords,
  type BmetRecord,
} from "../bmet/bmet-service";
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
  const [bmetRecords, setBmetRecords] = useState<BmetRecord[]>([]);
  const [flightAbleMode, setFlightAbleMode] = useState(false);
  const [initialVisaId, setInitialVisaId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Flight | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [
  flightList,
  candidatesData,
  visasData,
  bmetData,
] = await Promise.all([
  getFlights(),
  getCandidates(),
  getVisas(),
  getBmetRecords(),
]);

setRecords(flightList);
setCandidates(candidatesData);
setVisas(visasData);
setBmetRecords(bmetData);

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
const flightAbleItems = useMemo(() => {
  const query = search.trim().toLowerCase();

  const candidateMap = new Map(
    candidates.map((candidate) => [
      candidate.id,
      candidate,
    ]),
  );

  return visas
    // Only issued/active visas
    .filter((visa) =>
      ["active", "delivered"].includes(
        (visa.status ?? "").trim().toLowerCase(),
      ),
    )
    .map((visa) => {
      // Find BMET record for this exact visa first.
      // Fallback for older records without visa_id.
      const bmetRecord =
        bmetRecords.find(
          (record) => record.visa_id === visa.id,
        ) ??
        bmetRecords.find(
          (record) =>
            record.candidate_id === visa.candidate_id &&
            !record.visa_id,
        ) ??
        null;

      const candidate = candidateMap.get(
        visa.candidate_id,
      );

      // Check whether this visa already has a flight.
      const hasFlight = records.some(
        (flight) =>
          flight.visa_id === visa.id ||
          (
            flight.candidate_id === visa.candidate_id &&
            !flight.visa_id
          ),
      );

      return {
        visa,
        candidate,
        bmetRecord,
        hasFlight,
      };
    })
    // Candidate must exist
    .filter(
      (item): item is typeof item & {
        candidate: Candidate;
        bmetRecord: BmetRecord;
      } =>
        Boolean(item.candidate && item.bmetRecord),
    )
    // All BMET steps must be complete
    .filter(({ bmetRecord }) =>
      Boolean(
        bmetRecord.pdo &&
        bmetRecord.finger &&
        bmetRecord.nominee &&
        bmetRecord.bank &&
        bmetRecord.bmet
      ),
    )
    // Do not show candidates who already have a flight
    .filter(({ hasFlight }) => !hasFlight)
    // Search
    .filter(({ visa, candidate }) => {
      if (!query) return true;

      return (
        candidate.name.toLowerCase().includes(query) ||
        candidate.passport_no.toLowerCase().includes(query) ||
        String(visa.sl).includes(query) ||
        (visa.visa_no ?? "").toLowerCase().includes(query)
      );
    })
    .map(({ visa, candidate }) => ({
      visa,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        passport_no: candidate.passport_no,
      },
    }));
}, [visas, bmetRecords, records, candidates, search]);
  function handleCreate() {
    setInitialVisaId(undefined);
    setEditingRecord(null);
    setFormOpen(true);
  }
function handleCreateForVisa(visaId: string) {
  setEditingRecord(null);
  setInitialVisaId(visaId);
  setFormOpen(true);
}
  function handleEdit(record: Flight) {
    setInitialVisaId(undefined);
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
  <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      <FlightToolbar
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        onCreate={handleCreate}
        refreshing={refreshing}
        flightAbleMode={flightAbleMode}
onFlightAbleToggle={() =>
  setFlightAbleMode((current) => !current)
}
      />

      <div className="min-h-0 flex-1">
        {flightAbleMode ? (
  <FlightAbleTable
    items={flightAbleItems}
    loading={loading}
    onCreate={handleCreateForVisa}
  />
) : (
  <FlightTable
    records={filteredRecords}
    candidates={candidates}
    loading={loading}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onMarkIqamaComplete={handleMarkIqamaComplete}
  />
)}
      </div>

      <FlightForm
      initialVisaId={initialVisaId}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setEditingRecord(null);
          }
          if (!open) {
  setEditingRecord(null);
  setInitialVisaId(undefined);
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