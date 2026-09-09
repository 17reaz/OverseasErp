// src/modules/erp/finance/components/finance-page.tsx

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


import { FinanceOverview } from "./finance-overview";
import { FinanceTransactions } from "./finance-transactions";
import { FinanceInvoices } from "./finance-invoices";
import { FinanceReceivables } from "./finance-receivables";
import { FinancePayables } from "./finance-payables";
import { FinanceExpenses } from "./finance-expenses";
import { FinanceReports } from "./finance-reports";

export function FinancePage() {
  return (
    <div className="space-y-6 p-4">
      <Tabs defaultValue="overview">
        <TabsList className="sticky top-0 z-10 flex-wrap bg-background">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <FinanceOverview />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <FinanceTransactions />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <FinanceInvoices />
        </TabsContent>

        <TabsContent value="receivables" className="mt-4">
          <FinanceReceivables />
        </TabsContent>

        <TabsContent value="payables" className="mt-4">
          <FinancePayables />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <FinanceExpenses />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <FinanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
