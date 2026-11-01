import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PdfThumbnail } from "./components/pdf-thumbnail";
import { FilesToolbar, type DocTypeFilter } from "./components/files-toolbar";
import { FileUploadSheet } from "./file-upload-sheet";
import {
  getAllFiles,
  getStorageBucket,
  savePdfThumbnail,
} from "./files-service";

import type { FileRecord } from "./types";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

interface CandidateInfo {
  id: string;
  sl: number;
  name: string;
  passport_no: string;
}

interface FileWithCandidate extends FileRecord {
  candidate?: CandidateInfo;
}

type PreviewKind = "image" | "pdf" | "other";

interface SignTarget {
  bucket: string;
  path: string;
}

/** undefined = still loading, null = failed, string = ready */
type UrlState = string | null | undefined;

const PAGE_SIZE = 12;
const FILES_PAGE_KEY = "overseaserp:files-page";
const THUMBNAIL_BUCKET = "file-thumbnails";

const SIGNED_URL_TTL = 60 * 60; // 1 hour
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // re-sign 5 min before expiry

/* ------------------------------------------------------------------ */
/* Signed URL cache (shared across renders, pages and remounts)        */
/* ------------------------------------------------------------------ */

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// Thumbnails already uploaded in this session (avoids duplicate saves)
const savedThumbnailIds = new Set<number>();

function cacheKey(bucket: string, path: string) {
  return `${bucket}/${path}`;
}

function getCachedUrl(bucket: string, path: string): string | undefined {
  const hit = signedUrlCache.get(cacheKey(bucket, path));

  if (!hit || hit.expiresAt - Date.now() < REFRESH_MARGIN_MS) {
    return undefined;
  }

  return hit.url;
}

/**
 * Signs many paths with ONE request per bucket.
 * Already-cached paths are skipped.
 * Returns { "bucket/path": url | null }.
 */
async function signUrls(
  targets: SignTarget[],
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  const missing = new Map<string, string[]>();

  for (const { bucket, path } of targets) {
    const key = cacheKey(bucket, path);
    const cached = getCachedUrl(bucket, path);

    if (cached) {
      out[key] = cached;
      continue;
    }

    const list = missing.get(bucket) ?? [];
    if (!list.includes(path)) list.push(path);
    missing.set(bucket, list);
  }

  await Promise.all(
    [...missing.entries()].map(async ([bucket, paths]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(paths, SIGNED_URL_TTL);

      if (error || !data) {
        console.error(`Signed URLs failed for bucket "${bucket}":`, error);
        paths.forEach((path) => {
          out[cacheKey(bucket, path)] = null;
        });
        return;
      }

      data.forEach((item, index) => {
        const path = item.path ?? paths[index];
        const key = cacheKey(bucket, path);

        if (item.error || !item.signedUrl) {
          out[key] = null;
          return;
        }

        signedUrlCache.set(key, {
          url: item.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_TTL * 1000,
        });
        out[key] = item.signedUrl;
      });
    }),
  );

  return out;
}

/**
 * Resolves signed URLs for a list of targets (batched + cached).
 * Returns a lookup: resolve(bucket, path) -> UrlState
 */
function useSignedUrls(targets: SignTarget[]) {
  const [urls, setUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (targets.length === 0) return;

    let cancelled = false;

    signUrls(targets)
      .then((result) => {
        if (!cancelled) setUrls((prev) => ({ ...prev, ...result }));
      })
      .catch((error) => {
        console.error("Failed to resolve signed URLs:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [targets]);

  return useCallback(
    (bucket: string, path: string): UrlState => {
      const state = urls[cacheKey(bucket, path)];
      if (state !== undefined) return state;

      // Cache hit on first render -> no spinner flash
      return getCachedUrl(bucket, path);
    },
    [urls],
  );
}

/* ------------------------------------------------------------------ */
/* Preview helpers                                                     */
/* ------------------------------------------------------------------ */

// Shown when a file has no preview
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

// Detect the preview type from the file_location extension
function getPreviewKind(file: FileWithCandidate): PreviewKind {
  const name = (file.file_location ?? "").toLowerCase();

  if (/\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  return "other";
}

// The original file is only needed for images, or for PDFs that
// don't have a saved thumbnail yet (so we can render + save one).
function needsOriginalUrl(file: FileWithCandidate): boolean {
  if (!file.file_location) return false;

  const kind = getPreviewKind(file);

  if (kind === "image") return true;
  if (kind === "pdf") return !file.thumbnail_location;
  return false;
}

function Spinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
    </div>
  );
}

function NoPreview() {
  return (
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
  );
}

/* ------------------------------------------------------------------ */
/* File card                                                           */
/* ------------------------------------------------------------------ */

function FileCard({
  file,
  thumbnailUrl,
  originalUrl,
}: {
  file: FileWithCandidate;
  thumbnailUrl: UrlState;
  originalUrl: UrlState;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<UrlState>(undefined);

  const kind = getPreviewKind(file);
  const title = file.candidate?.name ?? "Unknown candidate";
  const alt = `${file.doc_type} - ${title}`;
  const bucket = getStorageBucket(file.doc_type);

  const hasStoredThumb = Boolean(file.thumbnail_location);
  const thumbBroken =
    hasStoredThumb && (thumbnailUrl === null || thumbFailed);

  // Rare case: saved thumbnail is broken -> sign the original on demand
  // so the PDF can be re-rendered and the thumbnail healed.
  useEffect(() => {
    if (kind !== "pdf" || !thumbBroken || !file.file_location) return;

    let cancelled = false;
    const path = file.file_location;

    void signUrls([{ bucket, path }]).then((result) => {
      if (!cancelled) setFallbackUrl(result[cacheKey(bucket, path)] ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [kind, thumbBroken, bucket, file.file_location]);

  const persistThumbnail = useCallback(
    async (blob: Blob) => {
      if (savedThumbnailIds.has(file.id)) return;
      savedThumbnailIds.add(file.id);

      try {
        await savePdfThumbnail(file.id, blob);
      } catch (error) {
        savedThumbnailIds.delete(file.id);
        console.error("Failed to save PDF thumbnail:", error);
      }
    },
    [file.id],
  );

  // Open the original file: sign only when the user clicks
  const openOriginal = useCallback(async () => {
    if (!file.file_location) return;

    // Open the tab synchronously so popup blockers allow it
    const tab = window.open("about:blank", "_blank");

    try {
      const result = await signUrls([
        { bucket, path: file.file_location },
      ]);
      const url = result[cacheKey(bucket, file.file_location)];

      if (!url) throw new Error("Could not create file URL.");

      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to open file:", error);
      tab?.close();
    }
  }, [bucket, file.file_location]);

  function renderPreview() {
    /* ---- Images: need the original ---- */
    if (kind === "image") {
      if (originalUrl === undefined) return <Spinner />;
      if (!originalUrl || imageFailed) return <NoPreview />;

      return (
        <img
          src={originalUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      );
    }

    /* ---- PDFs ---- */
    if (kind === "pdf") {
      // 1) Saved thumbnail -> only the JPEG is downloaded
      if (hasStoredThumb && !thumbBroken) {
        if (thumbnailUrl === undefined) return <Spinner />;

        return (
          <img
            src={thumbnailUrl ?? undefined}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top"
            onError={() => setThumbFailed(true)}
          />
        );
      }

      // 2) No (working) thumbnail -> render the PDF, then save it
      const pdfUrl = hasStoredThumb ? fallbackUrl : originalUrl;

      if (pdfUrl === undefined) return <Spinner />;
      if (!pdfUrl) return <NoPreview />;

      return (
        <PdfThumbnail
          url={pdfUrl}
          cacheKey={file.file_location}
          title={alt}
          fit="cover"
          onGenerated={persistThumbnail}
        />
      );
    }

    return <NoPreview />;
  }

  return (
    <div className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {renderPreview()}

        {/* Opens the original file (signed on click) */}
        {file.file_location && (
          <button
            type="button"
            aria-label={`Open ${file.doc_type} for ${title}`}
            className="absolute inset-0 cursor-pointer"
            onClick={() => void openOriginal()}
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
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState<DocTypeFilter>("all");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = Number(localStorage.getItem(FILES_PAGE_KEY));
    return Number.isInteger(savedPage) && savedPage > 0 ? savedPage : 1;
  });

  const hasMountedFilters = useRef(false);

  /* ----------------------------- Data ----------------------------- */

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
    if (!profile?.tenant_id) {
      throw new Error("No tenant is assigned to this user.");
    }

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

  /* ------------------- Filtering & pagination --------------------- */

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

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedFiles = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredFiles.slice(start, start + PAGE_SIZE);
  }, [filteredFiles, safePage]);

  /* ------------------------ Preview URLs -------------------------- */

  // 1) Saved thumbnails: one batched request for the whole page
  const thumbnailTargets = useMemo<SignTarget[]>(() => {
    if (view !== "grid") return [];

    return paginatedFiles
      .filter((file) => file.thumbnail_location)
      .map((file) => ({
        bucket: THUMBNAIL_BUCKET,
        path: file.thumbnail_location!,
      }));
  }, [paginatedFiles, view]);

  // 2) Originals: ONLY images + PDFs without a saved thumbnail
  const originalTargets = useMemo<SignTarget[]>(() => {
    if (view !== "grid") return [];

    return paginatedFiles.filter(needsOriginalUrl).map((file) => ({
      bucket: getStorageBucket(file.doc_type),
      path: file.file_location,
    }));
  }, [paginatedFiles, view]);

  const resolveThumbnail = useSignedUrls(thumbnailTargets);
  const resolveOriginal = useSignedUrls(originalTargets);

  /* ---------------------- Page state effects ---------------------- */

  // Clamp the page only after files have finished loading
  useEffect(() => {
    if (loading) return;

    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [loading, currentPage, safePage]);

  // Save the current page once files have loaded
  useEffect(() => {
    if (loading) return;

    localStorage.setItem(FILES_PAGE_KEY, String(safePage));
  }, [loading, safePage]);

  // Reset to page 1 when filters change (but not on the first render,
  // so the saved page is kept)
  useEffect(() => {
    if (!hasMountedFilters.current) {
      hasMountedFilters.current = true;
      return;
    }

    setCurrentPage(1);
  }, [search, docType]);

  /* ----------------------------- Render --------------------------- */

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] flex-col gap-4">
      {/* Sticky header: stays on top while scrolling */}
      <div className="sticky top-0 z-20 -mx-4 space-y-4 bg-background/95 px-4 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <FilesToolbar
          search={search}
          onSearchChange={setSearch}
          docType={docType}
          onDocTypeChange={setDocType}
          view={view}
          onViewChange={setView}
          onRefresh={() => {
            setRefreshing(true);
            void initialize();
          }}
          onCreate={() => setUploadOpen(true)}
          refreshing={refreshing}
          createDisabled={!tenantId || candidates.length === 0}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="min-h-0 flex-1 overflow-y-auto">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading files...</p>
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
              {paginatedFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  thumbnailUrl={
                    file.thumbnail_location
                      ? resolveThumbnail(
                          THUMBNAIL_BUCKET,
                          file.thumbnail_location,
                        )
                      : undefined
                  }
                  originalUrl={
                    needsOriginalUrl(file)
                      ? resolveOriginal(
                          getStorageBucket(file.doc_type),
                          file.file_location,
                        )
                      : undefined
                  }
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
                  {paginatedFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.candidate?.sl ?? "-"}</TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {file.candidate?.name ?? "-"}
                        </p>
                      </TableCell>
                      <TableCell>{file.candidate?.passport_no ?? "-"}</TableCell>
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

          {filteredFiles.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>
                {" - "}
                <span className="font-medium text-foreground">
                  {Math.min(safePage * PAGE_SIZE, filteredFiles.length)}
                </span>
                {" of "}
                <span className="font-medium text-foreground">
                  {filteredFiles.length}
                </span>
                {" files"}
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>

                <span className="min-w-[90px] text-center text-sm font-medium">
                  Page {safePage} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
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