
import { Link } from "react-router-dom";

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-semibold">
        Overseas ERP
      </h1>

      <Link
        to="/login"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Login
      </Link>
    </header>
  );
}