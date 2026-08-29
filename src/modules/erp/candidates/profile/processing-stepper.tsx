import { Link } from "react-router-dom"

import { FolderOpen, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { getStatusConfig, MODULES } from "./module-configs"
import type { ModuleConfig, ModuleStatus } from "./types"


/* =========================================================
 * PROCESSING STEPPER (horizontal, clickable)
 *
 * Each node is the status dot + icon; clicking a node opens
 * the module's records sheet (existing data, or Add New if
 * there isn't any yet). The connecting line between nodes
 * tints with the earlier step's status so progress reads
 * left → right at a glance.
 * ========================================================= */

function StepperNode({
  module,
  status,
  href,
  onOpen,
  isLast,
}: {
  module: ModuleConfig
  status: ModuleStatus
  href: string
  onOpen: () => void
  isLast: boolean
}) {
  const config = getStatusConfig(status)
  const StatusIcon = config.icon

  return (
    <div className="flex flex-1 items-start">
      <div className="flex min-w-[92px] flex-col items-center gap-2 text-center">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpen}
                className={cn(
                  "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                  config.dot,
                )}
              >
                {module.icon}

                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background">
                  <StatusIcon
                    className={cn(
                      "h-3 w-3",
                      status === "completed" && "text-primary",
                      status === "processing" && "text-blue-500",
                      status === "failed" && "text-destructive",
                      (status === "pending" || status === "not_started") &&
                        "text-muted-foreground",
                    )}
                  />
                </span>

                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 opacity-0 transition-opacity group-hover:bg-foreground/10 group-hover:opacity-100">
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </TooltipTrigger>

            <TooltipContent>
              <p className="text-xs">
                {status === "not_started"
                  ? `Add ${module.title.toLowerCase()} record`
                  : `View ${module.title.toLowerCase()} records`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="space-y-0.5">
          <p className="text-xs font-medium leading-tight">{module.title}</p>

          <Badge variant={config.variant} className="text-[10px] font-normal">
            {config.label}
          </Badge>
        </div>

        <Link
          to={href}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </div>

      {!isLast && (
        <div
          className={cn(
            "mt-[22px] h-0.5 flex-1 min-w-[24px] rounded-full transition-colors",
            config.line,
          )}
        />
      )}
    </div>
  )
}

function DocumentsStepNode({
  status,
  href,
}: {
  status: ModuleStatus
  href: string
}) {
  const config = getStatusConfig(status)

  return (
    <div className="flex min-w-[92px] flex-col items-center gap-2 text-center">
      <Link
        to={href}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
          config.dot,
        )}
      >
        <FolderOpen className="h-4 w-4" />
      </Link>

      <div className="space-y-0.5">
        <p className="text-xs font-medium leading-tight">Documents</p>

        <Badge variant={config.variant} className="text-[10px] font-normal">
          {config.label}
        </Badge>
      </div>

      <Link
        to={href}
        className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Open
      </Link>
    </div>
  )
}

export function ProcessingStepper({
  moduleStatuses,
  documentsStatus,
  candidateId,
  onOpenModule,
}: {
  moduleStatuses: Record<string, ModuleStatus>
  documentsStatus: ModuleStatus
  candidateId: string
  onOpenModule: (moduleKey: string) => void
}) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max items-start gap-1 px-1 sm:min-w-full">
        {MODULES.map((module) => (
          <StepperNode
            key={module.key}
            module={module}
            href={module.href(candidateId)}
            status={moduleStatuses[module.key] ?? "not_started"}
            onOpen={() => onOpenModule(module.key)}
            isLast={false}
          />
        ))}

        <DocumentsStepNode
          status={documentsStatus}
          href={`/app/files?candidate=${candidateId}`}
        />
      </div>
    </div>
  )
}
