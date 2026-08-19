const STEPS = [
  {
    step: "01",
    title: "Candidate Registration",
    description:
      "Agents register candidates with personal details, job preference, and initial documents.",
  },
  {
    step: "02",
    title: "Medical Examination",
    description:
      "Medical center results are logged against each candidate and fitness status is tracked centrally.",
  },
  {
    step: "03",
    title: "MOFA Attestation",
    description:
      "Contracts and certificates move through Ministry of Foreign Affairs attestation with status visible to all parties.",
  },
  {
    step: "04",
    title: "Visa Processing",
    description:
      "Visa stamping is tracked by embassy and destination, with deadline alerts before appointments lapse.",
  },
  {
    step: "05",
    title: "Flight & Ticketing",
    description:
      "Flights are booked and confirmed, with itineraries linked to each candidate's deployment record.",
  },
  {
    step: "06",
    title: "Deployment & Reporting",
    description:
      "Candidates are marked deployed and rolled into agency-wide reporting for compliance and audits.",
  },
] as const;

export function WorkflowSection() {
  return (
    <section id="workflow" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One pipeline, from registration to deployment
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Every candidate moves through the same six stages. OverseasERP
            keeps that sequence visible to agents, coordinators, and
            candidates alike.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="relative pl-14">
              <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-foreground">
                {item.step}
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
