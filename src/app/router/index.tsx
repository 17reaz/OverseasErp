import {
  BrowserRouter,
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
} from "@/modules/erp/candidates/candidate-profile";

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

          {/* ERP ROOT */}

          <Route
            path="/app"
            element={<ErpLayout />}
          >

            {/* /app */}

            <Route
              index
              element={<DashboardPage />}
            />


            {/* /app/dashboard */}

            <Route
              path="dashboard"
              element={<DashboardPage />}
            />


            {/* ==================================================
                CANDIDATES
                ================================================== */}

            {/* /app/candidates */}

            <Route
              path="candidates"
              element={<CandidatesPage />}
            />


            {/* /app/candidates/:candidateId */}

            <Route
              path="candidates/:candidateId"
              element={<CandidateProfilePage />}
            />


            {/* ==================================================
                AGENTS
                ================================================== */}

            {/* /app/agents */}

            <Route
              path="agents"
              element={<AgentsPage />}
            />


            {/* ==================================================
                FILES
                ================================================== */}

            {/* /app/files */}

            <Route
              path="files"
              element={<FilesPage />}
            />


            {/* ==================================================
                MEDICAL
                ================================================== */}

            {/* /app/medical */}

            <Route
              path="medical"
              element={<MedicalPage />}
            />


            {/* ==================================================
                OTHER ERP MODULES
                ================================================== */}

            <Route
              path="mofa"
              element={<div>MOFA</div>}
            />

            <Route
              path="visa"
              element={<div>Visa</div>}
            />

            <Route
              path="flight"
              element={<div>Flight</div>}
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
          element={<div>Not Found</div>}
        />

      </Routes>
    </BrowserRouter>
  );
}


export {
  AppRouter,
};