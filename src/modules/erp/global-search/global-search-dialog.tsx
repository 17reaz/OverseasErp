import {
  useEffect,
  useState,
} from "react";

import {
  Search,
  UserRound,
  Loader2,
  ArrowRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import {
  Input,
} from "@/components/ui/input";

import {
  globalSearch,
} from "./global-search-service";

import type {
  GlobalSearchResult,
} from "./global-search-types";


interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {

  const navigate = useNavigate();

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<GlobalSearchResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  /* =======================================================
     RESET
  ======================================================= */

  useEffect(() => {

    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setError(null);
    }

  }, [open]);


  /* =======================================================
     SEARCH
  ======================================================= */

  useEffect(() => {

    if (!open) {
      return;
    }

    const cleanQuery =
      query.trim();

    if (!cleanQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(
      async () => {

        try {

          setLoading(true);
          setError(null);

          const data =
            await globalSearch(
              cleanQuery,
            );

          if (!cancelled) {
            setResults(data);
          }

        } catch (searchError) {

          console.error(
            "Global search failed:",
            searchError,
          );

          if (!cancelled) {
            setResults([]);
            setError(
              "Unable to search.",
            );
          }

        } finally {

          if (!cancelled) {
            setLoading(false);
          }

        }

      },
      250,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };

  }, [query, open]);


  /* =======================================================
     RESULT CLICK
  ======================================================= */

  function handleResultClick(
    result: GlobalSearchResult,
  ) {

    onOpenChange(false);

    navigate(result.route);
  }


  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {

    if (event.key === "Escape") {
      onOpenChange(false);
    }

  }


  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent
        className="
          top-[18%]
          translate-y-0
          gap-0
          overflow-hidden
          rounded-xl
          border
          bg-background
          p-0
          shadow-2xl
          sm:max-w-[560px]
        "
      >

        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
            px-4
            py-3
          "
        >

          <Search
            className="
              h-4
              w-4
              shrink-0
              text-muted-foreground
            "
          />

          <Input
            autoFocus
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            onKeyDown={handleKeyDown}
            placeholder="Search candidates..."
            className="
              h-8
              flex-1
              border-0
              bg-transparent
              p-0
              text-sm
              shadow-none
              outline-none
              focus-visible:ring-0
            "
          />

          <kbd
            className="
              hidden
              rounded
              border
              bg-muted/50
              px-1.5
              py-0.5
              text-[10px]
              text-muted-foreground
              sm:inline-flex
            "
          >
            ESC
          </kbd>

        </div>


        {/* =================================================
            RESULTS
        ================================================= */}

        {(loading ||
          error ||
          query.trim() ||
          results.length > 0) && (

          <div
            className="
              border-t
              px-2
              py-2
            "
          >

            {/* LOADING */}

            {loading && (
              <div
                className="
                  flex
                  items-center
                  gap-2
                  px-3
                  py-4
                  text-xs
                  text-muted-foreground
                "
              >

                <Loader2
                  className="
                    h-3.5
                    w-3.5
                    animate-spin
                  "
                />

                Searching...

              </div>
            )}


            {/* ERROR */}

            {!loading &&
              error && (
                <div
                  className="
                    px-3
                    py-4
                    text-xs
                    text-destructive
                  "
                >
                  {error}
                </div>
              )}


            {/* NO RESULTS */}

            {!loading &&
              !error &&
              query.trim() &&
              results.length === 0 && (
                <div
                  className="
                    px-3
                    py-5
                    text-center
                    text-xs
                    text-muted-foreground
                  "
                >
                  No candidates found
                </div>
              )}


            {/* RESULTS */}

            {!loading &&
              !error &&
              results.length > 0 && (
                <div
                  className="
                    max-h-[320px]
                    overflow-y-auto
                  "
                >

                  {results.map(
                    (result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() =>
                          handleResultClick(
                            result,
                          )
                        }
                        className="
                          group
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          transition-colors
                          hover:bg-muted/70
                          focus-visible:bg-muted/70
                          focus-visible:outline-none
                        "
                      >

                        {/* ICON */}

                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-md
                            bg-muted
                          "
                        >

                          <UserRound
                            className="
                              h-4
                              w-4
                              text-muted-foreground
                            "
                          />

                        </div>


                        {/* INFO */}

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >

                          <p
                            className="
                              truncate
                              text-sm
                              font-medium
                            "
                          >
                            {result.title}
                          </p>

                          <p
                            className="
                              truncate
                              text-xs
                              text-muted-foreground
                            "
                          >
                            {result.subtitle}

                            {result.description && (
                              <>
                                <span className="mx-1.5">
                                  ·
                                </span>

                                {result.description}
                              </>
                            )}

                          </p>

                        </div>


                        {/* ARROW */}

                        <ArrowRight
                          className="
                            h-3.5
                            w-3.5
                            shrink-0
                            text-muted-foreground
                            opacity-0
                            transition-opacity
                            group-hover:opacity-100
                          "
                        />

                      </button>
                    ),
                  )}

                </div>
              )}

          </div>
        )}

      </DialogContent>

    </Dialog>
  );
}