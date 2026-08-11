import { useCallback, useEffect, useState } from 'react'

import { CandidateForm } from '@/features/candidates/candidate-form'
import {
  deleteCandidate,
  getCandidates,
  setCandidateReturned,
} from '@/features/candidates/candidate-api'
import type { Candidate } from '@/features/candidates/candidate-types'

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [returningId, setReturningId] = useState<number | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setCandidates(await getCandidates())
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCandidates()
  }, [loadCandidates])

  function openCreateForm() {
    setSelectedCandidate(null)
    setShowForm(true)
  }

  function openEditForm(candidate: Candidate) {
    setSelectedCandidate(candidate)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setSelectedCandidate(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to remove this candidate?')) return

    setDeletingId(id)
    setError(null)

    try {
      await deleteCandidate(id)
      setCandidates((current) => current.filter((candidate) => candidate.id !== id))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove candidate')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleReturned(candidate: Candidate) {
    const nextReturned = !candidate.is_returned

    if (
      !window.confirm(
        nextReturned
          ? 'Mark this candidate as returned?'
          : 'Remove returned status from this candidate?',
      )
    ) {
      return
    }

    setReturningId(candidate.id)
    setError(null)

    try {
      const updated = await setCandidateReturned(candidate.id, nextReturned)
      setCandidates((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update returned status')
    } finally {
      setReturningId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading candidates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            Manage candidates belonging to your tenant.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add Candidate
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-6">
          <CandidateForm
            candidate={selectedCandidate}
            onSuccess={async () => {
              closeForm()
              await loadCandidates()
            }}
            onCancel={closeForm}
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <h2 className="font-medium">No candidates found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first candidate to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">SL</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Passport</th>
                  <th className="px-4 py-3 text-left font-medium">Country</th>
                  <th className="px-4 py-3 text-left font-medium">Stage</th>
                  <th className="px-4 py-3 text-left font-medium">Returned</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {candidates.map((candidate) => {
                  const busy =
                    deletingId === candidate.id || returningId === candidate.id

                  return (
                    <tr key={candidate.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{candidate.sl ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{candidate.name}</td>
                      <td className="px-4 py-3">{candidate.passport_no}</td>
                      <td className="px-4 py-3">{candidate.country ?? '—'}</td>
                      <td className="px-4 py-3">{candidate.current_stage}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span
                            className={
                              candidate.is_returned
                                ? 'font-medium text-destructive'
                                : 'text-muted-foreground'
                            }
                          >
                            {candidate.is_returned ? 'Returned' : 'Active'}
                          </span>
                          {candidate.returned_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(candidate.returned_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(candidate)}
                            disabled={busy}
                            className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleReturned(candidate)}
                            disabled={busy}
                            className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            {returningId === candidate.id
                              ? 'Saving...'
                              : candidate.is_returned
                                ? 'Unmark Returned'
                                : 'Mark Returned'}
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(candidate.id)}
                            className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive disabled:opacity-50"
                          >
                            {deletingId === candidate.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
