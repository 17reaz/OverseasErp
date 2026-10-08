import { useMemo, useState } from "react";
import { FileText, Plane, MousePointerClick } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { Mofa } from "../mofa-service";

interface MofaGridProps {
  items: Mofa[];
  loading?: boolean;
  onOpen?: (mofa: Mofa) => void;
}

// MOFA er nijer expiry nai. Medical dead hole MOFA o dead.
const MEDICAL_VALIDITY_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

/* =======================================================
   FIELD ADAPTER
   Tomar Mofa type er field name onujayi
   shudhu ei function ta mil kore nio.
======================================================= */

interface LooseMedical {
  fit_date?: string | null;
  fit_number?: string | null;
  medical_number?: string | null;
  number?: string | null;
}

interface LooseMofa {
  id?: string | number | null;
  sl?: number | string | null;
  mofa_number?: string | null;
  number?: string | null;
  approved_date?: string | null;
  approved_at?: string | null;
  date?: string | null;
  visa_no?: string | null;
  visa?: unknown;
  medical?: LooseMedical | null;
  candidate?: {
    name?: string | null;
    sl?: number | string | null;
    passport_no?: string | null;
    agent_name?: string | null;
    agent?: { name?: string | null } | null;
    medical?: LooseMedical | null;
  } | null;
  agent?: { name?: string | null } | string | null;
}

function getFields(item: Mofa) {
  const r = item as unknown as LooseMofa;

  const agent =
    typeof r.agent === "string"
      ? r.agent
      : (r.agent?.name ??
        r.candidate?.agent?.name ??
        r.candidate?.agent_name ??
        null);

  // medical ta mofa te ba candidate er bhitore thakte pare
  const medical = r.medical ?? r.candidate?.medical ?? null;

  return {
    name: r.candidate?.name ?? "Unknown candidate",
    sl: r.sl ?? r.candidate?.sl ?? null,
    passport: r.candidate?.passport_no ?? null,
    agent,
    // MOFA data (shudhu dekhanor jonno)
    mofaNumber: r.mofa_number ?? r.number ?? null,
    approvedDate: r.approved_date ?? r.approved_at ?? r.date ?? null,
    // Medical data (validity eta theke)
    fitDate: medical?.fit_date ?? null,
    fitNumber:
      medical?.fit_number ?? medical?.medical_number ?? medical?.number ?? null,
    hasVisa: Boolean(r.visa) || Boolean(r.visa_no),
  };
}

/* =======================================================
   DATE HELPERS
======================================================= */

function toTime(value: string | null) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function getFitDays(fitDate: string | null) {
  const t = toTime(fitDate);
  if (t === null) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
}

// Medical date na thakle expired dhora hobe
function getRemaining(f: ReturnType<typeof getFields>) {
  if (toTime(f.fitDate) === null) return 0;
  return MEDICAL_VALIDITY_DAYS - getFitDays(f.fitDate);
}

function formatDate(value: string | null) {
  if (!toTime(value)) return "—";

  return new Date(value as string).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =======================================================
   TONE (rong shudhu validity bojhay)
======================================================= */

type Tone = "ok" | "warn" | "danger";
type Filter = "all" | Tone;

function getTone(remaining: number): Tone {
  if (remaining <= 7) return "danger";
  if (remaining <= 20) return "warn";
  return "ok";
}

const TONE: Record<
  Tone,
  { stroke: string; text: string; soft: string; ring: string; label: string }
> = {
  ok: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    soft: "bg-emerald-500/10",
    ring: "ring-emerald-500/40",
    label: "Valid",
  },
  warn: {
    stroke: "stroke-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    soft: "bg-amber-500/10",
    ring: "ring-amber-500/40",
    label: "Soon",
  },
  danger: {
    stroke: "stroke-red-500",
    text: "text-red-700 dark:text-red-400",
    soft: "bg-red-500/10",
    ring: "ring-red-500/40",
    label: "Urgent",
  },
};

interface Row {
  item: Mofa;
  id: string;
  f: ReturnType<typeof getFields>;
  days: number;
  remaining: number;
  tone: Tone;
}

/* =======================================================
   RING
======================================================= */

function Ring({
  remaining,
  tone,
  size = 44,
  stroke = 4,
}: {
  remaining: number;
  tone: Tone;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, remaining);
  const pct = Math.max(0, Math.min(1, shown / MEDICAL_VALIDITY_DAYS));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-label={`${shown} days left`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted"
      />

      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={`${TONE[tone].stroke} transition-all duration-500`}
      />

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-semibold"
        style={{ fontSize: size * 0.3 }}
      >
        {shown}
      </text>
    </svg>
  );
}

/* =======================================================
   LIST CARD
======================================================= */

function MofaListCard({
  row,
  selected,
  onSelect,
}: {
  row: Row;
  selected: boolean;
  onSelect: () => void;
}) {
  const { f, remaining, tone } = row;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "flex h-16 w-full items-center gap-3 rounded-lg border bg-card px-3 text-left transition-all",
        "hover:border-foreground/20 hover:shadow-sm",
        selected ? `ring-2 ${TONE[tone].ring} border-transparent` : "",
      ].join(" ")}
    >
      <Ring remaining={remaining} tone={tone} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">
          {f.name}
        </p>

        <p className="truncate text-[11px] text-muted-foreground">
          {f.sl !== null ? `#${f.sl}` : "—"}
          {f.agent ? ` · ${f.agent}` : ""}
        </p>
      </div>

      {f.hasVisa && (
        <span
          title="Visa done"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
        >
          <Plane className="size-3" />
          VISA
        </span>
      )}
    </button>
  );
}

/* =======================================================
   DETAIL PANEL
======================================================= */

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className={`truncate text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function MofaDetailPanel({
  row,
  onOpen,
}: {
  row: Row | null;
  onOpen?: (mofa: Mofa) => void;
}) {
  if (!row) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
        <MousePointerClick className="mb-2 size-5 text-muted-foreground" />

        <p className="text-sm font-medium">Select a candidate</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Click a card to see full MOFA details here.
        </p>
      </div>
    );
  }

  const { f, days, remaining, tone } = row;
  const t = TONE[tone];
  const expired = remaining <= 0;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      {/* HEAD */}
      <div className="flex items-center gap-3">
        <Ring remaining={remaining} tone={tone} size={64} stroke={6} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-tight">
            {f.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {f.sl !== null ? `SL #${f.sl}` : "No SL"}
          </p>

          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.soft} ${t.text}`}
          >
            {expired ? "Medical expired" : `${t.label} · ${remaining} days left`}
          </span>
        </div>
      </div>

      {/* INFO */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        <Detail label="Agent" value={f.agent ?? "—"} />
        <Detail label="Passport" value={f.passport ?? "—"} mono />
        <Detail label="MOFA No." value={f.mofaNumber ?? "—"} mono />
        <Detail label="MOFA Approved" value={formatDate(f.approvedDate)} />
        <Detail label="Fit No." value={f.fitNumber ?? "—"} mono />
        <Detail label="Fit Date" value={formatDate(f.fitDate)} />
        <Detail
          label="Fit since"
          value={days === 0 ? "Today" : `${days} days`}
        />
        <Detail label="Valid for" value={`${MEDICAL_VALIDITY_DAYS} days`} />
      </div>

      {/* VISA */}
      <div
        className={[
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          f.hasVisa
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        <Plane className="size-4" />
        {f.hasVisa ? "Visa completed" : "Visa not done yet"}
      </div>

      {onOpen && (
        <button
          type="button"
          onClick={() => onOpen(row.item)}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open MOFA
        </button>
      )}
    </div>
  );
}

/* =======================================================
   SKELETON / EMPTY
======================================================= */

function MofaGridSkeleton() {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border bg-muted/40"
        />
      ))}
    </div>
  );
}

function MofaGridEmpty() {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>

        <h3 className="text-sm font-medium">No active MOFA</h3>

        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Approved MOFAs that are ready for Visa will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

/* =======================================================
   GRID
======================================================= */

export function MofaGrid({ items, loading = false, onOpen }: MofaGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // kom din baki age (urgent upore)
  const rows = useMemo<Row[]>(() => {
    if (loading) return [];

    return items
      .map((item) => {
        const f = getFields(item);
        const remaining = getRemaining(f);

        return {
          item,
          id: String(item.id),
          f,
          days: getFitDays(f.fitDate),
          remaining,
          tone: getTone(remaining),
        };
      })
      .sort((a, b) => a.remaining - b.remaining);
  }, [items, loading]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      danger: rows.filter((r) => r.tone === "danger").length,
      warn: rows.filter((r) => r.tone === "warn").length,
      ok: rows.filter((r) => r.tone === "ok").length,
    }),
    [rows],
  );

  const visibleRows =
    filter === "all" ? rows : rows.filter((r) => r.tone === filter);

  const selectedRow = rows.find((r) => r.id === selectedId) ?? null;

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "danger", label: "Urgent ≤7d" },
    { key: "warn", label: "Soon ≤20d" },
    { key: "ok", label: "Valid" },
  ];

  if (loading) return <MofaGridSkeleton />;

  if (!rows.length) return <MofaGridEmpty />;

  return (
    <div className="space-y-3">
      {/* FILTER CHIPS */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const active = filter === chip.key;

          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {chip.label}

              <span
                className={[
                  "rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-background/20" : "bg-muted",
                ].join(" ")}
              >
                {counts[chip.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* LIST + DETAIL */}
      <div className="grid items-start gap-3 lg:grid-cols-[1fr_340px]">
        {/* Mobile e panel upore, desktop e dane */}
        <div className="order-first lg:order-last lg:sticky lg:top-0">
          <MofaDetailPanel row={selectedRow} onOpen={onOpen} />
        </div>

        <div className="max-h-[calc(100vh-17rem)] overflow-y-auto pr-1">
          {visibleRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No candidates in this filter.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleRows.map((row) => (
                <MofaListCard
                  key={row.id}
                  row={row}
                  selected={row.id === selectedId}
                  onSelect={() =>
                    setSelectedId((current) =>
                      current === row.id ? null : row.id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}