import { useEffect, useState } from "react"

import { useNavigate, useParams } from "react-router-dom"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete02Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
} from "@hugeicons/core-free-icons"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/shared/toast/toast"

import { useAuth } from "../../../auth/components/auth-provider"

import { TemplatePreview } from "./components/template-preview"
import { canManageTemplates } from "./template-permissions"
import {
  buildSaudiEmploymentContractSeed,
} from "./saudi-employment-contract"
import {
  createDocumentTemplate,
  getDocumentTemplateById,
  setDocumentTemplateStatus,
  updateDocumentTemplate,
} from "./template-service"
import {
  DEFAULT_TEMPLATE_SETTINGS,
  TEMPLATE_CATEGORY_LABELS,
} from "./template-types"
import type {
  ContentBlock,
  DocumentTemplate,
  TemplateCategory,
} from "./template-types"

let localBlockId = 0
function newBlockId() {
  localBlockId += 1
  return `block-${Date.now()}-${localBlockId}`
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction

  if (target < 0 || target >= list.length) {
    return list
  }

  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)

  return next
}

export function TemplateBuilderPage() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId: string }>()
  const { profile } = useAuth()

  const isNew = templateId === "new"
  const canManage = canManageTemplates(profile?.role)

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<DocumentTemplate | null>(null)

  const [name, setName] = useState("")
  const [category, setCategory] = useState<TemplateCategory>("employment")
  const [description, setDescription] = useState("")
  const [blocks, setBlocks] = useState<ContentBlock[]>([])

  useEffect(() => {
    if (isNew || !templateId) {
      return
    }

    let active = true

    async function load() {
      try {
        setLoading(true)
        const data = await getDocumentTemplateById(templateId!)

        if (active && data) {
          setExisting(data)
          setName(data.name)
          setCategory(data.category)
          setDescription(data.description ?? "")
          setBlocks(data.content)
        }
      } catch (err) {
        console.error("Failed to load template:", err)
        toast.error("Failed to load template")
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
  }, [templateId, isNew])

  const isLocked = existing?.status === "locked"
  const readOnlyContent = isLocked && !isNew

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)),
    )
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  function addBlock(type: ContentBlock["type"]) {
    const id = newBlockId()

    let block: ContentBlock

    switch (type) {
      case "heading":
        block = { id, type, text: "New Heading" }
        break
      case "paragraph":
        block = { id, type, text: "New paragraph text…" }
        break
      case "field-row":
        block = { id, type, label: "Label", token: "{{candidate.full_name}}" }
        break
      case "table":
        block = { id, type, rows: [["Cell 1", "Cell 2"]] }
        break
      case "signature":
        block = { id, type, lines: ["Signature: ______________________"] }
        break
      case "spacer":
      default:
        block = { id, type: "spacer", height: 12 }
        break
    }

    setBlocks((prev) => [...prev, block])
  }

  async function handleSaveDraft() {
    if (!profile) {
      return
    }

    if (!name.trim()) {
      toast.error("Template name is required")
      return
    }

    setSaving(true)

    try {
      const input = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        content: blocks,
        schema: existing?.schema ?? { fields: [] },
        settings: existing?.settings ?? DEFAULT_TEMPLATE_SETTINGS,
      }

      if (isNew) {
        const created = await createDocumentTemplate(
          input,
          profile.tenant_id,
          profile.id,
        )
        toast.success("Template created")
        navigate(`/app/reports/templates/${created.id}`, { replace: true })
      } else if (templateId) {
        await updateDocumentTemplate(templateId, input)
        toast.success("Template saved")
      }
    } catch (err) {
      console.error("Failed to save template:", err)
      toast.error(
        "Failed to save template",
        err instanceof Error ? err.message : undefined,
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleLock() {
    if (!templateId || isNew || !existing) {
      return
    }

    try {
      const updated = await setDocumentTemplateStatus(
        templateId,
        existing.status === "locked" ? "draft" : "locked",
      )
      setExisting(updated)
      toast.success(
        updated.status === "locked" ? "Template locked" : "Template unlocked",
      )
    } catch (err) {
      console.error("Failed to update template status:", err)
      toast.error("Failed to update template status")
    }
  }

  function loadSaudiStarter() {
    const seed = buildSaudiEmploymentContractSeed()
    setName(seed.name)
    setCategory(seed.category)
    setDescription(seed.description ?? "")
    setBlocks(seed.content)
  }

  if (!canManage) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          You don't have permission to manage document templates.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading template...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/app/reports")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          </Button>

          <div>
            <h2 className="text-sm font-semibold">
              {isNew ? "New Document Template" : name || "Template"}
            </h2>

            {!isNew && existing ? (
              <Badge
                variant={isLocked ? "secondary" : "outline"}
                className="mt-1"
              >
                {isLocked ? "Locked" : "Draft"}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          {!isNew ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleLock}
            >
              <HugeiconsIcon
                icon={isLocked ? SquareUnlock02Icon : SquareLock02Icon}
                strokeWidth={2}
                className="size-4"
              />
              {isLocked ? "Unlock" : "Lock Template"}
            </Button>
          ) : null}

          <Button size="sm" onClick={handleSaveDraft} disabled={saving || readOnlyContent}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save Draft
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[380px_1fr]">
        {/* Left: settings + block editor */}
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Saudi Employment Contract"
              disabled={readOnlyContent}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TemplateCategory)}
              disabled={readOnlyContent}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown on the template card"
              disabled={readOnlyContent}
              rows={2}
            />
          </div>

          {isNew && blocks.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={loadSaudiStarter}
            >
              Load Saudi Employment Contract starter content
            </Button>
          ) : null}

          {readOnlyContent ? (
            <p className="rounded-md border border-amber-300/50 bg-amber-500/10 p-2 text-xs text-amber-700">
              This template is locked. Unlock it to edit the static content
              and dynamic fields below.
            </p>
          ) : (
            <>
              <Label>Document Content</Label>

              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => addBlock("heading")}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                  Heading
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("paragraph")}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                  Paragraph
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("field-row")}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                  Field
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("table")}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                  Table
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("signature")}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                  Signature
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("spacer")}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                  Spacer
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="flex flex-col gap-2 rounded-md border p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {block.type}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6"
                          onClick={() => setBlocks((p) => moveItem(p, index, -1))}
                        >
                          ↑
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6"
                          onClick={() => setBlocks((p) => moveItem(p, index, 1))}
                        >
                          ↓
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-destructive"
                          onClick={() => removeBlock(block.id)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {block.type === "heading" || block.type === "paragraph" ? (
                      <Textarea
                        value={block.text}
                        onChange={(e) =>
                          updateBlock(block.id, { text: e.target.value } as Partial<ContentBlock>)
                        }
                        rows={block.type === "heading" ? 1 : 2}
                        className="text-xs"
                      />
                    ) : null}

                    {block.type === "field-row" ? (
                      <div className="flex flex-col gap-1.5">
                        <Input
                          value={block.label}
                          onChange={(e) =>
                            updateBlock(block.id, { label: e.target.value } as Partial<ContentBlock>)
                          }
                          placeholder="Label"
                          className="text-xs"
                        />
                        <Input
                          value={block.token}
                          onChange={(e) =>
                            updateBlock(block.id, { token: e.target.value } as Partial<ContentBlock>)
                          }
                          placeholder="{{source.key}}"
                          className="font-mono text-xs"
                        />
                      </div>
                    ) : null}

                    {block.type === "table" ? (
                      <Textarea
                        value={block.rows.map((r) => r.join(" | ")).join("\n")}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            rows: e.target.value
                              .split("\n")
                              .map((row) => row.split("|").map((c) => c.trim())),
                          } as Partial<ContentBlock>)
                        }
                        placeholder="Cell 1 | Cell 2 | Cell 3 (one row per line)"
                        rows={3}
                        className="font-mono text-xs"
                      />
                    ) : null}

                    {block.type === "signature" ? (
                      <Textarea
                        value={block.lines.join("\n")}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            lines: e.target.value.split("\n"),
                          } as Partial<ContentBlock>)
                        }
                        rows={3}
                        className="text-xs"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: A4 live preview */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/30 p-6">
          <div className="mx-auto w-fit shadow-lg">
            <TemplatePreview blocks={blocks} />
          </div>
        </div>
      </div>
    </div>
  )
}
