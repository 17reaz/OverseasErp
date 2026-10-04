import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { supabase } from "@/lib/supabase/client";
import { db, type CachedCandidate } from "@/lib/db";
import { useAuth } from "@/modules/auth/components/auth-provider";

import { CANDIDATE_SELECT } from "./candidate-query";

const PAGE_SIZE = 500;

const metaKey = (tenantId: string) =>
  `candidates:cursor:${tenantId}`;

type SyncCursor = {
  updatedAt: string;
  id: string;
};

function getMetaKey(tenantId: string) {
  return metaKey(tenantId);
}

async function getCursor(
  tenantId: string,
): Promise<SyncCursor | null> {
  const metadata = await db.cacheMetadata.get(
    getMetaKey(tenantId),
  );

  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(
      String(metadata.updatedAt),
    ) as SyncCursor;
  } catch {
    return null;
  }
}

async function setCursor(
  tenantId: string,
  cursor: SyncCursor,
) {
  await db.cacheMetadata.put({
    key: getMetaKey(tenantId),
    updatedAt: JSON.stringify(cursor) as unknown as number,
  });
}

async function applyRows(
  rows: CachedCandidate[],
) {
  if (!rows.length) {
    return;
  }

  const deletedIds = rows
    .filter((row) => row.is_deleted)
    .map((row) => row.id);

  const liveRows = rows.filter(
    (row) => !row.is_deleted,
  );

  await db.transaction(
    "rw",
    db.candidates,
    async () => {
      if (deletedIds.length) {
        await db.candidates.bulkDelete(
          deletedIds,
        );
      }

      if (liveRows.length) {
        await db.candidates.bulkPut(
          liveRows,
        );
      }
    },
  );
}

/**
 * Candidate incremental sync.
 *
 * First sync:
 *   Supabase -> 500 rows -> Dexie
 *   Supabase -> 500 rows -> Dexie
 *   ...
 *
 * Next sync:
 *   only rows after the saved cursor.
 */
export async function syncCandidates(
  tenantId: string,
) {
  if (!navigator.onLine) {
    return;
  }

  const cursor = await getCursor(
    tenantId,
  );

  let lastUpdatedAt =
    cursor?.updatedAt ?? null;

  let lastId =
    cursor?.id ?? null;

  for (;;) {
    let query = supabase
      .from("candidates")
      .select(CANDIDATE_SELECT)
      .eq("tenant_id", tenantId)
      .order("updated_at", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      })
      .limit(PAGE_SIZE);

    /**
     * Composite cursor:
     *
     * updated_at > lastUpdatedAt
     *
     * OR
     *
     * updated_at == lastUpdatedAt
     * AND id > lastId
     *
     * This prevents rows from being skipped
     * when multiple rows have the same updated_at.
     */
    if (lastUpdatedAt && lastId) {
      query = query.or(
        [
          `updated_at.gt.${lastUpdatedAt}`,
          `and(updated_at.eq.${lastUpdatedAt},id.gt.${lastId})`,
        ].join(","),
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    if (!data?.length) {
      break;
    }

    const rows =
      data as unknown as CachedCandidate[];

    const cachedRows = rows.map(
      (row) => ({
        ...row,
        cached_at: Date.now(),
      }),
    );

    await applyRows(
      cachedRows,
    );

    const lastRow =
      rows[rows.length - 1];

    lastUpdatedAt =
      lastRow.updated_at;

    lastId =
      lastRow.id;

    await setCursor(
      tenantId,
      {
        updatedAt:
          lastUpdatedAt,
        id: lastId,
      },
    );

    if (
      rows.length <
      PAGE_SIZE
    ) {
      break;
    }
  }
}

/**
 * Pull one candidate after a
 * realtime INSERT / UPDATE event.
 */
async function pullOne(
  tenantId: string,
  candidateId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", candidateId)
    .maybeSingle();

  /**
   * IMPORTANT:
   *
   * Query error hole candidate delete
   * korbo na.
   *
   * Otherwise temporary network error
   * local data delete kore dite parto.
   */
  if (error) {
    console.error(
      "Failed to pull candidate:",
      error,
    );

    return;
  }

  if (!data) {
    await db.candidates.delete(
      candidateId,
    );

    return;
  }

  await applyRows([
    {
      ...(data as unknown as CachedCandidate),
      cached_at: Date.now(),
    },
  ]);
}

/**
 * Supabase realtime -> Dexie.
 */
function subscribe(
  tenantId: string,
) {
  const channel =
    supabase
      .channel(
        `candidates-live-${tenantId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidates",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (
            payload.eventType ===
            "DELETE"
          ) {
            const id = (
              payload.old as {
                id?: string;
              }
            ).id;

            if (id) {
              void db.candidates.delete(
                id,
              );
            }

            return;
          }

          const id = (
            payload.new as {
              id?: string;
            }
          ).id;

          if (!id) {
            return;
          }

          void pullOne(
            tenantId,
            id,
          );
        },
      )
      .subscribe();

  return () => {
    void supabase.removeChannel(
      channel,
    );
  };
}

/**
 * Dexie is the READ source for UI.
 *
 * UI gets local data immediately.
 *
 * Background:
 *   Supabase -> Dexie
 */
export function useCandidatesLive() {
  const {
    profile,
  } = useAuth();

  const tenantId =
    profile?.tenant_id;

  const candidates =
    useLiveQuery(
      () => {
        if (!tenantId) {
          return Promise.resolve(
            [] as CachedCandidate[],
          );
        }

        return db.candidates
          .where("tenant_id")
          .equals(tenantId)
          .toArray();
      },
      [tenantId],
    );

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    const sync = () => {
      if (
        !navigator.onLine
      ) {
        return;
      }

      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      void syncCandidates(
        tenantId,
      ).catch((error) => {
        console.error(
          "Candidate background sync failed:",
          error,
        );
      });
    };

    /**
     * Initial background sync.
     *
     * Dexie rendering does NOT wait
     * for this.
     */
    sync();

    const unsubscribe =
      subscribe(
        tenantId,
      );

    const handleOnline =
      () => {
        sync();
      };

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          sync();
        }
      };

    window.addEventListener(
      "online",
      handleOnline,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    return () => {
      unsubscribe();

      window.removeEventListener(
        "online",
        handleOnline,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
    };
  }, [tenantId]);

  return candidates;
}