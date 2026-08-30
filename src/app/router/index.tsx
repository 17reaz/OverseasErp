import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  ProtectedRoute,
} from "@/modules/auth/components/protected-route";

import {
  LandingPage,
} from "@/modules/landing/landing-page";

import {
  LoginPage,
} from "@/modules/auth/login/login-page";

import {
  SignupPage,
} from "@/modules/auth/signup/signup-page";

import {
  ForgotPasswordPage,
} from "@/modules/auth/forgot-password/forgot-password-page";

import {
  ResetPasswordPage,
} from "@/modules/auth/reset-password/reset-password-page";

import {
  ErpLayout,
} from "@/modules/erp/layout/erp-layout";

import {
  DashboardPage,
} from "@/modules/erp/dashboard/dashboard-page";

import {
  CandidatesPage,
} from "@/modules/erp/candidates/candidates-page";

import {
  CandidateProfilePage,
} from "@/modules/erp/candidates/profile/candidate-profile-page";

import {
  TrashPage,
} from "@/modules/erp/trash/trash-page";

import {
  AgentsPage,
} from "@/modules/erp/agents/agents-page";

import {
  FilesPage,
} from "@/modules/erp/files/files-page";

import {
  MedicalPage,
} from "@/modules/erp/medical/medical-page";

import {
  AgencyPage,
} from "@/modules/erp/agency/agency-page";

import {
  MofaPage,
} from "@/modules/erp/mofa/mofa-page";

import {
  FingerPage,
} from "@/modules/erp/finger/finger-page";

import {
  PoliceClearancePage,
} from "@/modules/erp/police-clearance/police-clearance-page";

import {
  TradeTestPage,
} from "@/modules/erp/takamul/takamul-page";

import {
  VisaPage,
} from "@/modules/erp/visa/visa-page";

import {
  FlightPage,
} from "@/modules/erp/flight/flight-page";

import {
  ReportsPage,
} from "@/modules/erp/reports/reports-page";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            LANDING
            ================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* ==================================================
            AUTH
            ================================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* ==================================================
            PROTECTED ERP
            ================================================== */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/app"
            element={<ErpLayout />}
          >
            {/* /app → /app/dashboard */}

            <Route
              index
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />

            {/* ==================================================
                DASHBOARD
                ================================================== */}

            <Route
              path="dashboard"
              element={<DashboardPage />}
            />

            {/* ==================================================
                CANDIDATES
                ================================================== */}

            <Route
              path="candidates"
              element={<CandidatesPage />}
            />

            <Route
              path="candidates/:candidateId"
              element={<CandidateProfilePage />}
            />

            {/* ==================================================
                AGENTS
                ================================================== */}

            <Route
              path="agents"
              element={<AgentsPage />}
            />

            {/* ==================================================
                AGENCY
                ================================================== */}

            <Route
              path="agencies"
              element={<AgencyPage />}
            />

            {/* ==================================================
                FILES
                ================================================== */}

            <Route
              path="files"
              element={<FilesPage />}
            />

            {/* ==================================================
                MEDICAL
                ================================================== */}

            <Route
              path="medical"
              element={<MedicalPage />}
            />

            {/* ==================================================
                MOFA
                ================================================== */}

            <Route
              path="mofa"
              element={<MofaPage />}
            />

            {/* ==================================================
                FINGER
                ================================================== */}

            <Route
              path="fingers"
              element={<FingerPage />}
            />

            {/* ==================================================
                POLICE CLEARANCE
                ================================================== */}

            <Route
              path="police-clearance"
              element={<PoliceClearancePage />}
            />

            {/* ==================================================
                TAKAMUL
                ================================================== */}

            <Route
              path="takamul"
              element={<TradeTestPage />}
            />

            {/* ==================================================
                VISA
                ================================================== */}

            <Route
              path="visa"
              element={<VisaPage />}
            />

            {/* ==================================================
                FLIGHT
                ================================================== */}

            <Route
              path="flight"
              element={<FlightPage />}
            />

            {/* ==================================================
                REPORTS
                ================================================== */}

            <Route
              path="reports"
              element={<ReportsPage />}
            />

            {/* ==================================================
                TRASH
                ================================================== */}

            <Route
              path="trash"
              element={<TrashPage />}
            />

          </Route>

        </Route>

        {/* ==================================================
            404
            ================================================== */}

        <Route
          path="*"
          element={
            <div>
              Not Found
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export {
  AppRouter,
};