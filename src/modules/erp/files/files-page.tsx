import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";

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

import { getFileVersions } from "./files-service";

import type { FileRecord } from "./types";

interface CandidateInfo {
  id: string;
  sl: number;
  name: string;
  passport_no: string;
}

export function FilesPage() {
  const [tenantId, setTenantId] =
    useState<string | null>(null);

  const [candidate, setCandidate] =
    useState<CandidateInfo | null>(null);

  const [files, setFiles] =
    useState<FileRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showUpload, setShowUpload] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Load logged-in user's tenant
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
   * Temporary candidate
   *
   * Candidate module এখনো তৈরি হয়নি।
   * তাই existing candidate table থেকে
   * tenant-এর প্রথম candidate নেওয়া হচ্ছে।
   */
  async function loadCandidate(
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
      .eq("is_deleted", false)
      .order("sl", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (candidateError) {
      throw candidateError;
    }

    if (!data) {
      return null;
    }

    return data as CandidateInfo;
  }

  /*
   * Load files for selected candidate
   */
  async function loadFiles(
    candidateId?: string,
  ) {
    if (!candidateId) {
      setFiles([]);
      return;
    }

    const data =
      await getFileVersions(
        candidateId,
        "passport",
      );

    setFiles(data);
  }

  /*
   * Initial load
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

      const currentCandidate =
        await loadCandidate(
          currentTenantId,
        );

      setCandidate(
        currentCandidate,
      );

      if (currentCandidate) {
        await loadFiles(
          currentCandidate.id,
        );
      }
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
   * After successful upload
   */
  async function handleUploadSuccess() {
    if (!candidate) {
      return;
    }

    await loadFiles(
      candidate.id,
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Files
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage candidate documents.
          </p>
        </div>

        <Button
          disabled={
            !tenantId ||
            !candidate
          }
          onClick={() =>
            setShowUpload(true)
          }
        >
          <Plus />

          Upload File
        </Button>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Candidate Information */}

      {candidate && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Candidate SL
                </p>

                <p className="font-medium">
                  {candidate.sl}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Name
                </p>

                <p className="font-medium">
                  {candidate.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Passport No
                </p>

                <p className="font-medium">
                  {candidate.passport_no}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Candidate */}

      {!loading &&
        !candidate &&
        !error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 size-10 text-muted-foreground" />

              <p className="font-medium">
                No candidate found
              </p>

              <p className="text-sm text-muted-foreground">
                Create a candidate first before
                uploading documents.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Files Table */}

      <Card>
        <CardHeader>
          <CardTitle>
            Passport Files
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  No passport files
                </p>

                <p className="text-sm text-muted-foreground">
                  Upload the first passport document.
                </p>
              </div>

              {candidate && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setShowUpload(true)
                  }
                >
                  <Plus />

                  Upload Passport
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    ID
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
                {files.map((file) => (
                  <TableRow
                    key={file.id}
                  >
                    <TableCell>
                      {file.id}
                    </TableCell>

                    <TableCell className="capitalize">
                      {file.doc_type}
                    </TableCell>

                    <TableCell>
                      v{file.version}
                    </TableCell>

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

                    <TableCell>
                      {new Date(
                        file.created_at,
                      ).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Sheet */}

      {tenantId &&
        candidate && (
          <FileUploadSheet
            open={showUpload}
            onOpenChange={
              setShowUpload
            }
            tenantId={tenantId}
            candidateId={
              candidate.id
            }
            candidateSl={
              candidate.sl
            }
            candidateName={
              candidate.name
            }
            passportNo={
              candidate.passport_no
            }
            onSuccess={
              handleUploadSuccess
            }
          />
        )}
    </div>
  );
}