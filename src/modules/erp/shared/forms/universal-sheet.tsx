// src/modules/erp/shared/forms/universal-sheet.tsx

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
  const [discardOpen, setDiscardOpen] =
    useState(false);

  function handleCloseRequest() {
    if (loading) return;

    if (hasChanges) {
      setDiscardOpen(true);
      return;
    }

    onOpenChange(false);
  }

  function handleDiscard() {
    setDiscardOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            handleCloseRequest();
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
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>

            <SheetFooter className="border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseRequest}
                disabled={loading}
              >
                {cancelLabel}
              </Button>

              <Button
                type="submit"
                disabled={loading || disabled}
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
        open={discardOpen}
        onOpenChange={setDiscardOpen}
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