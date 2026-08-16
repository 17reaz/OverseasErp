import { AuthProvider } from "@/modules/auth/components/auth-provider";
import { AppRouter } from "./router";

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;