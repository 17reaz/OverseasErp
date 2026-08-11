import { AuthProvider } from '@/features/auth/auth-provider'
import { ProfileProvider } from '@/features/auth/profile-context'

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        {/* routes */}
      </ProfileProvider>
    </AuthProvider>
  )
}

export default App