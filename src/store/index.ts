import { create } from "zustand"
import { persist } from "zustand/middleware"

export type CandidateDraft = {
  name: string
  phone: string
  email: string
  passportNo: string
  dateOfBirth: string
  gender: string
  nationality: string

  agentId: string | null
  agencyId: string | null

  countryId: string | null
  countryName: string

  requestedServices: string[]
}

type CandidateStore = {
  draft: CandidateDraft

  setDraft: <K extends keyof CandidateDraft>(
    key: K,
    value: CandidateDraft[K],
  ) => void

  updateDraft: (values: Partial<CandidateDraft>) => void

  resetDraft: () => void
}

const initialDraft: CandidateDraft = {
  name: "",
  phone: "",
  email: "",
  passportNo: "",
  dateOfBirth: "",
  gender: "",
  nationality: "Bangladesh",

  agentId: null,
  agencyId: null,

  countryId: null,
  countryName: "",

  requestedServices: [],
}

export const useCandidateStore = create<CandidateStore>()(
  persist(
    (set) => ({
      draft: initialDraft,

      setDraft: (key, value) =>
        set((state) => ({
          draft: {
            ...state.draft,
            [key]: value,
          },
        })),

      updateDraft: (values) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ...values,
          },
        })),

      resetDraft: () =>
        set({
          draft: initialDraft,
        }),
    }),
    {
      name: "overseaserp-candidate-draft",
    },
  ),
)