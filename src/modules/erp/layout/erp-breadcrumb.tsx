import { Fragment } from "react"
import { Link, useLocation } from "react-router-dom"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { erpNavigation } from "./erp-navigation"

type Crumb = {
  label: string
  to: string
  link: boolean
}

// erpNavigation theke auto label: "fingers" -> "Finger", "agencies" -> "Agencies"
const LABELS: Record<string, string> = Object.fromEntries(
  erpNavigation.map((item) => [item.url.split("/").pop() as string, item.title]),
)

// extra / nested route er label
Object.assign(LABELS, {
  settings: "Settings",
  trash: "Trash",
  new: "New",
  use: "Use Template",
  templates: "Templates",
  sales: "Sales",
  transactions: "Transactions",
  payroll: "Payroll",
  "fixed-costs": "Fixed Costs",
  invoices: "Invoices",
  parties: "Parties",
  assets: "Assets",
  receivables: "Receivables",
  payables: "Payables",
  investments: "Investments",
  "visa-inventory": "Visa Inventory",
})

// ei segment er pore je id ashe (:candidateId, :agentId ...) seta "Details" hobe
const DYNAMIC_PARENTS = new Set(["candidates", "agents", "agencies", "templates"])

// ei segment er nijer kono page nei (/app/reports/templates route nei)
const NO_LINK = new Set(["templates"])

function titleCase(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean).slice(1) // "app" bad

  const crumbs: Crumb[] = parts.map((segment, index) => {
    const prev = parts[index - 1]
    const isDynamic =
      prev !== undefined && DYNAMIC_PARENTS.has(prev) && !(segment in LABELS)

    return {
      label: isDynamic ? "Details" : (LABELS[segment] ?? titleCase(segment)),
      to: `/app/${parts.slice(0, index + 1).join("/")}`,
      link: !isDynamic && !NO_LINK.has(segment),
    }
  })

  if (parts[0] !== "dashboard") {
    crumbs.unshift({ label: "Dashboard", to: "/app/dashboard", link: true })
  }

  return crumbs
}

export function ErpBreadcrumb() {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          // mobile e shudhu last 2 ta dekhabe
          const hideOnMobile = index < crumbs.length - 2

          return (
            <Fragment key={`${crumb.to}-${index}`}>
              <BreadcrumbItem
                className={cn("min-w-0", hideOnMobile && "hidden md:inline-flex")}
              >
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.link ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </BreadcrumbItem>

              {!isLast && (
                <BreadcrumbSeparator
                  className={cn(hideOnMobile && "hidden md:block")}
                />
              )}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}