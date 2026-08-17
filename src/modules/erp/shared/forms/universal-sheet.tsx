import type {
  FormEvent,
  ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

interface UniversalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  children: ReactNode;

  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;

  submitLabel?: string;
  cancelLabel?: string;

  loading?: boolean;
  disabled?: boolean;

  /**
   * true হলে unsaved changes warning দেখাবে
   */
  hasChanges?: boolean;
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
  hasChanges = false,
}: UniversalSheetProps) {
  const [showDiscardWarning, setShowDiscardWarning] =
    useState(false);

  function handleRequestClose() {
    if (loading) {
      return;
    }

    if (hasChanges) {
      setShowDiscardWarning(true);
      return;
    }

    onOpenChange(false);
  }

  function handleDiscard() {
    setShowDiscardWarning(false);
    onOpenChange(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRequestClose();
            return;
          }

          onOpenChange(true);
        }}
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
            {/* Content */}
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
                onClick={handleRequestClose}
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

      {/* Unsaved Changes Warning */}
      <AlertDialog
        open={showDiscardWarning}
        onOpenChange={
          setShowDiscardWarning
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Discard changes?
            </AlertDialogTitle>

            <AlertDialogDescription>
              You have unsaved changes. If you
              leave now, your changes will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Keep Editing
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDiscard}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}