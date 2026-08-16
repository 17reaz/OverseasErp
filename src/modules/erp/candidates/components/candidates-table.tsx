import type { Candidate } from "../types/candidate.types";

interface CandidatesTableProps {
  candidates: Candidate[];
}

export function CandidatesTable({
  candidates,
}: CandidatesTableProps) {
  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm">
              Code
            </th>

            <th className="px-4 py-3 text-left text-sm">
              Name
            </th>

            <th className="px-4 py-3 text-left text-sm">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b">
              <td className="px-4 py-3 text-sm">
                {candidate.code}
              </td>

              <td className="px-4 py-3 text-sm">
                {candidate.name}
              </td>

              <td className="px-4 py-3 text-sm">
                {candidate.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}