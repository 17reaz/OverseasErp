import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadItem } from "../hooks/use-auto-upload";

interface Props {
  items: UploadItem[];
  onDismiss: () => void;
  onOpen: (id: string) => void;
}

export function UploadTray({ items, onDismiss, onOpen }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  if (!items.length) return null;

  const active = items.filter((i) => i.status === "uploading" || i.status === "reading").length;
  const title = active
    ? `Scanning ${active} ${active === 1 ? "file" : "files"}`
    : "All files scanned";

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-background shadow-lg">
      <div className="flex items-center justify-between bg-muted px-3 py-2">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand uploads" : "Collapse uploads"}
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {active === 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss} aria-label="Close uploads">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!collapsed && (
        <ul className="max-h-64 divide-y overflow-y-auto">
          {items.map((i) => (
            <li
              key={i.id}
              onClick={() => i.status === "done" && onOpen(i.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2",
                i.status === "done" && "cursor-pointer hover:bg-muted/50",
              )}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{i.name}</p>
                {i.status === "uploading" ? (
                  <Progress value={i.progress} className="mt-1.5 h-1" />
                ) : (
                  <p className={cn("text-xs", i.status === "error" ? "text-destructive" : "text-muted-foreground")}>
                    {i.status === "reading" && "Reading text..."}
                    {i.status === "done" && "Ready to review"}
                    {i.status === "error" && i.error}
                  </p>
                )}
              </div>
              {i.status === "uploading" && (
                <span className="text-xs tabular-nums text-muted-foreground">{Math.round(i.progress)}%</span>
              )}
              {i.status === "reading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {i.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {i.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
