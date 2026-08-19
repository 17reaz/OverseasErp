import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TESTIMONIALS = [
  {
    quote:
      "We used to track MOFA attestation status in spreadsheets across three offices. OverseasERP put every candidate's status in one place our whole team can see.",
    name: "Rashed Karim",
    role: "Managing Director, Trans Global Manpower",
    initials: "RK",
  },
  {
    quote:
      "Our agents can see exactly which candidates are stuck at medical or visa stage without calling the back office. It's cut our follow-up time significantly.",
    name: "Fatima Noor",
    role: "Operations Head, Al-Amin Overseas",
    initials: "FN",
  },
  {
    quote:
      "Deployment reporting used to take our team days to compile. Now it's ready as soon as the last candidate on a flight is marked deployed.",
    name: "Imran Hossain",
    role: "CEO, Prime Manpower Services",
    initials: "IH",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trusted by agencies managing real deployments
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Recruitment agencies use OverseasERP to keep candidates, agents,
            and documentation aligned across every destination country.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <Card key={item.name} className="border-border shadow-none">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-foreground">
                  “{item.quote}”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {item.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
