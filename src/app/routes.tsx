import { Navigate, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/features/auth/protected-route'
import { LoginPage } from '@/features/auth/login-page'
import { SignupPage } from '@/features/auth/signup-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { CandidatesPage } from '@/pages/candidates/candidates-page'
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },

  {
    path: '/signup',
    element: <SignupPage />,
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
    ],
  },
  {
  path: '/candidates',
  element: <CandidatesPage />,
},
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])