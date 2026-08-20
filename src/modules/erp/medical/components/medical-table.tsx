import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
  Medical,
  MedicalStatus,
} from "../medical-service";

interface MedicalTableProps {
  medicals: Medical[];
  loading: boolean;
  onEdit: (
    medical: Medical,
  ) => void;
  onDelete: (
    medical: Medical,
  ) => void;
}

function getStatusVariant(
  status: MedicalStatus,
) {
  if (status === "unfit") {
    return "destructive" as const;
  }

  if (status === "fit") {
    return "default" as const;
  }

  if (status === "expired") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getStatusLabel(
  status: MedicalStatus,
) {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

export function MedicalTable({
  medicals,
  loading,
  onEdit,
  onDelete,
}: MedicalTableProps) {
  return (
    <Card className="overflow-hidden">

      <div className="border-b px-6 py-4">

        <h2 className="font-semibold">
          Medical Records
        </h2>

        <p className="text-sm text-muted-foreground">
          Existing candidate medical records.
        </p>

      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading medical records...
        </div>
      ) : medicals.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No medical records found.
        </div>
      ) : (
        <Table>

          <TableHeader>

            <TableRow>

              <TableHead>
                Candidate
              </TableHead>

              <TableHead>
                Passport
              </TableHead>

              <TableHead>
                Medical Date
              </TableHead>

              <TableHead>
                Fit Date
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead className="w-[60px]" />

            </TableRow>

          </TableHeader>

          <TableBody>

            {medicals.map(
              (medical) => (

                <TableRow
                  key={medical.id}
                >

                  <TableCell className="font-medium">
                    {medical.candidate?.name ??
                      "—"}
                  </TableCell>

                  <TableCell>
                    {medical.candidate?.passport_no ??
                      "—"}
                  </TableCell>

                  <TableCell>
                    {medical.medical_date ??
                      "—"}
                  </TableCell>

                  <TableCell>
                    {medical.fit_date ??
                      "—"}
                  </TableCell>

                  <TableCell>

                    <Badge
                      variant={getStatusVariant(
                        medical.status,
                      )}
                    >
                      {getStatusLabel(
                        medical.status,
                      )}
                    </Badge>

                  </TableCell>

                  <TableCell>

                    <DropdownMenu>

                      <DropdownMenuTrigger
                        asChild
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                      >

                        <DropdownMenuItem
                          onClick={() =>
                            onEdit(
                              medical,
                            )
                          }
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            onDelete(
                              medical,
                            )
                          }
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>

                      </DropdownMenuContent>

                    </DropdownMenu>

                  </TableCell>

                </TableRow>

              ),
            )}

          </TableBody>

        </Table>
      )}

    </Card>
  );
}