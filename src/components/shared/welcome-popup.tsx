import { useEffect, useState } from "react";
import { ArrowRight, Globe2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WELCOME_SEEN_KEY = "overseaserp_welcome_seen_v1";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELCOME_SEEN_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function closeWelcome() {
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      // Storage unavailable; allow the popup to close anyway.
    }

    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeWelcome();
      }}
    >
      <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-lg">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 pb-8 pt-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-7 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Globe2 className="h-5 w-5" />
              </div>

              <span className="text-sm font-semibold tracking-wide text-blue-100">
                OVERSEAS ERP
              </span>

              <Sparkles className="ml-auto h-5 w-5 text-amber-300" />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              Welcome aboard
            </div>

            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Welcome to
                <br />
                OverseasErp!
              </DialogTitle>

              <DialogDescription className="max-w-sm text-sm leading-6 text-blue-100/90 sm:text-base">
                Your work, your team, your journey — all in one place.
                Let’s make every step simpler.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={closeWelcome}
                className="h-11 gap-2 bg-white text-slate-950 hover:bg-blue-50"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={closeWelcome}
                className="h-11 text-white hover:bg-white/10 hover:text-white"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
