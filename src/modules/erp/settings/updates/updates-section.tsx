import { useMemo, useState } from "react"
import {
  GitCommitHorizontal,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { toast } from "@/components/shared/toast/toast"
import { cn } from "@/lib/utils"

import { releases, type ChangeType } from "./releases"

type Commit = (typeof __COMMITS__)[number]

const PAGE_SIZE = 30

const CHANGE_STYLES: Record<ChangeType, { label: string; className: string }> = {
  new: {
    label: "New",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  improved: {
    label: "Improved",
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  fixed: {
    label: "Fixed",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
}

const COMMIT_TYPE_STYLES: Record<string, string> = {
  feat: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  fix: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  perf: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  refactor: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

function parseCommit(subject: string) {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/)

  if (!match) return { type: null, scope: null, text: subject }

  return {
    type: match[1].toLowerCase(),
    scope: match[2] ?? null,
    text: match[3],
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function CurrentVersionCard() {
  const [checking, setChecking] = useState(false)

  async function checkForUpdates() {
    setChecking(true)

    try {
      const registration =
        "serviceWorker" in navigator
          ? await navigator.serviceWorker.getRegistration()
          : undefined

      await registration?.update()

      if (registration?.installing || registration?.waiting) {
        toast.show({
          title: "New version found",
          description: "It is downloading in the background. You will be notified when it is ready.",
          type: "info",
        })
      } else {
        toast.show({
          title: "You're up to date",
          description: `Running version ${__APP_VERSION__}.`,
          type: "success",
        })
      }
    } catch {
      toast.show({
        title: "Could not check for updates",
        description: "Please check your internet connection.",
        type: "error",
      })
    } finally {
      setChecking(false)
    }
  }

  const stats = [
    { label: "Version", value: `v${__APP_VERSION__}` },
    { label: "Commit", value: __COMMIT_HASH__, mono: true },
    {
      label: "Built",
      value: new Date(__BUILD_TIME__).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          Current version
        </CardTitle>
        <CardDescription>
          The version of Overseas ERP running on this device.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className={cn("text-sm font-medium", stat.mono && "font-mono")}>
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={checking}
          onClick={() => void checkForUpdates()}
        >
          {checking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Check for updates
        </Button>
      </CardContent>
    </Card>
  )
}

function UpdatesTab() {
  return (
    <div className="space-y-4">
      {releases.map((release) => (
        <Card key={release.version}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                v{release.version}
              </Badge>

              {release.version === __APP_VERSION__ && (
                <Badge variant="outline">Current</Badge>
              )}

              <span className="text-xs text-muted-foreground">
                {formatDate(release.date)}
              </span>
            </div>

            <CardTitle className="pt-1 text-base">{release.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="space-y-2">
              {release.changes.map((change, index) => {
                const style = CHANGE_STYLES[change.type]

                return (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Badge
                      variant="outline"
                      className={cn("mt-0.5 w-20 shrink-0 justify-center", style.className)}
                    >
                      {style.label}
                    </Badge>
                    <span>{change.text}</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CommitsTab() {
  const [limit, setLimit] = useState(PAGE_SIZE)

  const groups = useMemo(() => {
    const map = new Map<string, Commit[]>()

    for (const commit of __COMMITS__.slice(0, limit)) {
      const key = commit.date.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), commit])
    }

    return Array.from(map.entries())
  }, [limit])

  if (__COMMITS__.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Commit history is not available in this build.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(([day, commits]) => (
        <div key={day} className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatDate(day)}
          </h3>

          <Card>
            <CardContent className="divide-y p-0">
              {commits.map((commit) => {
                const parsed = parseCommit(commit.subject)

                return (
                  <div
                    key={commit.hash}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm">
                        {parsed.type && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "mr-2 align-middle",
                              COMMIT_TYPE_STYLES[parsed.type],
                            )}
                          >
                            {parsed.type}
                            {parsed.scope ? ` · ${parsed.scope}` : ""}
                          </Badge>
                        )}
                        {parsed.text}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {commit.author}
                      </p>
                    </div>

                    <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {commit.hash}
                    </code>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {limit < __COMMITS__.length && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  )
}

export function UpdatesSection() {
  return (
    <div className="space-y-6">
      <CurrentVersionCard />

      <Tabs defaultValue="updates">
        <TabsList>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="mt-4">
          <UpdatesTab />
        </TabsContent>

        <TabsContent value="commits" className="mt-4">
          <CommitsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}