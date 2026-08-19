import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SITE_ROUTES } from "../components/site-routes";

export function CtaSection() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-xl border border-border bg-card px-8 py-12 text-center shadow-sm sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Bring your recruitment pipeline into one system
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Set up your agency, invite your agents, and start tracking
            candidates from registration to deployment today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to={SITE_ROUTES.SIGNUP}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={SITE_ROUTES.LOGIN}>Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
