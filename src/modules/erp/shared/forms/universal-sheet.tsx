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

  /**
   * Optional form submit handler.
   *
   * Existing forms can continue using this.
   * Non-form sheets can leave it undefined.
   */
  onSubmit?: (
    event: FormEvent<HTMLFormElement>,
  ) => void;

  submitLabel?: string;
  cancelLabel?: string;

  loading?: boolean;
  disabled?: boolean;
  hasChanges?: boolean;

  /**
   * Custom footer for special sheets.
   *
   * When provided, the default Save/Cancel footer
   * will be replaced by this footer.
   */
  footer?: ReactNode;
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
  footer,
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

  const content = (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      {children}
    </div>
  );

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

          {onSubmit ? (
            <form
              onSubmit={onSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              {content}

              {footer ? (
                <SheetFooter className="border-t px-6 py-4">
                  {footer}
                </SheetFooter>
              ) : (
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
              )}
            </form>
          ) : (
            <>
              {content}

              {footer && (
                <SheetFooter className="border-t px-6 py-4">
                  {footer}
                </SheetFooter>
              )}
            </>
          )}
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
