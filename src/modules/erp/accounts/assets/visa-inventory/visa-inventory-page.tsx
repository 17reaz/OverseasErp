import { Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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

import { VisaInventorySheet } from "./visa-inventory-sheet";

interface VisaInventoryItem {
  id: string;
  country: string;
  visaType: string;
  quantity: number;
  availableQuantity: number;
  unitCost: number;
  purchaseDate: string;
  status: "available" | "depleted";
}

const dummyInventory: VisaInventoryItem[] = [
  {
    id: "1",
    country: "Saudi Arabia",
    visaType: "Work Visa",
    quantity: 5,
    availableQuantity: 3,
    unitCost: 20000,
    purchaseDate: "2026-09-10",
    status: "available",
  },
  {
    id: "2",
    country: "Qatar",
    visaType: "Work Visa",
    quantity: 4,
    availableQuantity: 4,
    unitCost: 15000,
    purchaseDate: "2026-09-08",
    status: "available",
  },
  {
    id: "3",
    country: "UAE",
    visaType: "Work Visa",
    quantity: 2,
    availableQuantity: 0,
    unitCost: 10000,
    purchaseDate: "2026-08-20",
    status: "depleted",
  },
];

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function VisaInventoryPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const summary = useMemo(() => {
    const totalValue = dummyInventory.reduce(
      (sum, item) =>
        sum + item.availableQuantity * item.unitCost,
      0,
    );

    const available = dummyInventory.reduce(
      (sum, item) => sum + item.availableQuantity,
      0,
    );

    const total = dummyInventory.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      totalValue,
      available,
      total,
      used: total - available,
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Visa Inventory
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage purchased visas currently held by the business.
          </p>
        </div>

        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Visa Stock
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {currency.format(summary.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Available
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.available}
            </div>
            <p className="text-xs text-muted-foreground">
              visas available for assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Used
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.used}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Visa Stock
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Visa Type</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dummyInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.country}
                  </TableCell>

                  <TableCell>{item.visaType}</TableCell>

                  <TableCell>{item.quantity}</TableCell>

                  <TableCell>
                    {item.availableQuantity}
                  </TableCell>

                  <TableCell>
                    {currency.format(item.unitCost)}
                  </TableCell>

                  <TableCell>
                    {currency.format(
                      item.availableQuantity *
                        item.unitCost,
                    )}
                  </TableCell>

                  <TableCell>{item.purchaseDate}</TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        item.status === "available"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VisaInventorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

export { VisaInventoryPage };