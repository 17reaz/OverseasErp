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
import { GlobalDocumentWorkspace } from "@/modules/erp/ocr/new/global-document/GlobalDocumentWorkspace";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PwaUpdatePrompt />
        <AppRouter />
        <GlobalDocumentWorkspace />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;