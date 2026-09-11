import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

import {
  TEMPLATE_CATEGORY_LABELS,
} from "../template-types"
import type { DocumentTemplate } from "../template-types"

type TemplateCardProps = {
  template: DocumentTemplate
  canManage: boolean
  onUse: (template: DocumentTemplate) => void
  onEdit: (template: DocumentTemplate) => void
}

export function TemplateCard({
  template,
  canManage,
  onUse,
  onEdit,
}: TemplateCardProps) {
  const isLocked = template.status === "locked"

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {template.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {TEMPLATE_CATEGORY_LABELS[template.category]}
            </p>
          </div>

          <Badge variant={isLocked ? "secondary" : "outline"}>
            {isLocked ? "Locked" : "Draft"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {template.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {template.description}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Badge variant={template.is_active ? "default" : "destructive"}>
            {template.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={!isLocked || !template.is_active}
            onClick={() => onUse(template)}
          >
            Use Template
          </Button>

          {canManage ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(template)}
            >
              Edit
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
