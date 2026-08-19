import {
  AuthProvider,
} from "@/modules/auth/components/auth-provider";

import {
  ToastProvider,
} from "@/components/shared/toast/toast-provider";

import {
  AppRouter,
} from "./router";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;