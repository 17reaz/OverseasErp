import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  returnCandidate,
  type Candidate,
} from "../candidate-service";


interface CandidateReturnDialogProps {
  open: boolean;

  candidate:
    Candidate | null;

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: (
    candidate: Candidate,
  ) => void;
}


export function CandidateReturnDialog({
  open,
  candidate,
  onOpenChange,
  onSuccess,
}: CandidateReturnDialogProps) {

  const [
    returnedDate,
    setReturnedDate,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  // =====================================================
  // RESET
  // =====================================================

  useEffect(() => {

    if (!open) {
      return;
    }

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    setReturnedDate(
      candidate?.returned_date ??
        today,
    );

    setError(null);

  }, [
    open,
    candidate,
  ]);


  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent,
  ) {

    event.preventDefault();

    if (!candidate) {
      return;
    }

    if (!returnedDate) {

      setError(
        "Returned date is required.",
      );

      return;
    }


    try {

      setLoading(true);

      setError(null);


      const {
        data,
        error,
      } =
        await returnCandidate(
          candidate.id,
          returnedDate,
        );


      if (error) {

        console.error(
          error,
        );

        setError(
          error.message ||
            "Failed to mark candidate as returned.",
        );

        return;
      }


      if (data) {
        onSuccess(data);
      }


      onOpenChange(false);

    } catch (error) {

      console.error(
        error,
      );

      setError(
        "Something went wrong. Please try again.",
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >

      <DialogContent
        className="sm:max-w-[440px]"
      >

        <DialogHeader>

          <DialogTitle>
            Mark Candidate as Returned
          </DialogTitle>

          <DialogDescription>

            This will mark{" "}
            <strong>
              {candidate?.name}
            </strong>{" "}
            as returned.

            The current workflow stage
            will remain unchanged.

          </DialogDescription>

        </DialogHeader>


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          {/* Candidate */}

          <div className="space-y-1">

            <p className="text-sm font-medium">
              Candidate
            </p>

            <p className="text-sm text-muted-foreground">
              {candidate?.name}
            </p>

          </div>


          {/* Current Stage */}

          <div className="space-y-1">

            <p className="text-sm font-medium">
              Current Stage
            </p>

            <p className="text-sm text-muted-foreground">
              {candidate?.current_stage ??
                "Pending"}
            </p>

          </div>


          {/* Returned Date */}

          <div className="space-y-2">

            <Label
              htmlFor="returned-date"
            >
              Returned Date
            </Label>

            <Input
              id="returned-date"
              type="date"
              value={
                returnedDate
              }
              onChange={(event) =>
                setReturnedDate(
                  event.target.value,
                )
              }
              disabled={loading}
            />

          </div>


          {/* Error */}

          {error && (

            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">

              {error}

            </div>

          )}


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={loading}
            >
              Cancel
            </Button>


            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
            >

              {loading && (
                <Loader2
                  className="animate-spin"
                />
              )}

              Mark as Returned

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  );
}