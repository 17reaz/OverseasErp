import type { ReactNode, FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

interface UniversalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  children: ReactNode;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  submitLabel?: string;
  cancelLabel?: string;

  loading?: boolean;
  disabled?: boolean;
}

export function UniversalSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
}: UniversalSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg"
      >
        {/* Header */}
        <SheetHeader>
          <SheetTitle>
            {title}
          </SheetTitle>

          {description && (
            <SheetDescription>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-6">
              {children}
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="border-t px-4 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={loading}
            >
              {cancelLabel}
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                disabled
              }
            >
              {loading && (
                <Loader2 className="animate-spin" />
              )}

              {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}