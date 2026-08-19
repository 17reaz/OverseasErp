import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe2 } from "lucide-react";
import { SITE_ROUTES } from "../components/site-routes";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Testimonials", href: "#testimonials" },
] as const;

export function NavbarSection() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Globe2 className="h-4.5 w-4.5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            OverseasERP
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to={SITE_ROUTES.LOGIN}>Login</Link>
          </Button>
          <Button asChild>
            <Link to={SITE_ROUTES.SIGNUP}>Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
