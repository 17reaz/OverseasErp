import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Auth
import { ProtectedRoute } from "@/modules/auth/components/protected-route";
import { PublicRoute } from "@/modules/auth/components/public-route";
import { LoginPage } from "@/modules/auth/login/login-page";
import { SignupPage } from "@/modules/auth/signup/signup-page";
import { ForgotPasswordPage } from "@/modules/auth/forgot-password/forgot-password-page";
import { ResetPasswordPage } from "@/modules/auth/reset-password/reset-password-page";

// Landing
import { LandingPage } from "@/modules/landing/landing-page";

// ERP Layout
import { ErpLayout } from "@/modules/erp/layout/erp-layout";

// ERP Pages
import { DashboardPage } from "@/modules/erp/dashboard/dashboard-page";
import { CandidatesPage } from "@/modules/erp/candidates/candidates-page";
import { CandidateProfilePage } from "@/modules/erp/candidates/profile/candidate-profile-page";
import { TrashPage } from "@/modules/erp/trash/trash-page";
import { AgentsPage } from "@/modules/erp/agents/agents-page";
import { FilesPage } from "@/modules/erp/files/files-page";
import { MedicalPage } from "@/modules/erp/medical/medical-page";
import { AgencyPage } from "@/modules/erp/agency/agency-page";
import { MofaPage } from "@/modules/erp/mofa/mofa-page";
import { FingerPage } from "@/modules/erp/finger/finger-page";
import { PoliceClearancePage } from "@/modules/erp/police-clearance/police-clearance-page";
import { TradeTestPage } from "@/modules/erp/takamul/takamul-page";
import { VisaPage } from "@/modules/erp/visa/visa-page";
import { BmetPage } from "@/modules/erp/bmet/bmet-page";
import { FlightPage } from "@/modules/erp/flight/flight-page";
import { ReportsPage } from "@/modules/erp/reports/reports-page";
import { FinancePage } from "@/modules/erp/finance/components/finance-page";
import { TasksPage } from "@/modules/erp/tasks/components/tasks-page";
import { SettingsPage } from "@/modules/erp/settings/settings-page";

function AppRouter() {
  return (
    <BrowserRouter>
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

        {/* ============================== PROTECTED ERP ============================== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<ErpLayout />}>
            {/* /app → /app/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* Dashboard */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Candidates */}
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/:candidateId" element={<CandidateProfilePage />} />

            {/* Agents */}
            <Route path="agents" element={<AgentsPage />} />

            {/* Agencies */}
            <Route path="agencies" element={<AgencyPage />} />

            {/* Files */}
            <Route path="files" element={<FilesPage />} />

            {/* Medical */}
            <Route path="medical" element={<MedicalPage />} />

            {/* Mofa */}
            <Route path="mofa" element={<MofaPage />} />

            {/* Fingerprint */}
            <Route path="fingers" element={<FingerPage />} />

            {/* Police Clearance */}
            <Route path="police-clearance" element={<PoliceClearancePage />} />

            {/* Takamul */}
            <Route path="takamul" element={<TradeTestPage />} />

            {/* Visa */}
            <Route path="visa" element={<VisaPage />} />

            {/* BMET */}
            <Route path="bmet" element={<BmetPage />} />

            {/* Flight */}
            <Route path="flight" element={<FlightPage />} />

            {/* Reports */}
            <Route path="reports" element={<ReportsPage />} />

            {/* Finance */}
            <Route path="finance" element={<FinancePage />} />

            {/* Tasks / Todo */}
            <Route path="todo" element={<TasksPage />} />

            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />

            {/* Trash */}
            <Route path="trash" element={<TrashPage />} />
          </Route>
        </Route>

        {/* ============================== 404 ============================== */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export { AppRouter };