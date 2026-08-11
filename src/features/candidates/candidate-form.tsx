
import { useEffect, useState } from 'react'

import {
  createCandidate,
  getAgents,
  updateCandidate,
  type Agent,
} from './candidate-api'

import type {
  Candidate,
  CreateCandidateInput,
  UpdateCandidateInput,
} from './candidate-types'

type CandidateFormProps = {
  candidate?: Candidate | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function CandidateForm({
  candidate,
  onSuccess,
  onCancel,
}: CandidateFormProps) {
  const isEditMode = Boolean(candidate)

  const [agents, setAgents] = useState<Agent[]>([])

  const [passportNo, setPassportNo] = useState('')
  const [name, setName] = useState('')
  const [receivedDate, setReceivedDate] =
    useState('')
  const [country, setCountry] = useState('')
  const [agentId, setAgentId] =
    useState<string>('')

  const [loadingAgents, setLoadingAgents] =
    useState(true)

  const [saving, setSaving] = useState(false)
  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (!candidate) {
      setPassportNo('')
      setName('')
      setReceivedDate('')
      setCountry('')
      setAgentId('')
      return
    }

    setPassportNo(candidate.passport_no)
    setName(candidate.name)
    setReceivedDate(
      candidate.received_date ?? '',
    )
    setCountry(candidate.country ?? '')
    setAgentId(
      candidate.agent_id?.toString() ?? '',
    )
  }, [candidate])

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await getAgents()
        setAgents(data)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load agents',
        )
      } finally {
        setLoadingAgents(false)
      }
    }

    loadAgents()
  }, [])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)
    setSaving(true)

    try {
      if (isEditMode && candidate) {
        const input: UpdateCandidateInput = {
          passport_no: passportNo.trim(),
          name: name.trim(),
          received_date:
            receivedDate || null,
          country: country || null,
          agent_id: agentId
            ? Number(agentId)
            : null,
        }

        await updateCandidate(
          candidate.id,
          input,
        )
      } else {
        const input: CreateCandidateInput = {
          passport_no: passportNo.trim(),
          name: name.trim(),
          received_date:
            receivedDate || null,
          country: country || null,
          agent_id: agentId
            ? Number(agentId)
            : null,
        }

        await createCandidate(input)
      }

      onSuccess?.()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? 'Failed to update candidate'
            : 'Failed to create candidate',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold">
          {isEditMode
            ? 'Edit Candidate'
            : 'Add Candidate'}
        </h2>

        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? 'Update candidate information.'
            : 'Add a new candidate to your organization.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Passport */}
        <div className="space-y-2">
          <label
            htmlFor="passport_no"
            className="text-sm font-medium"
          >
            Passport No
          </label>

          <input
            id="passport_no"
            value={passportNo}
            onChange={(event) =>
              setPassportNo(event.target.value)
            }
            placeholder="Passport number"
            required
            disabled={saving}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-sm font-medium"
          >
            Name
          </label>

          <input
            id="name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Candidate name"
            required
            disabled={saving}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Received Date */}
        <div className="space-y-2">
          <label
            htmlFor="received_date"
            className="text-sm font-medium"
          >
            Received Date
          </label>

          <input
            id="received_date"
            type="date"
            value={receivedDate}
            onChange={(event) =>
              setReceivedDate(event.target.value)
            }
            disabled={saving}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <label
            htmlFor="country"
            className="text-sm font-medium"
          >
            Country
          </label>

          <select
            id="country"
            value={country}
            onChange={(event) =>
              setCountry(event.target.value)
            }
            disabled={saving}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="">
              Select country
            </option>

            <option value="KSA">KSA</option>
            <option value="Mauritius">
              Mauritius
            </option>
            <option value="Laos">Laos</option>
            <option value="Malaysia">
              Malaysia
            </option>
            <option value="Belarus">
              Belarus
            </option>
          </select>
        </div>

        {/* Agent */}
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="agent_id"
            className="text-sm font-medium"
          >
            Agent
          </label>

          <select
            id="agent_id"
            value={agentId}
            onChange={(event) =>
              setAgentId(event.target.value)
            }
            disabled={
              saving || loadingAgents
            }
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="">
              {loadingAgents
                ? 'Loading agents...'
                : 'Select agent'}
            </option>

            {agents.map((agent) => (
              <option
                key={agent.id}
                value={agent.id}
              >
                {agent.name}
                {agent.code
                  ? ` (${agent.code})`
                  : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={
            saving || loadingAgents
          }
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Candidate'
              : 'Create Candidate'}
        </button>
      </div>
    </form>
  )
}

