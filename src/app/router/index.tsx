import { ProtectedRoute } from "@/modules/auth/components/protected-route";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { LandingPage } from "@/modules/landing/landing-page";

import { LoginPage } from "@/modules/auth/login/login-page";
import { SignupPage } from "@/modules/auth/signup/signup-page";
import { ForgotPasswordPage } from "@/modules/auth/forgot-password/forgot-password-page";
import { ResetPasswordPage } from "@/modules/auth/reset-password/reset-password-page";

import { ErpLayout } from "@/modules/erp/layout/erp-layout";
import { DashboardPage } from "@/modules/erp/dashboard/dashboard-page";
import { CandidatesPage } from "@/modules/erp/candidates/candidates-page";
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* ERP */}
        <Route element={<ProtectedRoute />}>

          <Route path="/app" element={<ErpLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="candidates" element={<CandidatesPage />}/>
            <Route path="medical" element={<div>Medical</div>} />
            <Route path="mofa" element={<div>MOFA</div>} />
            <Route path="visa" element={<div>Visa</div>} />
            <Route path="flight" element={<div>Flight</div>} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export { AppRouter };