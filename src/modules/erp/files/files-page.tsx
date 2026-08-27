import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";

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
        <CardHeader>
          <CardTitle>All Files</CardTitle>
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