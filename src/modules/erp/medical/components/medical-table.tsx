import {
  ArrowRight,
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

  onNext?: (
    medical: Medical,
  ) => void;
}


function getStatusVariant(
  status: MedicalStatus,
) {

  if (
    status === "unfit"
  ) {
    return "destructive" as const;
  }


  if (
    status === "fit"
  ) {
    return "default" as const;
  }


  if (
    status === "expired"
  ) {
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
  onNext,
}: MedicalTableProps) {

  return (
    <div
      className="
        flex
        h-[calc(100vh-250px)]
        min-h-[400px]
        flex-col
        overflow-hidden
        rounded-lg
        border
        bg-background
      "
    >

      {/* ==================================================
          TABLE
          ================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
        "
      >

        {loading ? (

          <div
            className="
              flex
              min-h-[200px]
              items-center
              justify-center
            "
          >

            <p
              className="
                text-sm
                text-muted-foreground
              "
            >
              Loading medical records...
            </p>

          </div>

        ) : medicals.length === 0 ? (

          <div
            className="
              flex
              min-h-[200px]
              items-center
              justify-center
            "
          >

            <div
              className="
                text-center
              "
            >

              <p
                className="
                  text-sm
                  font-medium
                "
              >
                No medical records found
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Medical records will appear here.
              </p>

            </div>

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

                <TableHead
                  className="
                    w-[150px]
                    text-right
                  "
                >
                  Action
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {medicals.map(
                (medical) => (

                  <TableRow
                    key={
                      medical.id
                    }
                  >

                    {/* Candidate */}

                    <TableCell
                      className="
                        font-medium
                      "
                    >
                      {
                        medical.candidate
                          ?.name ??
                        "—"
                      }
                    </TableCell>


                    {/* Passport */}

                    <TableCell>

                      {
                        medical.candidate
                          ?.passport_no ??
                        "—"
                      }

                    </TableCell>


                    {/* Medical Date */}

                    <TableCell>

                      {
                        medical.medical_date ??
                        "—"
                      }

                    </TableCell>


                    {/* Fit Date */}

                    <TableCell>

                      {
                        medical.fit_date ??
                        "—"
                      }

                    </TableCell>


                    {/* Status */}

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


                    {/* Actions */}

                    <TableCell>

                      <div
                        className="
                          flex
                          items-center
                          justify-end
                          gap-1
                        "
                      >

                        {/* ==================================
                            FIT → NEXT
                            ================================== */}

                        {medical.status ===
                          "fit" && (

                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() =>
                              onNext?.(
                                medical,
                              )
                            }
                          >

                            Next

                            <ArrowRight />

                          </Button>

                        )}


                        {/* ==================================
                            MORE
                            ================================== */}

                        <DropdownMenu>

                          <DropdownMenuTrigger
                            asChild
                          >

                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                            >

                              <MoreHorizontal />

                              <span
                                className="
                                  sr-only
                                "
                              >
                                Actions
                              </span>

                            </Button>

                          </DropdownMenuTrigger>


                          <DropdownMenuContent
                            align="end"
                          >

                            {/* Edit */}

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


                            {/* Delete */}

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

                      </div>

                    </TableCell>

                  </TableRow>

                ),
              )}

            </TableBody>

          </Table>

        )}

      </div>

    </div>
  );
}