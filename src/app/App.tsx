import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/routes'
import { AuthProvider } from '@/features/auth/auth-provider'
import { ProfileProvider } from '@/features/auth/profile-context'

export function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
    </AuthProvider>
  )
}

export default App
