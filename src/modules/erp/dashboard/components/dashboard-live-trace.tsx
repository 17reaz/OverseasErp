import {
  ArrowRight,
  Ban,
  CheckCircle2,
  CircleDot,
  PauseCircle,
  RefreshCw,
  UserPlus,
} from "lucide-react";

interface LiveTraceEvent {
  id: string;
  type:
    | "stage_changed"
    | "created"
    | "completed"
    | "returned"
    | "cancelled"
    | "hold";

  candidateName: string;
  sl: number | null;

  fromStage?: string;
  toStage?: string;

  title: string;
  description?: string;

  createdAt: string;
}

const DUMMY_EVENTS: LiveTraceEvent[] = [
  {
    id: "trace-1",
    type: "stage_changed",
    candidateName: "Rahim Ahmed",
    sl: 1024,
    fromStage: "Visa",
    toStage: "Flight",
    title: "Flight scheduled",
    description: "Candidate moved from Visa to Flight",
    createdAt: "12:42 PM",
  },
  {
    id: "trace-2",
    type: "stage_changed",
    candidateName: "Karim Hasan",
    sl: 1018,
    fromStage: "MOFA",
    toStage: "Visa",
    title: "Visa processing started",
    description: "Candidate moved from MOFA to Visa",
    createdAt: "12:39 PM",
  },
  {
    id: "trace-3",
    type: "cancelled",
    candidateName: "Abdul Karim",
    sl: 1009,
    title: "Candidate cancelled",
    description: "Medical issue",
    createdAt: "12:35 PM",
  },
  {
    id: "trace-4",
    type: "stage_changed",
    candidateName: "Sakib Hasan",
    sl: 1012,
    fromStage: "Medical",
    toStage: "MOFA",
    title: "MOFA processing started",
    description: "Medical stage completed",
    createdAt: "12:31 PM",
  },
  {
    id: "trace-5",
    type: "hold",
    candidateName: "Rasel Mia",
    sl: 1007,
    title: "Candidate placed on hold",
    description: "Passport issue",
    createdAt: "12:26 PM",
  },
  {
    id: "trace-6",
    type: "completed",
    candidateName: "Nayeem Islam",
    sl: 998,
    title: "Candidate completed",
    description: "Iqama process completed",
    createdAt: "12:18 PM",
  },
  {
    id: "trace-7",
    type: "created",
    candidateName: "Mehedi Hasan",
    sl: 1031,
    title: "New candidate added",
    description: "Candidate entered the system",
    createdAt: "12:11 PM",
  },
];

function getEventIcon(type: LiveTraceEvent["type"]) {
  switch (type) {
    case "stage_changed":
      return RefreshCw;

    case "created":
      return UserPlus;

    case "completed":
      return CheckCircle2;

    case "returned":
      return ArrowRight;

    case "cancelled":
      return Ban;

    case "hold":
      return PauseCircle;

    default:
      return CircleDot;
  }
}

function getEventIconClass(type: LiveTraceEvent["type"]) {
  switch (type) {
    case "completed":
      return "text-emerald-600 dark:text-emerald-400";

    case "cancelled":
      return "text-destructive";

    case "hold":
      return "text-amber-600 dark:text-amber-400";

    case "created":
      return "text-blue-600 dark:text-blue-400";

    default:
      return "text-muted-foreground";
  }
}

function getStageLabel(stage: string) {
  switch (stage) {
    case "Medical":
      return "Medical";

    case "MOFA":
      return "MOFA";

    case "Finger":
      return "Finger";

    case "Police Clearance":
      return "PCC";

    case "Takamul":
      return "Takamul";

    case "Visa":
      return "Visa";

    case "BMET":
      return "BMET";

    case "Flight":
      return "Flight";

    case "Iqama":
      return "Iqama";

    default:
      return stage;
  }
}

export function DashboardLiveTrace() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>

        <button
          type="button"
          className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </button>
      </div>

      {/* Log lines */}
      <ul className="min-h-0 flex-1 divide-y divide-border/50 overflow-auto font-mono text-[11px]">
        {DUMMY_EVENTS.map((event) => {
          const Icon = getEventIcon(event.type);

          return (
            <li
              key={event.id}
              title={event.description}
              className="flex h-7 items-center gap-2 px-1 transition-colors hover:bg-muted/40"
            >
              {/* Time */}
              <span className="w-[58px] shrink-0 text-muted-foreground">
                {event.createdAt}
              </span>

              {/* Icon */}
              <Icon
                className={`size-3 shrink-0 ${getEventIconClass(event.type)}`}
              />

              {/* SL */}
              <span className="w-10 shrink-0 text-muted-foreground">
                {event.sl !== null ? `#${event.sl}` : "—"}
              </span>

              {/* Name */}
              <span className="w-24 shrink-0 truncate font-medium">
                {event.candidateName}
              </span>

              {/* Message */}
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {event.title}
              </span>

              {/* Stage change badge */}
              {event.type === "stage_changed" &&
                event.fromStage &&
                event.toStage && (
                  <span className="hidden shrink-0 items-center gap-1 rounded border bg-muted/30 px-1.5 py-px sm:inline-flex">
                    <span className="text-muted-foreground">
                      {getStageLabel(event.fromStage)}
                    </span>

                    <ArrowRight className="size-2.5 text-muted-foreground" />

                    <span className="font-medium">
                      {getStageLabel(event.toStage)}
                    </span>
                  </span>
                )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}