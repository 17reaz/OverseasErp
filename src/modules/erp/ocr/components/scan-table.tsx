import { useMemo, useState } from "react";
import { ChevronRight, FileText, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOC_TYPES, DOC_TYPE_LABEL } from "../data/dummy";
import type { OcrScan } from "../types";
import { ConfidenceText, StatusBadge } from "./status-badge";

interface Props {
  scans: OcrScan[];
  onSelect: (id: string) => void;
}

export function ScanTable({ scans, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [docType, setDocType] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scans.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (docType !== "all" && s.docType !== docType) return false;
      if (!q) return true;
      return (
        s.fileName.toLowerCase().includes(q) ||
        (s.candidateName ?? "").toLowerCase().includes(q)
      );
    });
  }, [scans, query, status, docType]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file or candidate"
            className="pl-8"
          />
        </div>
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All documents</SelectItem>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {DOC_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="needs_review">Needs review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead className="hidden md:table-cell">Document</TableHead>
              <TableHead className="hidden sm:table-cell">Candidate</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No scans match these filters. Clear the search or change the filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => {
              const busy = s.status === "processing";
              return (
                <TableRow
                  key={s.id}
                  onClick={() => !busy && onSelect(s.id)}
                  className={busy ? "opacity-70" : "cursor-pointer"}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{s.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{DOC_TYPE_LABEL[s.docType]}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {s.candidateName ?? <span className="text-muted-foreground">Not linked</span>}
                  </TableCell>
                  <TableCell>
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <ConfidenceText value={s.confidence} />
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {new Date(s.createdAt).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {!busy && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
