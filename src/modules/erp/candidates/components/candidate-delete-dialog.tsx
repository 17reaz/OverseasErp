import React from "react";
import {
  Loader2,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  deleteCandidate,
  type Candidate,
} from "../candidate-service";

interface CandidateDeleteDialogProps {
  open: boolean;

  candidate: Candidate | null;

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: (
    id: string,
  ) => void;
}

export function CandidateDeleteDialog({
  open,
  candidate,
  onOpenChange,
  onSuccess,
}: CandidateDeleteDialogProps) {
  const [loading, setLoading] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);


  async function handleDelete() {
    if (!candidate) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        error,
      } = await deleteCandidate(
        candidate.id,
      );

      if (error) {
        console.error(error);

        setError(
          error.message ||
            "Failed to delete candidate.",
        );

        return;
      }

      onSuccess(
        candidate.id,
      );

      onOpenChange(false);
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[420px]">

        <DialogHeader>
          <DialogTitle>
            Delete Candidate
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong>
              {candidate?.name}
            </strong>
            ?
            <br />
            This candidate will be removed
            from the active list.
          </DialogDescription>
        </DialogHeader>


        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}


        <DialogFooter>

          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}

            Delete
          </Button>

        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}