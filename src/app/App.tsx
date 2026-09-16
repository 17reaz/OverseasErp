import {
  AuthProvider,
} from "@/modules/auth/components/auth-provider";

import {
  ToastProvider,
} from "@/components/shared/toast/toast-provider";

import {
  AppRouter,
} from "./router";
import { PwaUpdatePrompt } from "@/components/shared/pwa/pwa-update-prompt";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PwaUpdatePrompt />
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;