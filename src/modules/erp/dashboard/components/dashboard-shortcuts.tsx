import {
  FileText,
  Fingerprint,
  Plane,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  {
    label: "Add Candidate",
    description: "Create a new candidate record",
    icon: UserPlus,
    path: "/app/candidates",
  },
  {
    label: "Medical Records",
    description: "Manage medical processing",
    icon: Stethoscope,
    path: "/app/medical",
  },
  {
    label: "MOFA Applications",
    description: "Manage MOFA applications",
    icon: ShieldCheck,
    path: "/app/mofa",
  },
  {
    label: "Takamul / Skill Test",
    description: "Manage skill test processing",
    icon: FileText,
    path: "/app/takamul",
  },
  {
    label: "Finger Records",
    description: "Manage fingerprint processing",
    icon: Fingerprint,
    path: "/app/fingers",
  },
  {
    label: "Flight Management",
    description: "Manage candidate flights",
    icon: Plane,
    path: "/app/flight",
  },
];

export function DashboardShortcuts() {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-background">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">
          Operational Shortcuts
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Quickly jump to frequently used modules
        </p>
      </div>

      <div className="divide-y">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {item.label}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <span className="text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}