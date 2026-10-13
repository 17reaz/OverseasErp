import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { FileUploadSheet } from "./file-upload-sheet";
import { FilesToolbar, type DocTypeFilter } from "./components/files-toolbar";
import { getAllFiles } from "./files-service";

import type { FileRecord } from "./types";

interface CandidateInfo {
  id: string;
  sl: number;
  name: string;
  passport_no: string;
}

interface FileWithCandidate extends FileRecord {
  candidate?: CandidateInfo;
}

/* ------------------------------------------------------------------ */
/* Preview helpers                                                     */
/* ------------------------------------------------------------------ */

const BUCKET = "passports"; // files-service.ts er BUCKET er shathe same

// Preview na thakle ei sample image dekhabe
const SAMPLE_PREVIEW =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f1f5f9"/>
  <rect x="115" y="30" width="170" height="240" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="135" y="55" width="60" height="60" rx="6" fill="#e2e8f0"/>
  <circle cx="165" cy="76" r="11" fill="#cbd5e1"/>
  <path d="M141 110 L158 92 L172 104 L184 94 L190 110 Z" fill="#cbd5e1"/>
  <rect x="207" y="58" width="63" height="8" rx="4" fill="#cbd5e1"/>
  <rect x="207" y="74" width="48" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="207" y="90" width="55" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="135" y="136" width="135" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="135" y="154" width="120" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="135" y="172" width="130" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="135" y="190" width="95" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="135" y="224" width="70" height="26" rx="5" fill="#e2e8f0"/>
</svg>`);

type PreviewKind = "image" | "pdf" | "other";

// file_location er extension theke type bujhi
// (upload-er somoy filename-e extension thake: ...-v1.jpg / .pdf)
function getPreviewKind(file: FileWithCandidate): PreviewKind {
  const name = (file.file_location ?? "").toLowerCase();

  if (/\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  return "other";
}

// files list theke signed URL ber kore: { [fileId]: url }
function useFilePreviews(files: FileWithCandidate[]) {
  const [urls, setUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const withPath = files.filter((file) => file.file_location);

      if (withPath.length === 0) {
        if (!cancelled) setUrls({});
        return;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          withPath.map((file) => file.file_location),
          3600,
        );

      if (error || !data) {
        console.error("createSignedUrls failed:", error);
        return;
      }

      const next: Record<number, string> = {};

      data.forEach((row, index) => {
        if (row.signedUrl && !row.error) {
          next[withPath[index].id] = row.signedUrl;
        } else {
          console.warn(
            "Signed URL missing for:",
            withPath[index].file_location,
            row.error,
          );
        }
      });

      if (!cancelled) setUrls(next);
    }

    void resolve().catch((err) => {
      console.error("Failed to load file previews:", err);
    });

    return () => {
      cancelled = true;
    };
  }, [files]);

  return urls;
}

function FileCard({
  file,
  url,
}: {
  file: FileWithCandidate;
  url?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  useEffect(() => {
    if (getPreviewKind(file) !== "pdf" || !url) return;

    let cancelled = false;

    async function loadThumbnail() {
      setThumbnailLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "file-pdf-thumbnail",
          {
            body: { fileId: file.id },
          },
        );

        if (error) {
          console.error("Thumbnail unavailable:", error.message);
          return;
        }

        if (!cancelled && data?.thumbnailUrl) {
          setThumbnailUrl(data.thumbnailUrl);
        }
      } catch (error) {
        console.error("Failed to load PDF thumbnail:", error);
      } finally {
        if (!cancelled) {
          setThumbnailLoading(false);
        }
      }
    }

    void loadThumbnail();

    return () => {
      cancelled = true;
    };
  }, [file.id, url]);

  const kind = getPreviewKind(file);
  const showReal = Boolean(url) && !failed && kind !== "other";
  const title = file.candidate?.name ?? "Unknown candidate";

  // নিচে তোমার existing return (...) থাকবে

  return (
    <div className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
  {showReal && kind === "image" ? (
    <img
      src={url}
      alt={`${file.doc_type} - ${title}`}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  ) : showReal && kind === "pdf" ? (
    thumbnailUrl ? (
      <img
        src={thumbnailUrl}
        alt={`${file.doc_type} - ${title}`}
        loading="lazy"
        className="h-full w-full object-cover object-top"
      />
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted">
        <FileText className="size-10 text-muted-foreground" />

        <span className="text-center text-xs text-muted-foreground">
          {thumbnailLoading
            ? "Preparing PDF thumbnail..."
            : "PDF thumbnail unavailable"}
        </span>
      </div>
    )
  ) : (
    <>
      <img
        src={SAMPLE_PREVIEW}
        alt="No preview available"
        className="h-full w-full object-cover"
      />

      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
        No preview
      </span>
    </>
  )}

  {/* Original file open করার link */}
  {url && (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${file.doc_type} for ${title}`}
      className="absolute inset-0"
    />
  )}

  <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium capitalize shadow-sm">
    {file.doc_type}
  </span>

  <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm">
    v{file.version}
  </span>
</div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-sm font-medium" title={title}>
          {title}
        </p>

        <p className="truncate font-mono text-xs text-muted-foreground">
          {file.candidate?.passport_no ?? "-"}
        </p>

        <div className="flex items-center justify-between pt-1 text-xs">
          {file.is_active ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
              Active
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              Previous
            </span>
          )}

          <span className="text-muted-foreground">
            {new Date(file.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function FilesPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [files, setFiles] = useState<FileWithCandidate[]>([]);
  const [candidates, setCandidates] = useState<CandidateInfo[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState<DocTypeFilter>("all");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [error, setError] = useState("");

  const [view, setView] = useState<"grid" | "table">("grid");

  async function loadTenant() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("User is not authenticated.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile?.tenant_id)
      throw new Error("No tenant is assigned to this user.");

    return profile.tenant_id as string;
  }

  async function loadCandidates(currentTenantId: string) {
    const { data, error: candidateError } = await supabase
      .from("candidates")
      .select("id, sl, name, passport_no")
      .eq("tenant_id", currentTenantId)
      .eq("is_deleted", false)
      .order("sl", { ascending: true });

    if (candidateError) throw candidateError;

    setCandidates((data ?? []) as CandidateInfo[]);
  }

  async function loadFiles(currentTenantId: string) {
    const data = await getAllFiles(currentTenantId);
    setFiles(data as FileWithCandidate[]);
  }

  const initialize = useCallback(async () => {
    try {
      setError("");
      const currentTenantId = await loadTenant();
      setTenantId(currentTenantId);

      await Promise.all([
        loadCandidates(currentTenantId),
        loadFiles(currentTenantId),
      ]);
    } catch (error) {
      console.error("Failed to initialize files page:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load files.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function handleUploadSuccess() {
    if (!tenantId) return;

    try {
      await loadFiles(tenantId);
    } catch (error) {
      console.error("Failed to reload files:", error);
    }
  }

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesQuery =
        !query ||
        file.candidate?.name.toLowerCase().includes(query) ||
        file.candidate?.passport_no.toLowerCase().includes(query) ||
        file.doc_type.toLowerCase().includes(query);

      const matchesDocType = docType === "all" || file.doc_type === docType;

      return matchesQuery && matchesDocType;
    });
  }, [files, search, docType]);

  const previewUrls = useFilePreviews(files);

  return (
    <div className="space-y-6">
      <FilesToolbar
        search={search}
        onSearchChange={setSearch}
        docType={docType}
        onDocTypeChange={setDocType}
        onRefresh={() => {
          setRefreshing(true);
          void initialize();
        }}
        onCreate={() => setUploadOpen(true)}
        refreshing={refreshing}
        createDisabled={!tenantId || candidates.length === 0}
      />

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>All Files</CardTitle>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant={view === "grid" ? "secondary" : "ghost"}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant={view === "table" ? "secondary" : "ghost"}
              aria-label="Table view"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                Loading files...
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  {files.length === 0
                    ? "No files found"
                    : "No files match your search"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {files.length === 0
                    ? "Upload a candidate document to get started."
                    : "Try a different search term or document type."}
                </p>
              </div>

              {files.length === 0 && (
                <Button
                  variant="outline"
                  disabled={candidates.length === 0}
                  onClick={() => setUploadOpen(true)}
                >
                  Upload File
                </Button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  url={previewUrls[file.id]}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Passport No</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.candidate?.sl ?? "-"}</TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {file.candidate?.name ?? "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {file.candidate?.passport_no ?? "-"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {file.doc_type}
                      </TableCell>
                      <TableCell>v{file.version}</TableCell>
                      <TableCell>
                        {file.is_active ? (
                          <span className="font-medium">Active</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Previous
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(file.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {tenantId && (
        <FileUploadSheet
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          tenantId={tenantId}
          candidates={candidates}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}