import type { Candidate } from "../candidate-service";

interface CandidatesTableProps {
  candidates: Candidate[];
  loading?: boolean;
}

export function CandidatesTable({
  candidates,
  loading = false,
}: CandidatesTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading candidates...
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No candidates found.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                SL
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Candidate
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Passport
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Country
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Stage
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Received
              </th>

              <th className="px-4 py-3 text-right text-sm font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((candidate) => (
              <tr
                key={candidate.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                {/* SL */}
                <td className="px-4 py-3 text-sm">
                  {candidate.sl ?? "—"}
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {candidate.name}
                    </p>
                  </div>
                </td>

                {/* Passport */}
                <td className="px-4 py-3 text-sm">
                  {candidate.passport_no}
                </td>

                {/* Country */}
                <td className="px-4 py-3 text-sm">
                  {candidate.country ?? "—"}
                </td>

                {/* Stage */}
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                    {candidate.current_stage ??
                      "Pending"}
                  </span>
                </td>

                {/* Received date */}
                <td className="px-4 py-3 text-sm">
                  {candidate.received_date ?? "—"}
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}