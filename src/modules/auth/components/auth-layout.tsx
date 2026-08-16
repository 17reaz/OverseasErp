import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen">
      <header>
        <h1>Overseas ERP</h1>
      </header>

      <main>{children}</main>

      <footer>
        <p>© Overseas ERP</p>
      </footer>
    </div>
  );
}