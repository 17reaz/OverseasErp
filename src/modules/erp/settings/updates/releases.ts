export type ChangeType = "new" | "improved" | "fixed"

export interface Release {
  version: string
  date: string // YYYY-MM-DD
  title: string
  changes: { type: ChangeType; text: string }[]
}

export const releases: Release[] = [
  {
    version: "0.0.1",
    date: "2026-10-03",
    title: "Navigation and offline improvements",
    changes: [
      { type: "new", text: "Breadcrumb navigation in the header." },
      { type: "new", text: "Updates & History page in Settings." },
      { type: "improved", text: "Faster loading with offline-ready app files." },
      { type: "fixed", text: "Page error after a new version was released." },
    ],
  },
]