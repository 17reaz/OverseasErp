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
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0">
        <h2 className="text-sm font-semibold leading-none">
          Operational Shortcuts
        </h2>

        <p className="mt-1 text-[11px] text-muted-foreground">
          Jump to frequently used modules
        </p>
      </div>

      <ul className="min-h-0 flex-1 divide-y overflow-auto rounded-md border">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.path}>
              <button
                type="button"
                onClick={() => navigate(item.path)}
                className="group flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium leading-tight">
                    {item.label}
                  </p>

                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <span className="text-sm text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}