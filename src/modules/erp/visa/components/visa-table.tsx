import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Visa } from "../visa-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface AgencyOption {
  id: string;
  name: string;
}

interface VisaTableProps {
  records: Visa[];
  candidates: CandidateOption[];
  agencies: AgencyOption[];
  loading?: boolean;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function VisaTable({
  records,
  candidates,
  agencies,
  loading = false,
  onEdit,
  onDelete,
}: VisaTableProps) {
  function getCandidate(id: string) {
    return candidates.find((c) => c.id === id);
  }

  function getAgency(id: string | null) {
    if (!id) return null;
    return agencies.find((a) => a.id === id);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border">
        <p className="text-sm text-muted-foreground">Loading visas...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border">
        <div className="text-center">
          <p className="text-sm font-medium">No visa records found.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a visa record to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-md border">
      <div className="h-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b">
              <th className="h-11 px-4 text-left font-medium">SL</th>
              <th className="h-11 px-4 text-left font-medium">Candidate</th>
              <th className="h-11 px-4 text-left font-medium">Passport</th>
              <th className="h-11 px-4 text-left font-medium">Visa No</th>
              <th className="h-11 px-4 text-left font-medium">Type</th>
              <th className="h-11 px-4 text-left font-medium">Visa Date</th>
              <th className="h-11 px-4 text-left font-medium">Expiry Date</th>
              <th className="h-11 px-4 text-left font-medium">Agency</th>
              <th className="h-11 px-4 text-left font-medium">Status</th>
              <th className="h-11 w-[70px] px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const candidate = getCandidate(record.candidate_id);
              const agency = getAgency(record.agency_id);

              return (
                <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{record.sl}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[160px] truncate font-medium">
                      {candidate?.name ?? "Unknown"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {candidate?.passport_no ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    {record.visa_no}
                  </td>
                  <td className="px-4 py-3 capitalize">{record.visa_type}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(record.visa_date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(record.expiry_date)}</td>
                  <td className="px-4 py-3">{agency?.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(record)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(record)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}