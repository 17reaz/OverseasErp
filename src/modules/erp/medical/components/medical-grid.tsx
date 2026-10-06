import { useMemo, useState } from "react";
import { FileText, ShieldCheck, MousePointerClick } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { type MedicalPipelineItem } from "./medical-pipeline-card";

interface MedicalGridProps {
  items: MedicalPipelineItem[];
  loading?: boolean;
  onOpen?: (candidateId: string) => void;
}

const MEDICAL_VALIDITY_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function isMedicalValid(item: MedicalPipelineItem) {
  const fitDate = item.medical.fit_date;

  if (!fitDate) {
    return false;
  }

  const fitTime = new Date(fitDate).getTime();
  const nowTime = Date.now();

  if (Number.isNaN(fitTime)) {
    return false;
  }

  // Future fit date is not considered valid
  if (fitTime > nowTime) {
    return false;
  }

  const validityTime = MEDICAL_VALIDITY_DAYS * DAY_MS;

  return nowTime - fitTime < validityTime;
}

/* =======================================================
   FIELD ADAPTER
   Tomar MedicalPipelineItem er field name onujayi
   shudhu ei function ta mil kore nio.
======================================================= */

interface LooseItem {
  sl?: number | string | null;
  candidate?: {
    name?: string | null;
    sl?: number | string | null;
    passport_no?: string | null;
    agent_name?: string | null;
    agent?: { name?: string | null } | null;
  } | null;
  agent?: { name?: string | null } | string | null;
  mofa?: unknown;
  mofa_status?: string | null;
  medical: {
    fit_date?: string | null;
    fit_number?: string | null;
    medical_number?: string | null;
    number?: string | null;
  };
}

function getFields(item: MedicalPipelineItem) {
  const r = item as unknown as LooseItem;

  const agent =
    typeof r.agent === "string"
      ? r.agent
      : (r.agent?.name ??
        r.candidate?.agent?.name ??
        r.candidate?.agent_name ??
        null);

  const mofaStatus = r.mofa_status ?? null;

  return {
    name: r.candidate?.name ?? "Unknown candidate",
    sl: r.sl ?? r.candidate?.sl ?? null,
    passport: r.candidate?.passport_no ?? null,
    agent,
    fitNumber:
      r.medical.fit_number ??
      r.medical.medical_number ??
      r.medical.number ??
      null,
    fitDate: r.medical.fit_date ?? null,
    hasMofa:
      Boolean(r.mofa) ||
      (mofaStatus !== null && mofaStatus.toLowerCase() === "approved"),
  };
}

function getFitDays(fitDate: string | null) {
  if (!fitDate) return 0;

  const time = new Date(fitDate).getTime();

  if (Number.isNaN(time)) return 0;

  return Math.max(0, Math.floor((Date.now() - time) / DAY_MS));
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GB", {
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
  item: MedicalPipelineItem;
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
  const pct = Math.max(0, Math.min(1, remaining / MEDICAL_VALIDITY_DAYS));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-label={`${remaining} days left`}
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
        {remaining}
      </text>
    </svg>
  );
}

/* =======================================================
   LIST CARD (simple, expand nai)
======================================================= */

function MedicalListCard({
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

      {f.hasMofa && (
        <span
          title="MOFA done"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
        >
          <ShieldCheck className="size-3" />
          MOFA
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

function MedicalDetailPanel({
  row,
  onOpen,
}: {
  row: Row | null;
  onOpen?: (candidateId: string) => void;
}) {
  if (!row) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
        <MousePointerClick className="mb-2 size-5 text-muted-foreground" />

        <p className="text-sm font-medium">Select a candidate</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Click a card to see full medical details here.
        </p>
      </div>
    );
  }

  const { f, days, remaining, tone } = row;
  const t = TONE[tone];

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
            {t.label} · {remaining} days left
          </span>
        </div>
      </div>

      {/* INFO */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        <Detail label="Agent" value={f.agent ?? "—"} />
        <Detail label="Passport" value={f.passport ?? "—"} mono />
        <Detail label="Fit No." value={f.fitNumber ?? "—"} mono />
        <Detail label="Fit Date" value={formatDate(f.fitDate)} />
        <Detail label="Fit since" value={days === 0 ? "Today" : `${days} days`} />
        <Detail label="Valid for" value={`${MEDICAL_VALIDITY_DAYS} days`} />
      </div>

      {/* MOFA */}
      <div
        className={[
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          f.hasMofa
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        <ShieldCheck className="size-4" />
        {f.hasMofa ? "MOFA completed" : "MOFA not done yet"}
      </div>

      {onOpen && (
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open candidate
        </button>
      )}
    </div>
  );
}

/* =======================================================
   SKELETON / EMPTY
======================================================= */

function MedicalGridSkeleton() {
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

function MedicalGridEmpty() {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>

        <h3 className="text-sm font-medium">No medical records found</h3>

        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          There are no valid medical records within the last 90 days.
        </p>
      </CardContent>
    </Card>
  );
}

/* =======================================================
   GRID
======================================================= */

export function MedicalGrid({
  items,
  loading = false,
  onOpen,
}: MedicalGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // valid item gulo, kom din baki age (urgent upore)
  const rows = useMemo<Row[]>(() => {
    if (loading) return [];

    return items
      .filter(isMedicalValid)
      .map((item) => {
        const f = getFields(item);
        const days = getFitDays(f.fitDate);
        const remaining = MEDICAL_VALIDITY_DAYS - days;

        return {
          item,
          id: item.medical.id,
          f,
          days,
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

  if (loading) return <MedicalGridSkeleton />;

  if (!rows.length) return <MedicalGridEmpty />;

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
          <MedicalDetailPanel row={selectedRow} onOpen={onOpen} />
        </div>

        <div className="max-h-[calc(100vh-17rem)] overflow-y-auto pr-1">
          {visibleRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No candidates in this filter.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleRows.map((row) => (
                <MedicalListCard
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