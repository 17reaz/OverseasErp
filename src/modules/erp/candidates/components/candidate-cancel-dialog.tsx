import { useState } from "react";
import { Loader2 } from "lucide-react";

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

import { Textarea } from "@/components/ui/textarea";

import {
  cancelCandidate,
  getCandidateById,
} from "../candidate-service";

import type { Candidate } from "../candidate-types";


interface CandidateCancelDialogProps {
  open: boolean;
  candidate: Candidate | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (candidate: Candidate) => void;
}


export function CandidateCancelDialog({
  open,
  candidate,
  onOpenChange,
  onSuccess,
}: CandidateCancelDialogProps) {

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleOpenChange = (value: boolean) => {

    if (!value) {
      setReason("");
      setError(null);
    }

    onOpenChange(value);

  };


  const handleSubmit = async () => {

    if (!candidate) {
      return;
    }


    const cleanReason = reason.trim();


    if (!cleanReason) {

      setError(
        "Cancellation reason is required.",
      );

      return;

    }


    try {

      setLoading(true);
      setError(null);


      await cancelCandidate(
        candidate.id,
        cleanReason,
      );


      const updatedCandidate =
        await getCandidateById(
          candidate.id,
        );


      if (updatedCandidate) {

        onSuccess(
          updatedCandidate,
        );

      }


      handleOpenChange(false);


    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel candidate.",
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >

      <AlertDialogContent>

        <AlertDialogHeader>

          <AlertDialogTitle>
            Cancel Candidate
          </AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to cancel this
            candidate? The candidate data will remain
            in the system and can be reactivated later.
          </AlertDialogDescription>

        </AlertDialogHeader>


        <div className="space-y-2">

          <label
            htmlFor="cancel-reason"
            className="text-sm font-medium"
          >
            Cancellation reason
          </label>


          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Enter cancellation reason..."
            disabled={loading}
          />


          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

        </div>


        <AlertDialogFooter>

          <AlertDialogCancel
            disabled={loading}
          >
            Keep Candidate
          </AlertDialogCancel>


          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
            disabled={
              loading ||
              !reason.trim()
            }
          >

            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Cancel Candidate

          </AlertDialogAction>

        </AlertDialogFooter>

      </AlertDialogContent>

    </AlertDialog>
  );

}
