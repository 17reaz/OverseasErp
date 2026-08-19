import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  FileCheck2,
} from "lucide-react";
import { SITE_ROUTES } from "../components/site-routes";

const PIPELINE_STAGES = [
  { label: "Registration", status: "done" as const },
  { label: "Medical", status: "done" as const },
  { label: "MOFA Attestation", status: "current" as const },
  { label: "Visa Stamping", status: "pending" as const },
  { label: "Flight Booking", status: "pending" as const },
  { label: "Deployment", status: "pending" as const },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        {/* Copy */}
        <div>
          <Badge
            variant="secondary"
            className="mb-5 rounded-full px-3 py-1 text-xs font-medium"
          >
            Built for overseas recruitment agencies
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Run your entire recruitment operation from one system.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            OverseasERP tracks every candidate from registration through
            medical, MOFA attestation, visa stamping, and flight deployment —
            so your agents, coordinators, and back office always know exactly
            where each case stands.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to={SITE_ROUTES.SIGNUP}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={SITE_ROUTES.LOGIN}>Login to your agency</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Already trusted by manpower agencies managing candidates across
            35+ destination countries.
          </p>
        </div>

        {/* Signature visual: live candidate pipeline card */}
        <div className="relative">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Candidate BD-4821
                </p>
                <p className="text-xs text-muted-foreground">
                  Md. Alamin Hossain · Riyadh, Saudi Arabia
                </p>
              </div>
              <Badge className="rounded-full">In Progress</Badge>
            </div>

            <ul className="divide-y divide-border">
              {PIPELINE_STAGES.map((stage) => (
                <li
                  key={stage.label}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    {stage.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    {stage.status === "current" && (
                      <Clock className="h-4 w-4 text-primary" />
                    )}
                    {stage.status === "pending" && (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={
                        stage.status === "pending"
                          ? "text-sm text-muted-foreground"
                          : "text-sm font-medium text-foreground"
                      }
                    >
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {stage.status === "done" && "Completed"}
                    {stage.status === "current" && "In review"}
                    {stage.status === "pending" && "Pending"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3.5">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                4 of 6 documents verified · Passport, Medical Report attached
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
