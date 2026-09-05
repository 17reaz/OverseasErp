
import { lazy, Suspense } from "react";

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
  PublicRoute,
} from "@/modules/auth/components/public-route";

const LandingPage = lazy(() =>
  import("@/modules/landing/landing-page").then((module) => ({
    default: module.LandingPage,
  })),
);
const LoginPage = lazy(() =>
  import("@/modules/auth/login/login-page").then((module) => ({
    default: module.LoginPage,
  })),
);
const SignupPage = lazy(() =>
  import("@/modules/auth/signup/signup-page").then((module) => ({
    default: module.SignupPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/modules/auth/forgot-password/forgot-password-page").then(
    (module) => ({ default: module.ForgotPasswordPage }),
  ),
);
const ResetPasswordPage = lazy(() =>
  import("@/modules/auth/reset-password/reset-password-page").then(
    (module) => ({ default: module.ResetPasswordPage }),
  ),
);
const ErpLayout = lazy(() =>
  import("@/modules/erp/layout/erp-layout").then((module) => ({
    default: module.ErpLayout,
  })),
);
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
    (module) => ({ default: module.CandidateProfilePage }),
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
  import("@/modules/erp/police-clearance/police-clearance-page").then(
    (module) => ({ default: module.PoliceClearancePage }),
  ),
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
const FlightPage = lazy(() =>
  import("@/modules/erp/flight/flight-page").then((module) => ({
    default: module.FlightPage,
  })),
);
const ReportsPage = lazy(() =>
  import("@/modules/erp/reports/reports-page").then((module) => ({
    default: module.ReportsPage,
  })),
);

function RouteLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>

        {/* ==================================================
            PUBLIC
            ================================================== */}

        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        {/* ==================================================
            AUTH
            ================================================== */}

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
                finance
                ================================================== */}

            <Route
              path="reports"
              element={<ReportsPage />}
            />
            {/* ==================================================
                REPORTS
                ================================================== */}

            <Route
              path="finance"
              element={<>finance</>}
            />
            {/* ==================================================
                REPORTS
                ================================================== */}

            <Route
              path="todo"
              element={<>Todo</>}
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
      </Suspense>
    </BrowserRouter>
  );
}

export {
  AppRouter,
};