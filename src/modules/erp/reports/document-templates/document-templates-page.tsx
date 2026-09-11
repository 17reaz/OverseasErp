import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { useNavigate } from "react-router-dom"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/shared/toast/toast"

import { useAuth } from "../../../auth/components/auth-provider"

import { TemplateCard } from "./components/template-card"
import { listDocumentTemplates } from "./template-service"
import { canManageTemplates } from "./template-permissions"
import type { DocumentTemplate } from "./template-types"

export function DocumentTemplatesPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const canManage = canManageTemplates(profile?.role)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const data = await listDocumentTemplates()

        if (active) {
          setTemplates(data)
        }
      } catch (err) {
        console.error("Failed to load document templates:", err)
        toast.error(
          "Failed to load templates",
          err instanceof Error ? err.message : undefined,
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return templates
    }

    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.description ?? "").toLowerCase().includes(query),
    )
  }, [templates, search])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Document Templates</h2>
          <p className="text-xs text-muted-foreground">
            Generate official documents like contracts and letters from
            reusable templates.
          </p>
        </div>

        {canManage ? (
          <Button
            size="sm"
            onClick={() => navigate("/app/reports/templates/new")}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            New
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />

        <Input
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading templates...
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {templates.length === 0
                ? "No document templates yet."
                : "No templates match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                canManage={canManage}
                onUse={(t) =>
                  navigate(`/app/reports/templates/${t.id}/use`)
                }
                onEdit={(t) =>
                  navigate(`/app/reports/templates/${t.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
