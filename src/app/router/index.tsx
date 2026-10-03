import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Auth
import { ProtectedRoute } from "@/modules/auth/components/protected-route";
import { PublicRoute } from "@/modules/auth/components/public-route";
import { LoginPage } from "@/modules/auth/login/login-page";
import { SignupPage } from "@/modules/auth/signup/signup-page";
import { ForgotPasswordPage } from "@/modules/auth/forgot-password/forgot-password-page";
import { ResetPasswordPage } from "@/modules/auth/reset-password/reset-password-page";
import { AcceptInvitationPage } from "@/modules/auth/invitations/accept-invitation-page";
// Landing
import { LandingPage } from "@/modules/landing/landing-page";
import { DownloadPage } from "@/modules/landing/download-page";

// ERP Layout
import { ErpLayout } from "@/modules/erp/layout/erp-layout";

// -----------------------------------------------------------------------------
// Lazy ERP Pages
// -----------------------------------------------------------------------------

const DashboardPage = lazy(() =>
  import("@/modules/erp/dashboard/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);

const CandidatesPage = lazy(() =>
  import("@/modules/erp/candidates/candidates-page").then((module) => ({
    default: module.CandidatesPage,
  })),
);

const CandidateProfilePage = lazy(() =>
  import("@/modules/erp/candidates/profile/candidate-profile-page").then(
    (module) => ({
      default: module.CandidateProfilePage,
    }),
  ),
);

const TrashPage = lazy(() =>
  import("@/modules/erp/trash/trash-page").then((module) => ({
    default: module.TrashPage,
  })),
);

const AgentsPage = lazy(() =>
  import("@/modules/erp/agents/agents-page").then((module) => ({
    default: module.AgentsPage,
  })),
);
const AgentProfilePage = lazy(() =>
  import("@/modules/erp/agents/profile/agent-profile-page").then(
    (module) => ({
      default: module.AgentProfilePage,
    }),
  ),
);
const FilesPage = lazy(() =>
  import("@/modules/erp/files/files-page").then((module) => ({
    default: module.FilesPage,
  })),
);

const MedicalPage = lazy(() =>
  import("@/modules/erp/medical/medical-page").then((module) => ({
    default: module.MedicalPage,
  })),
);

const AgencyPage = lazy(() =>
  import("@/modules/erp/agency/agency-page").then((module) => ({
    default: module.AgencyPage,
  })),
);
const AgencyProfilePage = lazy(() =>
  import("@/modules/erp/agency/profile/agency-profile-page").then(
    (module) => ({
      default: module.AgencyProfilePage,
    }),
  ),
);
const MofaPage = lazy(() =>
  import("@/modules/erp/mofa/mofa-page").then((module) => ({
    default: module.MofaPage,
  })),
);

const FingerPage = lazy(() =>
  import("@/modules/erp/finger/finger-page").then((module) => ({
    default: module.FingerPage,
  })),
);

const PoliceClearancePage = lazy(() =>
  import(
    "@/modules/erp/police-clearance/police-clearance-page"
  ).then((module) => ({
    default: module.PoliceClearancePage,
  })),
);

const TradeTestPage = lazy(() =>
  import("@/modules/erp/takamul/takamul-page").then((module) => ({
    default: module.TradeTestPage,
  })),
);

const VisaPage = lazy(() =>
  import("@/modules/erp/visa/visa-page").then((module) => ({
    default: module.VisaPage,
  })),
);

const BmetPage = lazy(() =>
  import("@/modules/erp/bmet/bmet-page").then((module) => ({
    default: module.BmetPage,
  })),
);

const FlightPage = lazy(() =>
  import("@/modules/erp/flight/flight-page").then((module) => ({
    default: module.FlightPage,
  })),
);

// Reports
const ReportsPage = lazy(() =>
  import("@/modules/erp/reports/reports-page").then((module) => ({
    default: module.ReportsPage,
  })),
);

const TemplateBuilderPage = lazy(() =>
  import(
    "@/modules/erp/reports/document-templates/template-builder-page"
  ).then((module) => ({
    default: module.TemplateBuilderPage,
  })),
);

const TemplateUsePage = lazy(() =>
  import(
    "@/modules/erp/reports/document-templates/template-use-page"
  ).then((module) => ({
    default: module.TemplateUsePage,
  })),
);

// Accounts
const AccountsPage = lazy(() =>
  import("@/modules/erp/accounts/accounts-page").then((module) => ({
    default: module.AccountsPage,
  })),
);

const SalesPage = lazy(() =>
  import("@/modules/erp/accounts/sales/sales-page").then((module) => ({
    default: module.SalesPage,
  })),
);

const PayablesPage = lazy(() =>
  import("@/modules/erp/accounts/payables/payables-page").then((module) => ({
    default: module.PayablesPage,
  })),
);

const TransactionsPage = lazy(() =>
  import(
    "@/modules/erp/accounts/transactions/transactions-page"
  ).then((module) => ({
    default: module.TransactionsPage,
  })),
);

const PayrollPage = lazy(() =>
  import("@/modules/erp/accounts/payroll/payroll-page").then((module) => ({
    default: module.PayrollPage,
  })),
);

const FixedCostsPage = lazy(() =>
  import(
    "@/modules/erp/accounts/fixed-costs/fixed-costs-page"
  ).then((module) => ({
    default: module.FixedCostsPage,
  })),
);

const PartiesPage = lazy(() =>
  import("@/modules/erp/accounts/parties/parties-page").then((module) => ({
    default: module.PartiesPage,
  })),
);

const InvoicesPage = lazy(() =>
  import("@/modules/erp/accounts/invoices/invoices-page").then((module) => ({
    default: module.InvoicesPage,
  })),
);

const AssetsPage = lazy(() =>
  import("@/modules/erp/accounts/assets/assets-page").then((module) => ({
    default: module.AssetsPage,
  })),
);

const ReceivablesPage = lazy(() =>
  import(
    "@/modules/erp/accounts/receivables/receivables-page"
  ).then((module) => ({
    default: module.ReceivablesPage,
  })),
);

const InvestmentsPage = lazy(() =>
  import(
    "@/modules/erp/accounts/assets/investments/investments-page"
  ).then((module) => ({
    default: module.InvestmentsPage,
  })),
);

const VisaInventoryPage = lazy(() =>
  import(
    "@/modules/erp/accounts/assets/visa-inventory/visa-inventory-page"
  ).then((module) => ({
    default: module.VisaInventoryPage,
  })),
);

// Other ERP
const FinancePage = lazy(() =>
  import("@/modules/erp/finance/components/finance-page").then((module) => ({
    default: module.FinancePage,
  })),
);

const TasksPage = lazy(() =>
  import("@/modules/erp/tasks/components/tasks-page").then((module) => ({
    default: module.TasksPage,
  })),
);

const SettingsPage = lazy(() =>
  import("@/modules/erp/settings/settings-page").then((module) => ({
    default: module.SettingsPage,
  })),
);

// -----------------------------------------------------------------------------
// Loading UI
// -----------------------------------------------------------------------------

function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* ============================== PUBLIC ============================== */}

          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />

          {/* ============================== AUTH ============================== */}

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
  path="/accept-invite"
  element={
    <AcceptInvitationPage />
  }
/>

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />

          <Route
            path="/download"
            element={<DownloadPage />}
          />

          {/* ============================== PROTECTED ERP ============================== */}

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<ErpLayout />}>
              {/* /app → /app/dashboard */}
              <Route
                index
                element={<Navigate to="dashboard" replace />}
              />

              {/* Dashboard */}
              <Route
                path="dashboard"
                element={<DashboardPage />}
              />

              {/* Candidates */}
              <Route
                path="candidates"
                element={<CandidatesPage />}
              />

              <Route
                path="candidates/:candidateId"
                element={<CandidateProfilePage />}
              />

              {/* Agents */}
              <Route
                path="agents"
                element={<AgentsPage />}
              />
                <Route
  path="agents/:agentId"
  element={<AgentProfilePage />}
/>
              {/* Agencies */}
              <Route
                path="agencies"
                element={<AgencyPage />}
              />
<Route
  path="agencies/:agencyId"
  element={<AgencyProfilePage />}
/>
              {/* Files */}
              <Route
                path="files"
                element={<FilesPage />}
              />

              {/* Medical */}
              <Route
                path="medical"
                element={<MedicalPage />}
              />

              {/* Mofa */}
              <Route
                path="mofa"
                element={<MofaPage />}
              />

              {/* Fingerprint */}
              <Route
                path="fingers"
                element={<FingerPage />}
              />

              {/* Police Clearance */}
              <Route
                path="police-clearance"
                element={<PoliceClearancePage />}
              />

              {/* Takamul */}
              <Route
                path="takamul"
                element={<TradeTestPage />}
              />

              {/* Visa */}
              <Route
                path="visa"
                element={<VisaPage />}
              />

              {/* BMET */}
              <Route
                path="bmet"
                element={<BmetPage />}
              />

              {/* Flight */}
              <Route
                path="flight"
                element={<FlightPage />}
              />

              {/* Reports */}
              <Route
                path="reports"
                element={<ReportsPage />}
              />

              {/* Reports → Document Templates */}
              <Route
                path="reports/templates/:templateId"
                element={<TemplateBuilderPage />}
              />

              <Route
                path="reports/templates/:templateId/use"
                element={<TemplateUsePage />}
              />

              {/* Accounts */}
              <Route
                path="accounts"
                element={<AccountsPage />}
              />

              <Route
                path="accounts/sales"
                element={<SalesPage />}
              />

              <Route
                path="accounts/transactions"
                element={<TransactionsPage />}
              />

              <Route
                path="accounts/payroll"
                element={<PayrollPage />}
              />

              <Route
                path="accounts/fixed-costs"
                element={<FixedCostsPage />}
              />

              <Route
                path="accounts/invoices"
                element={<InvoicesPage />}
              />

              <Route
                path="accounts/parties"
                element={<PartiesPage />}
              />

              <Route
                path="accounts/assets"
                element={<AssetsPage />}
              />

              <Route
                path="accounts/receivables"
                element={<ReceivablesPage />}
              />

              <Route
                path="accounts/assets/investments"
                element={<InvestmentsPage />}
              />

              <Route
                path="accounts/assets/visa-inventory"
                element={<VisaInventoryPage />}
              />

              <Route
                path="accounts/payables"
                element={<PayablesPage />}
              />

              {/* Finance */}
              <Route
                path="finance"
                element={<FinancePage />}
              />

              {/* Tasks / Todo */}
              <Route
                path="todo"
                element={<TasksPage />}
              />

              {/* Settings */}
              <Route
                path="settings"
                element={<SettingsPage />}
              />

              {/* Trash */}
              <Route
                path="trash"
                element={<TrashPage />}
              />
            </Route>
          </Route>

          {/* ============================== 404 ============================== */}

          <Route
            path="*"
            element={<div>Not Found</div>}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export { AppRouter };