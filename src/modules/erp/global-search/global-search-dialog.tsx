import { useEffect, useState } from "react";
import {
  ArrowRight,
  CornerDownLeft,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { globalSearch } from "./global-search-service";
import type { GlobalSearchResult } from "./global-search-types";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasQuery = query.trim().length > 0;

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setError(null);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    // Show loading immediately (not after the debounce), so we never
    // flash "No candidates found" while waiting.
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const data = await globalSearch(cleanQuery);
        if (!cancelled) {
          setResults(data);
          setActiveIndex(0);
        }
      } catch (searchError) {
        console.error("Global search failed:", searchError);
        if (!cancelled) {
          setResults([]);
          setError("Unable to search. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  function selectResult(result: GlobalSearchResult) {
    onOpenChange(false);
    navigate(result.route);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || results.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
        break;
      case "Enter": {
        event.preventDefault();
        const result = results[activeIndex];
        if (result) selectResult(result);
        break;
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // showCloseButton={false}  // <- newer shadcn hole eta uncomment korun, tokhon [&>button]:hidden lagbe na
        className="top-[18%] translate-y-0 gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:max-w-[560px] [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Search candidates</DialogTitle>

        {/* Search input */}
        <div className="flex h-12 items-center gap-3 pl-4 pr-2.5">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}

          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search candidates..."
            className="h-8 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />

          <div className="flex shrink-0 items-center gap-1.5">
            <kbd className="hidden rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
              ESC
            </kbd>

            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Results */}
        {hasQuery && (
          <div className="border-t">
            {error ? (
              <p className="px-5 py-5 text-xs text-destructive">{error}</p>
            ) : results.length > 0 ? (
              <>
                {/* Old results stay visible while a new search loads */}
                <ul
                  className={cn(
                    "max-h-[320px] overflow-y-auto p-2 transition-opacity",
                    loading && "opacity-60",
                  )}
                >
                  {results.map((result, index) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        ref={
                          index === activeIndex
                            ? (el) => el?.scrollIntoView({ block: "nearest" })
                            : undefined
                        }
                        onClick={() => selectResult(result)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none",
                          index === activeIndex && "bg-muted",
                        )}
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-border">
                          <UserRound className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {result.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                            {result.description && (
                              <>
                                <span className="mx-1.5">·</span>
                                {result.description}
                              </>
                            )}
                          </p>
                        </div>

                        <ArrowRight
                          className={cn(
                            "size-3.5 shrink-0 text-muted-foreground transition-opacity",
                            index === activeIndex ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="hidden items-center gap-3 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground sm:flex">
                  <span>↑ ↓ navigate</span>
                  <span className="inline-flex items-center gap-1">
                    <CornerDownLeft className="size-3" /> open
                  </span>
                </div>
              </>
            ) : loading ? (
              <p className="px-5 py-5 text-xs text-muted-foreground">
                Searching...
              </p>
            ) : (
              <p className="px-5 py-6 text-center text-xs text-muted-foreground">
                No candidates found
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}