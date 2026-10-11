import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DOC_TYPES, DOC_TYPE_LABEL } from "../data/dummy";
import type { DocType } from "../types";

interface Props {
  docType: DocType;
  onDocTypeChange: (t: DocType) => void;
  /** called as soon as files are picked, upload starts right away */
  onFiles: (files: File[]) => void;
}

export function UploadPanel({ docType, onDocTypeChange, onFiles }: Props) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Upload documents</CardTitle>
        <CardDescription>
          Files upload and scan as soon as you add them. You can also drop files anywhere on this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Document type</Label>
          <Select value={docType} onValueChange={(v) => onDocTypeChange(v as DocType)}>
            <SelectTrigger className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {DOC_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Used when the type can't be guessed from the file name, for example "visa" in the name means Visa.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            hover ? "bg-muted/50" : "border-muted-foreground/25",
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Click to choose files</p>
          <p className="text-xs text-muted-foreground">JPG, PNG or PDF, up to 10 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
