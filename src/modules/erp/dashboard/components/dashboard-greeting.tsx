import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

interface GreetingMessage {
  title: string;
  description: string;
}

const MESSAGES: GreetingMessage[] = [
  {
    title: "Welcome back",
    description: "Keep your candidate pipeline moving forward.",
  },
  {
    title: "Let's get things done",
    description: "Stay focused on the operations that matter today.",
  },
  {
    title: "Small progress, big results",
    description: "Every completed stage moves your business forward.",
  },
  {
    title: "Your dashboard is ready",
    description: "Everything you need to monitor today's operations is here.",
  },
  {
    title: "Keep things moving",
    description: "Stay ahead of deadlines and keep your candidates progressing.",
  },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";

  return "Good Evening";
}

function getUserName(): string {
  try {
    const raw = localStorage.getItem("supabase.auth.token");

    if (!raw) return "there";

    const parsed = JSON.parse(raw);

    const name =
      parsed?.user?.user_metadata?.full_name ??
      parsed?.user?.user_metadata?.name;

    if (typeof name === "string" && name.trim()) {
      return name.trim().split(" ")[0];
    }
  } catch {
    // Ignore local storage parsing errors.
  }

  return "there";
}

export function DashboardGreeting() {
  const [messageIndex, setMessageIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const greeting = useMemo(() => getTimeGreeting(), []);
  const userName = useMemo(() => getUserName(), []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const message = MESSAGES[messageIndex];

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex h-12 min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-xl border bg-card px-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Sparkles className="size-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={messageIndex}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="hidden shrink-0 rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              {greeting}
            </span>

            <h1 className="shrink-0 text-sm font-semibold tracking-tight">
              {message.title}, <span className="text-primary">{userName}</span>
            </h1>

            <p className="hidden min-w-0 truncate text-xs text-muted-foreground xl:block">
              {message.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}