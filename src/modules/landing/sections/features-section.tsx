import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Handshake,
  Stethoscope,
  Stamp,
  FolderLock,
  FileCheck2,
  Plane,
  BarChart3,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Candidate Management",
    description:
      "Register candidates, track profiles, and follow every case through each recruitment stage from a single dashboard.",
  },
  {
    icon: Handshake,
    title: "Agent Network",
    description:
      "Onboard sourcing agents, assign candidates, and monitor commission and performance across your agent network.",
  },
  {
    icon: Stethoscope,
    title: "Medical Tracking",
    description:
      "Record medical center results and fitness status, and flag unfit or pending cases before they reach visa stage.",
  },
  {
    icon: Stamp,
    title: "MOFA Attestation",
    description:
      "Track document attestation status with the Ministry of Foreign Affairs and embassies without leaving the system.",
  },
  {
    icon: FolderLock,
    title: "Document Vault",
    description:
      "Store passports, contracts, and certificates in one secure, searchable vault linked to each candidate record.",
  },
  {
    icon: FileCheck2,
    title: "Visa Processing",
    description:
      "Monitor visa stamping status by embassy and destination country, with alerts for approaching deadlines.",
  },
  {
    icon: Plane,
    title: "Flight & Deployment",
    description:
      "Manage ticketing, deployment schedules, and manpower reporting for candidates ready to travel.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Review agency performance, conversion rates, and SLA compliance with reports built for recruitment operations.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything an overseas recruitment agency runs on
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Purpose-built modules that follow the way your agency actually
            works — from first registration to final deployment.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border-border shadow-none transition-colors hover:border-foreground/20"
            >
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="mt-3 text-base font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
