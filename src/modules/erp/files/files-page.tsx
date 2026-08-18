import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
} from "lucide-react";

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
  const [tenantId, setTenantId] =
    useState<string | null>(null);

  const [files, setFiles] =
    useState<FileWithCandidate[]>([]);

  const [candidates, setCandidates] =
    useState<CandidateInfo[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [uploadOpen, setUploadOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Get logged-in user's tenant
   */
  async function loadTenant() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "User is not authenticated.",
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.tenant_id) {
      throw new Error(
        "No tenant is assigned to this user.",
      );
    }

    return profile.tenant_id as string;
  }

  /*
   * Load candidates
   *
   * These are only used by the upload sheet.
   * They are NOT displayed as selected candidate
   * on the Files page.
   */
  async function loadCandidates(
    currentTenantId: string,
  ) {
    const {
      data,
      error: candidateError,
    } = await supabase
      .from("candidates")
      .select(
        "id, sl, name, passport_no",
      )
      .eq(
        "tenant_id",
        currentTenantId,
      )
      .eq(
        "is_deleted",
        false,
      )
      .order("sl", {
        ascending: true,
      });

    if (candidateError) {
      throw candidateError;
    }

    setCandidates(
      (data ?? []) as CandidateInfo[],
    );
  }

  /*
   * Load ALL files for this tenant
   */
  async function loadFiles(
    currentTenantId: string,
  ) {
    const data =
      await getAllFiles(
        currentTenantId,
      );

    setFiles(
      data as FileWithCandidate[],
    );
  }

  /*
   * Initial page load
   */
  async function initialize() {
    try {
      setLoading(true);
      setError("");

      const currentTenantId =
        await loadTenant();

      setTenantId(
        currentTenantId,
      );

      await Promise.all([
        loadCandidates(
          currentTenantId,
        ),
        loadFiles(
          currentTenantId,
        ),
      ]);
    } catch (error) {
      console.error(
        "Failed to initialize files page:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load files.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialize();
  }, []);

  /*
   * After upload
   *
   * Reload all files so the newly uploaded
   * file immediately appears in the table.
   */
  async function handleUploadSuccess() {
    if (!tenantId) {
      return;
    }

    try {
      await loadFiles(
        tenantId,
      );
    } catch (error) {
      console.error(
        "Failed to reload files:",
        error,
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Files
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage all candidate documents.
          </p>
        </div>

        <Button
          disabled={
            !tenantId ||
            candidates.length === 0
          }
          onClick={() =>
            setUploadOpen(true)
          }
        >
          <Upload />

          Upload File
        </Button>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* All Files */}

      <Card>
        <CardHeader>
          <CardTitle>
            All Files
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                Loading files...
              </p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  No files found
                </p>

                <p className="text-sm text-muted-foreground">
                  Upload a candidate document
                  to get started.
                </p>
              </div>

              <Button
                variant="outline"
                disabled={
                  candidates.length === 0
                }
                onClick={() =>
                  setUploadOpen(true)
                }
              >
                <Upload />

                Upload File
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      SL
                    </TableHead>

                    <TableHead>
                      Candidate
                    </TableHead>

                    <TableHead>
                      Passport No
                    </TableHead>

                    <TableHead>
                      Document
                    </TableHead>

                    <TableHead>
                      Version
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {files.map(
                    (file) => (
                      <TableRow
                        key={file.id}
                      >
                        {/* Candidate SL */}

                        <TableCell>
                          {file.candidate?.sl ??
                            "-"}
                        </TableCell>

                        {/* Candidate */}

                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium">
                              {file.candidate?.name ??
                                "-"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Passport */}

                        <TableCell>
                          {file.candidate
                            ?.passport_no ??
                            "-"}
                        </TableCell>

                        {/* Document */}

                        <TableCell className="capitalize">
                          {file.doc_type}
                        </TableCell>

                        {/* Version */}

                        <TableCell>
                          v{file.version}
                        </TableCell>

                        {/* Status */}

                        <TableCell>
                          {file.is_active ? (
                            <span className="font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Previous
                            </span>
                          )}
                        </TableCell>

                        {/* Created */}

                        <TableCell>
                          {new Date(
                            file.created_at,
                          ).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Sheet */}

      {tenantId && (
        <FileUploadSheet
          open={uploadOpen}
          onOpenChange={
            setUploadOpen
          }
          tenantId={tenantId}
          candidates={candidates}
          onSuccess={
            handleUploadSuccess
          }
        />
      )}
    </div>
  );
}