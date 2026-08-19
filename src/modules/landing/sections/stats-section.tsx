const STATS = [
  { value: "1,200+", label: "Recruitment agencies" },
  { value: "480K+", label: "Candidates processed" },
  { value: "35", label: "Destination countries" },
  { value: "99.9%", label: "Document accuracy" },
] as const;

export function StatsSection() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
