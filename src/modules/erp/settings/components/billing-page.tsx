import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  CreditCard,
  Download,
  FileText,
  HardDrive,
  Pencil,
  Receipt,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/* -------------------------------------------------------------------------- */
/* Dummy data                                                                 */
/* -------------------------------------------------------------------------- */

const CURRENT_PLAN = {
  name: "Professional",
  interval: "Monthly",
  price: "BDT 5,000",
  nextBillingDate: "06 Nov 2026",
  estimatedCharge: "BDT 5,000",
};

const USAGE = [
  {
    label: "Candidates",
    value: "324 / 1,000",
    used: 324,
    limit: 1000,
    icon: UsersRound,
  },
  {
    label: "Team members",
    value: "8 / 10",
    used: 8,
    limit: 10,
    icon: Users,
  },
  {
    label: "Storage",
    value: "2.4 / 10 GB",
    used: 2.4,
    limit: 10,
    icon: HardDrive,
  },
];

const INVOICES = [
  { id: "INV-2026-010", date: "06 Oct 2026", period: "Oct 2026", amount: "BDT 5,000" },
  { id: "INV-2026-009", date: "06 Sep 2026", period: "Sep 2026", amount: "BDT 5,000" },
  { id: "INV-2026-008", date: "06 Aug 2026", period: "Aug 2026", amount: "BDT 5,000" },
  { id: "INV-2026-007", date: "06 Jul 2026", period: "Jul 2026", amount: "BDT 5,000" },
];

const PAYMENTS = [
  {
    date: "06 Oct 2026",
    description: "Professional Monthly",
    method: "Visa •••• 4242",
    amount: "BDT 5,000",
  },
  {
    date: "06 Sep 2026",
    description: "Professional Monthly",
    method: "Visa •••• 4242",
    amount: "BDT 5,000",
  },
  {
    date: "06 Aug 2026",
    description: "Professional Monthly",
    method: "Visa •••• 4242",
    amount: "BDT 5,000",
  },
];

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function UsageItem({
  label,
  value,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  value: string;
  used: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">{label}</span>
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {value}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}

function PaidBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    >
      <Check className="size-3" />
      Paid
    </Badge>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Billing page                                                               */
/* -------------------------------------------------------------------------- */

export function BillingPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Receipt className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Billing</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your subscription, billing information, invoices, and payments.
        </p>
      </div>

      <Card className="divide-y overflow-hidden">
        {/* ---------------------------------------------------------------- */}
        {/* Plan + usage + billing cycle                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid lg:grid-cols-[1fr_260px] lg:divide-x">
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{CURRENT_PLAN.name}</h2>
                <Badge variant="secondary" className="text-[11px]">
                  {CURRENT_PLAN.interval}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <CircleCheck className="size-3" />
                  Active
                </Badge>
                <span className="ml-2 text-lg font-semibold tracking-tight">
                  {CURRENT_PLAN.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / month
                  </span>
                </span>
              </div>

              <Button variant="outline" size="sm">
                Manage subscription
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>

            <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground">
              Everything your recruitment agency needs to manage candidates,
              workflow, users, and daily operations.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {USAGE.map((item) => (
                <UsageItem key={item.label} {...item} />
              ))}
            </div>
          </div>

          <div className="bg-muted/20 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Billing cycle
            </p>

            <div className="mt-3 flex items-center gap-3">
              <CalendarDays className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Monthly billing</p>
                <p className="text-xs text-muted-foreground">
                  Renews automatically
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Next billing date</p>
              <p className="mt-0.5 text-sm font-semibold">
                {CURRENT_PLAN.nextBillingDate}
              </p>
              <p className="text-xs text-muted-foreground">
                Estimated charge · {CURRENT_PLAN.estimatedCharge}
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Billing information + payment method                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid lg:grid-cols-2 lg:divide-x">
          <div className="p-5">
            <SectionTitle
              title="Billing information"
              description="Information displayed on your invoices."
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mt-1 size-8"
                  aria-label="Edit billing information"
                >
                  <Pencil className="size-3.5" />
                </Button>
              }
            />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Organization" value="Overseas ERP" />
              <Field label="Billing email" value="billing@overseaserp.com" />
              <Field label="Country" value="Bangladesh" />
              <Field label="Currency" value="BDT — ৳" />
              <div className="col-span-2">
                <Field label="Billing address" value="Dhaka, Bangladesh" />
              </div>
            </div>
          </div>

          <div className="p-5">
            <SectionTitle
              title="Payment method"
              description="Default payment method for your subscription."
              action={<Badge variant="secondary">Default</Badge>}
            />

            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                <CreditCard className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/28</p>
              </div>

              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>

            <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              <p>Payment details are securely handled by the payment provider.</p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Invoices + payment history                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid lg:grid-cols-[1.6fr_1fr] lg:divide-x">
          <div className="min-w-0 p-5">
            <SectionTitle
              title="Invoices"
              description="Download and review your previous invoices."
              action={<Badge variant="outline">{INVOICES.length} invoices</Badge>}
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Period</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-center font-medium">Status</th>
                    <th className="py-2 pl-3" />
                  </tr>
                </thead>

                <tbody>
                  {INVOICES.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{invoice.id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {invoice.date}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {invoice.period}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {invoice.amount}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <PaidBadge />
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2">
                          <Download className="size-3.5" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-5">
            <SectionTitle
              title="Payment history"
              description="Recent payments made for your subscription."
            />

            <div className="divide-y">
              {PAYMENTS.map((payment) => (
                <div
                  key={`${payment.date}-${payment.description}`}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {payment.description}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {payment.date} • {payment.method}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{payment.amount}</span>
                    <PaidBadge />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Help                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="flex items-center justify-between gap-3 bg-muted/20 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Need help with billing?
            </span>{" "}
            Contact support if you have questions about your plan, invoices, or
            payments.
          </p>

          <Button variant="ghost" size="sm" className="hidden shrink-0 sm:flex">
            Contact support
            <ChevronRight className="ml-1 size-3.5" />
          </Button>
        </section>
      </Card>
    </div>
  );
}