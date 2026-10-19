import { useCallback, useEffect, useMemo, useState } from "react";
import { VisaForm } from "./components/visa-form";
import { VisaPending } from "./components/visa-pending";
import { VisaTable } from "./components/visa-table";
import { VisaGrid } from "./components/visa-grid";
import { BmetForm } from "../bmet/components/bmet-form";

import {
  getActiveCandidateFile,
  getActiveCandidateFiles,
  getCandidateVisaFileUrl,
  uploadCandidateVisa,
} from "../candidates/candidate-files-service";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getBmetRecords,
  updateBmetRecord,
  type BmetRecord,
} from "../bmet/bmet-service";
import { Button } from "@/components/ui/button";
import {
  VisaToolbar,
  type VisaDisplayView,
  type VisaFilterView,
} from "./components/visa-toolbar";
import {
  deleteVisa,
  getApprovedMofasWithoutVisa,
  getVisas,
  updateVisa,
  type Visa,
  type VisaEligibleMofa,
} from "./visa-service";
import { getCandidates } from "../candidates/candidate-service";
import {
  getMofas,
  getMofaAgencies,
  type Mofa,
  type MofaAgency,
} from "../mofa/mofa-service";
import { FlightForm } from "../flight/components/flight-form";
import {
  getFlights,
  type Flight,
} from "../flight/flight-service";
export function VisaPage() {
  const [records, setRecords] = useState<Visa[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<MofaAgency[]>([]);
  const [mofas, setMofas] = useState<Mofa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Visa | null>(null);
  const [displayView, setDisplayView] =
    useState<VisaDisplayView>("list");
  const [visaCopyCandidateIds, setVisaCopyCandidateIds] =
    useState<Set<string>>(() => new Set());
  const [bmetRecords, setBmetRecords] = useState<BmetRecord[]>([]);
const [previewVisa, setPreviewVisa] = useState<Visa | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewError, setPreviewError] = useState("");
  const [view, setView] = useState<VisaFilterView>("all");
  const [pendingMofas, setPendingMofas] =
    useState<VisaEligibleMofa[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [prefill, setPrefill] = useState<{
    candidate_id: string;
    mofa_id: string;
  } | null>(null);
  const [manpowerVisa, setManpowerVisa] =
  useState<Visa | null>(null);
const [flightFormOpen, setFlightFormOpen] = useState(false);
const [flightVisa, setFlightVisa] = useState<Visa | null>(null);
const [flights, setFlights] = useState<Flight[]>([]);
const [bmetFormOpen, setBmetFormOpen] =
  useState(false);
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

     const [
  visaList,
  candidatesData,
  mofaResult,
  agencyResult,
  bmetData,
  activeVisaFiles,
  flightsData,
] = await Promise.all([
  getVisas(),
  getCandidates(),
  getMofas(),
  getMofaAgencies(),
  getBmetRecords(),
  getActiveCandidateFiles("visa"),
  getFlights(),
]);

      setRecords(visaList);
      setCandidates(candidatesData);
      setMofas(mofaResult.data ?? []);
      setAgencies(agencyResult.data ?? []);
      setBmetRecords(bmetData);
      setFlights(flightsData);
      setVisaCopyCandidateIds(
        new Set(activeVisaFiles.map((file) => file.candidate_id)),
      );
    } catch (error) {
      console.error("Failed to load visa data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  function handleCreateFlight(record: Visa) {
  const existingFlight = flights.find(
    (flight) =>
      flight.visa_id === record.id &&
      flight.status !== "cancelled",
  );

  if (existingFlight) {
    window.alert("A flight already exists for this Visa.");
    return;
  }

  setFlightVisa(record);
  setFlightFormOpen(true);
}
async function handleConnectManpower(
  record: BmetRecord,
) {
  if (!manpowerVisa) return;

  try {
    // Ensure the existing manpower belongs to this candidate
    // and is not already linked to another visa.
    if (
      record.candidate_id !== manpowerVisa.candidate_id ||
      record.visa_id
    ) {
      throw new Error(
        "This manpower record cannot be connected to this Visa.",
      );
    }

    // Prevent linking a second manpower record to this Visa.
    const alreadyLinked = bmetRecords.some(
      (item) =>
        item.visa_id === manpowerVisa.id &&
        item.id !== record.id,
    );

    if (alreadyLinked) {
      throw new Error(
        "This Visa already has a manpower record.",
      );
    }

    const updated = await updateBmetRecord(record.id, {
      visa_id: manpowerVisa.id,
    });

    setBmetRecords((previous) =>
      previous.map((item) =>
        item.id === updated.id
          ? { ...item, ...updated }
          : item,
      ),
    );

    setManpowerVisa(null);

    window.alert(
      "Manpower connected to Visa successfully.",
    );
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Failed to connect manpower.",
    );
  }
}

function handleManpowerFormSuccess(
  savedRecord: BmetRecord,
) {
  setBmetRecords((previous) => {
    const exists = previous.some(
      (item) => item.id === savedRecord.id,
    );

    return exists
      ? previous.map((item) =>
          item.id === savedRecord.id
            ? { ...item, ...savedRecord }
            : item,
        )
      : [savedRecord, ...previous];
  });

  setBmetFormOpen(false);
  setManpowerVisa(null);
}
  const loadPending = useCallback(async () => {
    try {
      setPendingLoading(true);

      const { data, error } = await getApprovedMofasWithoutVisa();

      if (error) {
        throw error;
      }

      setPendingMofas(data ?? []);
    } catch (error) {
      console.error("Failed to load visaable candidates:", error);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([loadData(), loadPending()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, loadPending]);

  useEffect(() => {
    void loadData();
    void loadPending();
  }, [loadData, loadPending]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const candidate = candidates.find(
        (item) => item.id === record.candidate_id,
      );

      const name = candidate?.name?.toLowerCase() ?? "";
      const passport = candidate?.passport_no?.toLowerCase() ?? "";
      const visaNo = record.visa_no?.toLowerCase() ?? "";
      const visaType = record.visa_type?.toLowerCase() ?? "";

      return (
        !query ||
        name.includes(query) ||
        passport.includes(query) ||
        visaNo.includes(query) ||
        visaType.includes(query)
      );
    });
  }, [records, candidates, search]);

  const filteredPendingMofas = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return pendingMofas;
    }

    return pendingMofas.filter((item) => {
      const name = item.candidate.name?.toLowerCase() ?? "";
      const passport = item.candidate.passport_no?.toLowerCase() ?? "";
      const applicationNumber =
        item.application_number?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        passport.includes(query) ||
        applicationNumber.includes(query)
      );
    });
  }, [pendingMofas, search]);

  function handleCreate() {
    setEditingRecord(null);
    setPrefill(null);
    setFormOpen(true);
  }

  function handleAddVisa(item: VisaEligibleMofa) {
    setEditingRecord(null);
    setPrefill({
      candidate_id: item.candidate_id,
      mofa_id: item.id,
    });
    setFormOpen(true);
  }

  function handleEdit(record: Visa) {
    setEditingRecord(record);
    setPrefill(null);
    setFormOpen(true);
  }

  async function handleDelete(record: Visa) {
    const candidate = candidates.find(
      (item) => item.id === record.candidate_id,
    );

    const confirmed = window.confirm(
      `Delete Visa #${record.visa_no}${
        candidate ? ` for ${candidate.name}` : ""
      }?`,
    );

    if (!confirmed) return;

    try {
      await deleteVisa(record.id);

      setRecords((previous) =>
        previous.filter((item) => item.id !== record.id),
      );

      void loadPending();
    } catch (error) {
      console.error("Failed to delete visa:", error);
    }
  }
  async function handleStatusChange(
  record: Visa,
  status: string,
) {
  if (record.status === status) return;

  try {
    const updatedRecord = await updateVisa(
      record.id,
      { status },
    );

    setRecords((previous) =>
      previous.map((item) =>
        item.id === updatedRecord.id
          ? { ...item, ...updatedRecord }
          : item,
      ),
    );
  } catch (error) {
    console.error("Failed to update visa status:", error);

    window.alert(
      error instanceof Error
        ? error.message
        : "Failed to update Visa status.",
    );
  }
}

  async function handleUploadVisaCopy(record: Visa, file: File) {
    const candidate = candidates.find(
      (item) => item.id === record.candidate_id,
    );

    if (!candidate) {
      throw new Error("Candidate information was not found.");
    }

    if (!candidate.tenant_id || !candidate.sl) {
      throw new Error("Candidate tenant ID or SL is missing.");
    }

    await uploadCandidateVisa({
      tenantId: candidate.tenant_id,
      candidateId: candidate.id,
      candidateSl: candidate.sl,
      candidateName: candidate.name,
      passportNo: candidate.passport_no,
      file,
    });

    setVisaCopyCandidateIds((previous) => {
      const next = new Set(previous);
      next.add(candidate.id);
      return next;
    });

    window.alert("Visa copy uploaded successfully.");
  }

  async function getVisaCopyUrl(record: Visa) {
    const fileRecord = await getActiveCandidateFile(
      record.candidate_id,
      "visa",
    );

    if (!fileRecord) {
      throw new Error(
        "No Visa copy uploaded for this candidate yet.",
      );
    }

    return getCandidateVisaFileUrl(fileRecord.file_location);
  }

  async function handleViewVisaCopy(record: Visa) {
    const url = await getVisaCopyUrl(record);
    window.open(url, "_blank", "noopener,noreferrer");
  }
async function handlePreviewVisaCopy(record: Visa) {
  setPreviewVisa(record);
  setPreviewUrl(null);
  setPreviewError("");
  setPreviewLoading(true);

  try {
    const url = await getVisaCopyUrl(record);
    setPreviewUrl(url);
  } catch (error) {
    setPreviewError(
      error instanceof Error
        ? error.message
        : "Could not load this Visa copy.",
    );
  } finally {
    setPreviewLoading(false);
  }
}
  async function handleDownloadVisaCopy(record: Visa) {
    const url = await getVisaCopyUrl(record);

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `visa-${record.visa_no || record.sl}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleFormSuccess(savedRecord: Visa) {
    setRecords((previous) => {
      const exists = previous.some(
        (item) => item.id === savedRecord.id,
      );

      if (exists) {
        return previous.map((item) =>
          item.id === savedRecord.id ? savedRecord : item,
        );
      }

      return [savedRecord, ...previous];
    });

    void loadPending();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <VisaToolbar
        search={search}
        onSearchChange={setSearch}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        refreshing={refreshing}
        view={view}
        onViewChange={setView}
        displayView={displayView}
        onDisplayViewChange={setDisplayView}
      />
        <Dialog
  open={Boolean(manpowerVisa) && !bmetFormOpen}
  onOpenChange={(open) => {
    if (!open) setManpowerVisa(null);
  }}
>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Manpower for Visa</DialogTitle>

      <DialogDescription>
        Select an existing manpower record or create a new one.
      </DialogDescription>
    </DialogHeader>

    {manpowerVisa && (() => {
      const linkedRecord = bmetRecords.find(
        (item) => item.visa_id === manpowerVisa.id,
      );

      const existingRecords = bmetRecords.filter(
        (item) =>
          item.candidate_id === manpowerVisa.candidate_id &&
          !item.visa_id,
      );

      if (linkedRecord) {
        return (
          <p className="rounded-lg border p-4 text-sm">
            Manpower already connected —{" "}
            {linkedRecord.bmet ? "Complete" : "Pending"}
          </p>
        );
      }

      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Existing manpower records
          </p>

          {existingRecords.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No unlinked manpower record found for this candidate.
            </p>
          ) : (
            existingRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {record.bmet ? "BMET Complete" : "BMET Pending"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {record.pdo ? "PDO ✓" : "PDO —"} ·{" "}
                    {record.finger ? "Finger ✓" : "Finger —"} ·{" "}
                    {record.nominee ? "Nominee ✓" : "Nominee —"} ·{" "}
                    {record.bank ? "Bank ✓" : "Bank —"}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void handleConnectManpower(record)
                  }
                >
                  Connect
                </Button>
              </div>
            ))
          )}

          <div className="border-t pt-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => setBmetFormOpen(true)}
            >
              Create New Manpower
            </Button>
          </div>
        </div>
      );
    })()}
  </DialogContent>
</Dialog>

<BmetForm
  open={bmetFormOpen}
  onOpenChange={(open) => {
    setBmetFormOpen(open);

    if (!open) {
      setManpowerVisa(null);
    }
  }}
  candidates={candidates}
  initialCandidateId={manpowerVisa?.candidate_id}
  initialVisaId={manpowerVisa?.id}
  onSuccess={handleManpowerFormSuccess}
/>
      <div className="min-h-0 flex-1">
        {view === "visaable" ? (
          <VisaPending
            items={filteredPendingMofas}
            loading={pendingLoading}
            onAddVisa={handleAddVisa}
          />
        ) : displayView === "grid" ? (
          <VisaGrid
            records={filteredRecords}
            candidates={candidates}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <VisaTable
            records={filteredRecords}
            candidates={candidates}
            agencies={agencies}
            loading={loading}
            onPreviewCopy={handlePreviewVisaCopy}
            bmetRecords={bmetRecords}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onUploadCopy={handleUploadVisaCopy}
            onOpenCopy={handleViewVisaCopy}
            onCreateFlight={handleCreateFlight}
            onDownloadCopy={handleDownloadVisaCopy}
            onManageManpower={(record) =>
  setManpowerVisa(record)
}
            visaCopyCandidateIds={visaCopyCandidateIds}
          />
        )}
      </div>
<Dialog
  open={Boolean(previewVisa)}
  onOpenChange={(open) => {
    if (!open) {
      setPreviewVisa(null);
      setPreviewUrl(null);
      setPreviewError("");
      setPreviewLoading(false);
    }
  }}
>
  <DialogContent className="flex h-[85vh] w-[calc(100%-2rem)] max-w-5xl flex-col gap-4">
    <DialogHeader>
      <DialogTitle>
        Visa Copy
        {previewVisa?.visa_no
          ? ` — ${previewVisa.visa_no}`
          : ""}
      </DialogTitle>
      <DialogDescription>
        Uploaded Visa document preview
      </DialogDescription>
    </DialogHeader>

    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-muted/20">
      {previewLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading Visa copy…
        </div>
      ) : previewError ? (
        <p className="px-6 text-center text-sm text-destructive">
          {previewError}
        </p>
      ) : previewUrl ? (
        <iframe
          key={previewUrl}
          src={previewUrl}
          title={`Visa copy ${previewVisa?.visa_no ?? ""}`}
          className="h-full w-full border-0 bg-background"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No Visa document to preview.
        </p>
      )}
    </div>
  </DialogContent>
</Dialog>
      <VisaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setEditingRecord(null);
            setPrefill(null);
          }
        }}
        record={editingRecord}
        candidates={candidates}
        agencies={agencies}
        mofas={mofas}
        prefill={prefill}
        onSuccess={handleFormSuccess}
      />
            <FlightForm
        open={flightFormOpen}
        onOpenChange={(open) => {
          setFlightFormOpen(open);

          if (!open) {
            setFlightVisa(null);
          }
        }}
        candidates={candidates}
        visas={records}
        initialVisaId={flightVisa?.id}
        onSuccess={(savedRecord) => {
          setFlights((previous) => {
            const exists = previous.some(
              (flight) => flight.id === savedRecord.id,
            );

            return exists
              ? previous.map((flight) =>
                  flight.id === savedRecord.id
                    ? savedRecord
                    : flight,
                )
              : [savedRecord, ...previous];
          });

          setFlightFormOpen(false);
          setFlightVisa(null);
        }}
      />
    </div>
  );
}
