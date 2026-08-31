import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Badge,
} from "@/components/ui/badge";

import {
  restoreDeletedCandidate,
  getDeletedCandidates,
  getCandidateChildData,
  permanentlyDeleteCandidate,
} from "./trash-service";

import type {
  Candidate,
} from "../candidates/candidate-service";


// =====================================================
// PAGE
// =====================================================

export function TrashPage() {

  // ===================================================
  // STATE
  // ===================================================

  const [
    candidates,
    setCandidates,
  ] = useState<Candidate[]>([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    restoringId,
    setRestoringId,
  ] = useState<string | null>(
    null,
  );
const [
  deletingId,
  setDeletingId,
] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  // ===================================================
  // LOAD TRASH
  // ===================================================

  const loadTrash =
    useCallback(
      async () => {

        setLoading(true);

        setError(null);


        try {

          const {
            data,
            error,
          } =
            await getDeletedCandidates();


          if (error) {

            console.error(
              "Failed to load trash:",
              error,
            );

            setCandidates([]);

            setError(
              "Failed to load deleted candidates.",
            );

            return;
          }


          setCandidates(
            data ?? [],
          );

        } catch (error) {

          console.error(
            error,
          );

          setCandidates([]);

          setError(
            "Failed to load deleted candidates.",
          );

        } finally {

          setLoading(false);

        }

      },
      [],
    );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadTrash();

  }, [
    loadTrash,
  ]);


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredCandidates =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {
        return candidates;
      }


      return candidates.filter(
        (
          candidate,
        ) => {

          return (

            candidate.name
              .toLowerCase()
              .includes(query)

            ||

            candidate.passport_no
              .toLowerCase()
              .includes(query)

            ||

            candidate.country
              ?.toLowerCase()
              .includes(query)

            ||

            candidate.agent?.name
              ?.toLowerCase()
              .includes(query)

            ||

            candidate.agent?.code
              ?.toLowerCase()
              .includes(query)

          );

        },
      );

    }, [
      candidates,
      search,
    ]);


  // ===================================================
  // RESTORE
  // ===================================================

  async function handleRestore(
    candidate: Candidate,
  ) {

    const confirmed =
      window.confirm(
        `Restore "${candidate.name}"?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setRestoringId(
        candidate.id,
      );

      setError(null);


      const {
        error,
      } =
        await restoreDeletedCandidate(
          candidate.id,
        );


      if (error) {

        console.error(
          "Failed to restore candidate:",
          error,
        );

        setError(
          error.message ||
            "Failed to restore candidate.",
        );

        return;
      }
      async function handlePermanentDelete(
  candidate: Candidate,
) {
  try {
    setDeletingId(candidate.id);
    setError(null);

    // Check related child data first
    const childData =
      await getCandidateChildData(
        candidate.id,
      );

    if (childData.total > 0) {
      const details = [
        childData.medicals > 0
          ? `Medical: ${childData.medicals}`
          : null,

        childData.mofas > 0
          ? `MOFA: ${childData.mofas}`
          : null,

        childData.visas > 0
          ? `Visa: ${childData.visas}`
          : null,

        childData.flights > 0
          ? `Flight: ${childData.flights}`
          : null,

        childData.fingers > 0
          ? `Finger: ${childData.fingers}`
          : null,

        childData.police_clearances > 0
          ? `Police Clearance: ${childData.police_clearances}`
          : null,

        childData.trade_tests > 0
          ? `Trade Test: ${childData.trade_tests}`
          : null,

        childData.files > 0
          ? `Files: ${childData.files}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const confirmed =
        window.confirm(
          `⚠️ This candidate has related data.\n\n${details}\n\nTotal related records: ${childData.total}\n\nPermanent delete will remove the candidate AND all related data.\n\nThis action cannot be undone.\n\nContinue?`,
        );

      if (!confirmed) {
        return;
      }
    } else {
      const confirmed =
        window.confirm(
          `Permanently delete "${candidate.name}"?\n\nThis action cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }
    }

    const result =
      await permanentlyDeleteCandidate(
        candidate.id,
        true,
      );

    if (!result.success) {
      setError(
        result.message ||
          "Failed to permanently delete candidate.",
      );

      return;
    }

    // Remove immediately from Trash
    setCandidates(
      (current) =>
        current.filter(
          (item) =>
            item.id !== candidate.id,
        ),
    );
  } catch (error) {
    console.error(
      "Failed to permanently delete candidate:",
      error,
    );

    setError(
      "Failed to permanently delete candidate.",
    );
  } finally {
    setDeletingId(null);
  }
}

      // Remove from Trash immediately

      setCandidates(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              candidate.id,
          ),
      );

    } catch (error) {

      console.error(
        error,
      );

      setError(
        "Failed to restore candidate.",
      );

    } finally {

      setRestoringId(
        null,
      );

    }

  }


  // ===================================================
  // UI
  // ===================================================

  return (

    <div
      className="
        space-y-6
      "
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <Trash2
              className="
                size-5
                text-muted-foreground
              "
            />

            <h1
              className="
                text-2xl
                font-semibold
              "
            >
              Trash
            </h1>

          </div>


          <p
            className="
              mt-1
              text-sm
              text-muted-foreground
            "
          >
            Deleted candidates can be restored
            from here.
          </p>

        </div>


        <Button
          variant="outline"
          onClick={
            loadTrash
          }
          disabled={
            loading
          }
        >
          Refresh
        </Button>

      </div>


      {/* =================================================
          SEARCH
          ================================================= */}

      <div
        className="
          relative
          max-w-md
        "
      >

        <Search
          className="
            absolute
            left-3
            top-1/2
            size-4
            -translate-y-1/2
            text-muted-foreground
          "
        />


        <Input
          value={
            search
          }
          onChange={(
            event,
          ) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="
            Search deleted candidates...
          "
          className="
            pl-9
          "
        />

      </div>


      {/* =================================================
          ERROR
          ================================================= */}

      {error && (

        <div
          className="
            rounded-lg
            border
            border-destructive/30
            bg-destructive/5
            p-4
            text-sm
            text-destructive
          "
        >
          {error}
        </div>

      )}


      {/* =================================================
          TABLE
          ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-lg
          border
          bg-background
        "
      >

        {loading ? (

          <div
            className="
              flex
              min-h-[250px]
              items-center
              justify-center
            "
          >

            <p
              className="
                text-sm
                text-muted-foreground
              "
            >
              Loading trash...
            </p>

          </div>

        ) : filteredCandidates.length === 0 ? (

          <div
            className="
              flex
              min-h-[250px]
              flex-col
              items-center
              justify-center
              text-center
            "
          >

            <Trash2
              className="
                mb-3
                size-8
                text-muted-foreground
              "
            />

            <p
              className="
                text-sm
                font-medium
              "
            >
              Trash is empty
            </p>


            <p
              className="
                mt-1
                text-xs
                text-muted-foreground
              "
            >
              Deleted candidates will appear here.
            </p>

          </div>

        ) : (

          <div
            className="
              overflow-x-auto
            "
          >

            <table
              className="
                w-full
                min-w-[900px]
              "
            >

              <thead>

                <tr
                  className="
                    border-b
                    bg-muted/30
                  "
                >

                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    SL
                  </th>


                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    Candidate
                  </th>


                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    Passport
                  </th>


                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    Country
                  </th>


                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    Stage
                  </th>


                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    Agent
                  </th>


                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-medium
                    "
                  >
                    Status
                  </th>


                  <th
                    className="
                      w-[120px]
                      px-4
                      py-3
                      text-right
                      text-sm
                      font-medium
                    "
                  >
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredCandidates.map(
                  (
                    candidate,
                  ) => (

                    <tr
                      key={
                        candidate.id
                      }
                      className="
                        border-b
                        last:border-0
                        hover:bg-muted/40
                      "
                    >

                      {/* SL */}

                      <td
                        className="
                          px-4
                          py-3
                          text-sm
                        "
                      >
                        {
                          candidate.sl ??
                          "—"
                        }
                      </td>


                      {/* NAME */}

                      <td
                        className="
                          px-4
                          py-3
                        "
                      >

                        <div
                          className="
                            font-medium
                          "
                        >
                          {
                            candidate.name
                          }
                        </div>

                      </td>


                      {/* PASSPORT */}

                      <td
                        className="
                          px-4
                          py-3
                          text-sm
                        "
                      >
                        {
                          candidate.passport_no
                        }
                      </td>


                      {/* COUNTRY */}

                      <td
                        className="
                          px-4
                          py-3
                          text-sm
                        "
                      >
                        {
                          candidate.country ??
                          "—"
                        }
                      </td>


                      {/* STAGE */}

                      <td
                        className="
                          px-4
                          py-3
                        "
                      >

                        <Badge
                          variant="outline"
                        >
                          {
                            candidate.current_stage ??
                            "Pending"
                          }
                        </Badge>

                      </td>


                      {/* AGENT */}

                      <td
                        className="
                          px-4
                          py-3
                          text-sm
                        "
                      >

                        {candidate.agent ? (

                          <div>

                            <p
                              className="
                                font-medium
                              "
                            >
                              {
                                candidate.agent.name ??
                                "Unnamed Agent"
                              }
                            </p>


                            {candidate.agent.code && (

                              <p
                                className="
                                  text-xs
                                  text-muted-foreground
                                "
                              >
                                {
                                  candidate.agent.code
                                }
                              </p>

                            )}

                          </div>

                        ) : (

                          "—"

                        )}

                      </td>


                      {/* STATUS */}

                      <td
                        className="
                          px-4
                          py-3
                        "
                      >

                        <Badge
                          variant="secondary"
                        >
                          Deleted
                        </Badge>

                      </td>


                      {/* ACTION */}

                      <td
                        className="
                          px-4
                          py-3
                          text-right
                        "
                      >

                        <div className="flex items-center justify-end gap-2">

  <Button
    size="sm"
    variant="outline"
    disabled={
      restoringId === candidate.id ||
      deletingId === candidate.id
    }
    onClick={() =>
      handleRestore(candidate)
    }
  >
    <RotateCcw />

    {restoringId === candidate.id
      ? "Restoring..."
      : "Restore"}
  </Button>

  <Button
    size="sm"
    variant="destructive"
    disabled={
      restoringId === candidate.id ||
      deletingId === candidate.id
    }
    onClick={() =>
      handlePermanentDelete(
        candidate,
      )
    }
  >
    <Trash2 />

    {deletingId === candidate.id
      ? "Deleting..."
      : "Delete Forever"}
  </Button>

</div>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          COUNT
          ================================================= */}

      {!loading &&
        filteredCandidates.length > 0 && (

          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            Showing{" "}
            {
              filteredCandidates.length
            }{" "}
            deleted candidate
            {filteredCandidates.length !== 1
              ? "s"
              : ""}
          </p>

        )}

    </div>

  );
}