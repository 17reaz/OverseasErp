import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Badge,
} from "@/components/ui/badge";

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


export function MedicalTable({
  medicals,
  loading,
  onEdit,
  onDelete,
}: MedicalTableProps) {

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading medical records...
          </p>
        </CardContent>
      </Card>
    );
  }


  if (
    medicals.length === 0
  ) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-2">
          <p className="font-medium">
            No medical records
          </p>

          <p className="text-sm text-muted-foreground">
            Add a medical record to get started.
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="border-b bg-muted/40">

            <tr>

              <th className="px-4 py-3 text-left font-medium">
                Candidate
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Passport
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Medical Date
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Fit Date
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Status
              </th>

              <th className="w-12 px-4 py-3" />

            </tr>

          </thead>


          <tbody>

            {medicals.map(
              (
                medical,
              ) => (

                <tr
                  key={
                    medical.id
                  }
                  className="border-b last:border-0"
                >

                  <td className="px-4 py-3 font-medium">
                    {
                      medical
                        .candidate
                        ?.name ??
                      "—"
                    }
                  </td>


                  <td className="px-4 py-3">
                    {
                      medical
                        .candidate
                        ?.passport_no ??
                      "—"
                    }
                  </td>


                  <td className="px-4 py-3">
                    {
                      medical
                        .medical_date ??
                      "—"
                    }
                  </td>


                  <td className="px-4 py-3">
                    {
                      medical
                        .fit_date ??
                      "—"
                    }
                  </td>


                  <td className="px-4 py-3">

                    <Badge
                      variant={
                        getStatusVariant(
                          medical.status,
                        )
                      }
                    >
                      {
                        medical.status
                      }
                    </Badge>

                  </td>


                  <td className="px-4 py-3">

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

                  </td>

                </tr>

              ),
            )}

          </tbody>

        </table>

      </div>

    </Card>
  );
}