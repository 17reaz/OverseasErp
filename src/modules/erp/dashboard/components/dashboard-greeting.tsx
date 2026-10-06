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
    }, 5500);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const message = MESSAGES[messageIndex];

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative flex h-12 min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-xl border bg-card px-3"
    >
      {/* Decorative glow */}
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
      />

      {/* Icon */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <motion.span
          animate={reduceMotion ? undefined : { rotate: [0, 15, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.span>
      </div>

      {/* Content */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="hidden shrink-0 rounded-full border bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              {greeting}
            </span>

            <h1 className="shrink-0 text-sm font-semibold tracking-tight">
              {message.title},{" "}
              <span className="text-primary">{userName}</span>{" "}
              <motion.span
                className="inline-block origin-[70%_70%]"
                animate={
                  reduceMotion ? undefined : { rotate: [0, 14, -8, 14, 0] }
                }
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </h1>

            <p className="hidden min-w-0 truncate text-xs text-muted-foreground xl:block">
              {message.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Animated bottom progress */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-border"
      >
        <motion.div
          className="h-full w-1/4 bg-primary/50"
          initial={{ x: "-100%" }}
          animate={reduceMotion ? { x: "0%" } : { x: "500%" }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.section>
  );
}