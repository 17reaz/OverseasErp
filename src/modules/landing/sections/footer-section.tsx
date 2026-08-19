import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Globe2 } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Workflow", href: "#workflow" },
      { label: "Testimonials", href: "#testimonials" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
] as const;

export function FooterSection() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Globe2 className="h-4.5 w-4.5" />
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">
                OverseasERP
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The operations system for overseas recruitment agencies —
              candidates, agents, medical, MOFA, visa, and deployment in one
              place.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OverseasERP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
