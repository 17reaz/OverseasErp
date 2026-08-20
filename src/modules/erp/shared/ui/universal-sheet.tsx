import { useState } from "react";
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

import {http://localhost:5173/app/mofa
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

  function requestClose() {
    if (loading) {
      return;
    }

    if (hasChanges) {
      setShowDiscardWarning(true);
      return;
    }

    onOpenChange(false);
  }

  function discardChanges() {
    setShowDiscardWarning(false);
    onOpenChange(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            requestClose();
            return;
          }

          onOpenChange(true);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>

            {description && (
              <SheetDescription>
                {description}
              </SheetDescription>
            )}
          </SheetHeader>

          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                {children}
              </div>
            </div>

            <SheetFooter className="border-t px-4 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={requestClose}
                disabled={loading}
              >
                {cancelLabel}
              </Button>

              <Button
                type="submit"
                disabled={
                  loading || disabled
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

      <AlertDialog
        open={showDiscardWarning}
        onOpenChange={setShowDiscardWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Discard changes?
            </AlertDialogTitle>

            <AlertDialogDescription>
              You have unsaved changes. If you
              leave now, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Keep Editing
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={discardChanges}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}