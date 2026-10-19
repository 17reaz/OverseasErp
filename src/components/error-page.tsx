import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronDown,
  Copy,
  Home,
  PhoneCall,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPPORT_PHONE = "+8801839869859"; // <- apnar number
const SUPPORT_PHONE_DISPLAY = "+880 1839869859";

interface ErrorPageProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function ErrorPage({ error, onRetry }: ErrorPageProps) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(SUPPORT_PHONE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Soft themed glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-destructive/15 blur-3xl" />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-sm"
      >
        {/* Header */}
        <div className="border-b bg-gradient-to-b from-destructive/10 to-transparent px-6 pb-7 pt-9 text-center">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.1 }}
            className="relative mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm ring-4 ring-destructive/10"
          >
            <TriangleAlert className="size-7 text-destructive" />
            {!reduceMotion && (
              <motion.span
                className="absolute inset-0 rounded-2xl ring-2 ring-destructive/40"
                animate={{ opacity: [0.6, 0], scale: [1, 1.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </motion.div>

          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1">
            Unexpected error
          </Badge>

          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The software ran into a problem. Please call us and we will help you
            right away.
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            দুঃখিত, সফটওয়্যারে একটি সমস্যা হয়েছে। অনুগ্রহ করে আমাদের কল করুন।
          </p>
        </div>

        {/* Call block */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3 px-6 py-6"
        >
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Support number</p>
              <p className="truncate text-lg font-semibold tabular-nums tracking-tight">
                {SUPPORT_PHONE_DISPLAY}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyPhone}
              aria-label="Copy phone number"
              className="shrink-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? "check" : "copy"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex"
                >
                  {copied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button asChild size="lg" className="w-full gap-2">
              <a href={`tel:${SUPPORT_PHONE}`}>
                <PhoneCall className="size-4" />
                Call Support
              </a>
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={onRetry ?? (() => window.location.reload())}
            >
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = "/")}
            >
              <Home className="size-4" />
              Go home
            </Button>
          </div>
        </motion.div>

        {/* Technical details (helpful when you ask the user to read the error over the phone) */}
        {error && (
          <div className="border-t bg-muted/30 px-6 py-3">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Technical details
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  showDetails && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <pre className="mt-3 max-h-32 overflow-auto rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                    {error.name}: {error.message}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}