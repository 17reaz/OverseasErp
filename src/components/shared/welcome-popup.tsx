import { useEffect, useState } from "react";
import { ArrowRight, Globe2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
      // Storage unavailable; still allow the popup to close.
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeWelcome()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Soft themed backdrop */}
        <div className="relative border-b bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 pb-8 pt-10 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm ring-4 ring-primary/10">
            <Globe2 className="h-7 w-7 text-primary" />
          </div>

          <Badge variant="secondary" className="relative mb-4 gap-1.5 rounded-full px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Welcome aboard
          </Badge>

          <DialogHeader className="relative space-y-2 sm:text-center">
            <DialogTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome to OverseasErp
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-xs text-sm leading-relaxed">
              Your work, your team, your journey — all in one place. Let’s make
              every step simpler.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex-col gap-2 bg-muted/30 px-6 py-4 sm:flex-col sm:space-x-0">
          <Button size="lg" onClick={closeWelcome} className="w-full gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={closeWelcome} className="w-full text-muted-foreground">
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}