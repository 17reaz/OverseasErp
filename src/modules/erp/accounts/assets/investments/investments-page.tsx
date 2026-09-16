import { Plus, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

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
import { Badge } from "@/components/ui/badge";

import { InvestmentSheet } from "./investment-sheet";

type InvestmentType = "shares" | "fixed_deposit" | "other";

interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  date: string;
  status: "active" | "closed";
}

const dummyInvestments: Investment[] = [
  {
    id: "1",
    name: "ABC Ltd Shares",
    type: "shares",
    investedAmount: 200000,
    currentValue: 220000,
    date: "2026-09-10",
    status: "active",
  },
  {
    id: "2",
    name: "Bank FDR",
    type: "fixed_deposit",
    investedAmount: 200000,
    currentValue: 205000,
    date: "2026-08-20",
    status: "active",
  },
  {
    id: "3",
    name: "XYZ Shares",
    type: "shares",
    investedAmount: 100000,
    currentValue: 115000,
    date: "2026-07-15",
    status: "active",
  },
];

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function getInvestmentTypeLabel(type: InvestmentType) {
  switch (type) {
    case "shares":
      return "Shares";
    case "fixed_deposit":
      return "Fixed Deposit";
    case "other":
      return "Other";
  }
}

function InvestmentsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const summary = useMemo(() => {
    const invested = dummyInvestments.reduce(
      (sum, item) => sum + item.investedAmount,
      0,
    );

    const current = dummyInvestments.reduce(
      (sum, item) => sum + item.currentValue,
      0,
    );

    return {
      invested,
      current,
      gainLoss: current - invested,
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Investments
          </h1>
          <p className="text-sm text-muted-foreground">
            Track shares, deposits and other business investments.
          </p>
        </div>

        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {currency.format(summary.invested)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {currency.format(summary.current)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Gain / Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <div className="text-2xl font-semibold">
              {currency.format(summary.gainLoss)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment List</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Invested</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Gain / Loss</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dummyInvestments.map((investment) => {
                const gainLoss =
                  investment.currentValue -
                  investment.investedAmount;

                return (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">
                      {investment.name}
                    </TableCell>

                    <TableCell>
                      {getInvestmentTypeLabel(investment.type)}
                    </TableCell>

                    <TableCell>
                      {currency.format(investment.investedAmount)}
                    </TableCell>

                    <TableCell>
                      {currency.format(investment.currentValue)}
                    </TableCell>

                    <TableCell>
                      {currency.format(gainLoss)}
                    </TableCell>

                    <TableCell>{investment.date}</TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {investment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvestmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

export { InvestmentsPage };