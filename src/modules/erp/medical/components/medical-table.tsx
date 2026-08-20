import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Badge,
} from "@/components/ui/badge";

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
  status: Medical["status"],
) {

  switch (status) {

    case "fit":
      return "default";

    case "unfit":
      return "destructive";

    case "expired":
      return "secondary";

    default:
      return "outline";
  }

}


function getStatusLabel(
  status: Medical["status"],
) {

  switch (status) {

    case "new":
      return "New";

    case "fit":
      return "Fit";

    case "unfit":
      return "Unfit";

    case "expired":
      return "Expired";

    default:
      return status;
  }

}


export function MedicalTable({
  medicals,
  loading,
  onEdit,
  onDelete,
}: MedicalTableProps) {

  if (loading) {

    return (
      <Card>

        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading medical records...
        </div>

      </Card>
    );

  }


  if (
    medicals.length === 0
  ) {

    return (
      <Card>

        <div className="py-10 text-center">

          <p className="text-sm font-medium">
            No medical records found.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Add a medical record to get started.
          </p>

        </div>

      </Card>
    );

  }


  return (
    <Card className="overflow-hidden">

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
            (
              medical,
            ) => (

              <TableRow
                key={
                  medical.id
                }
              >

                <TableCell className="font-medium">

                  {
                    medical
                      .candidate
                      ?.name ??
                    "—"
                  }

                </TableCell>


                <TableCell>

                  {
                    medical
                      .candidate
                      ?.passport_no ??
                    "—"
                  }

                </TableCell>


                <TableCell>

                  {
                    medical
                      .medical_date ??
                    "—"
                  }

                </TableCell>


                <TableCell>

                  {
                    medical
                      .fit_date ??
                    "—"
                  }

                </TableCell>


                <TableCell>

                  <Badge
                    variant={
                      getStatusVariant(
                        medical.status,
                      )
                    }
                  >
                    {
                      getStatusLabel(
                        medical.status,
                      )
                    }
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

    </Card>
  );
}