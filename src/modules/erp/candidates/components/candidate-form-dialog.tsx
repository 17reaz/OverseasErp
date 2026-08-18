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
  createCandidate,
  updateCandidate,
  type Candidate,
  type CandidateInput,
} from "../candidate-service";

interface CandidateFormDialogProps {
  open: boolean;

  candidate?: Candidate | null;

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: (
    candidate: Candidate,
  ) => void;
}

const countries = [
  "Saudi Arabia",
  "Mauritius",
  "Laos",
  "Malaysia",
  "Belarus",
] as const;

export function CandidateFormDialog({
  open,
  candidate,
  onOpenChange,
  onSuccess,
}: CandidateFormDialogProps) {
  const isEdit = Boolean(candidate);

  const [passportNo, setPassportNo] =
    useState("");

  const [name, setName] =
    useState("");

  const [receivedDate, setReceivedDate] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [currentStage, setCurrentStage] =
    useState("Pending");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    if (!open) {
      return;
    }

    setPassportNo(
      candidate?.passport_no ?? "",
    );

    setName(
      candidate?.name ?? "",
    );

    setReceivedDate(
      candidate?.received_date ?? "",
    );

    setCountry(
      candidate?.country ?? "",
    );

    setCurrentStage(
      candidate?.current_stage ??
        "Pending",
    );

    setError(null);
  }, [
    open,
    candidate,
  ]);


  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!passportNo.trim()) {
      setError(
        "Passport number is required.",
      );

      return;
    }

    if (!name.trim()) {
      setError(
        "Candidate name is required.",
      );

      return;
    }

    try {
      setLoading(true);
      setError(null);

      const input: CandidateInput = {
        passport_no:
          passportNo.trim(),

        name:
          name.trim(),

        received_date:
          receivedDate || null,

        country:
          country
            ? (country as CandidateInput["country"])
            : null,

        /*
         * Agent dropdown আমরা next step-এ
         * properly connect করব।
         */
        agent_id:
          candidate?.agent_id ?? null,

        current_stage:
          currentStage.trim() ||
          "Pending",
      };

      const result = isEdit
        ? await updateCandidate(
            candidate!.id,
            input,
          )
        : await createCandidate(
            input,
          );

      if (result.error) {
        console.error(
          result.error,
        );

        if (
          result.error.code ===
          "23505"
        ) {
          setError(
            "This passport number already exists.",
          );
        } else {
          setError(
            result.error.message ||
              "Failed to save candidate.",
          );
        }

        return;
      }

      if (result.data) {
        onSuccess(
          result.data,
        );
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);

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
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[520px]">

        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Edit Candidate"
              : "Create Candidate"}
          </DialogTitle>

          <DialogDescription>
            {isEdit
              ? "Update candidate information."
              : "Add a new candidate."}
          </DialogDescription>
        </DialogHeader>


        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Passport */}

          <div className="space-y-2">
            <Label htmlFor="passport_no">
              Passport Number
            </Label>

            <Input
              id="passport_no"
              value={passportNo}
              onChange={(event) =>
                setPassportNo(
                  event.target.value,
                )
              }
              placeholder="A12345678"
              disabled={loading}
            />
          </div>


          {/* Name */}

          <div className="space-y-2">
            <Label htmlFor="candidate_name">
              Candidate Name
            </Label>

            <Input
              id="candidate_name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Full name"
              disabled={loading}
            />
          </div>


          {/* Received Date */}

          <div className="space-y-2">
            <Label htmlFor="received_date">
              Received Date
            </Label>

            <Input
              id="received_date"
              type="date"
              value={receivedDate}
              onChange={(event) =>
                setReceivedDate(
                  event.target.value,
                )
              }
              disabled={loading}
            />
          </div>


          {/* Country */}

          <div className="space-y-2">
            <Label htmlFor="country">
              Country
            </Label>

            <select
              id="country"
              value={country}
              onChange={(event) =>
                setCountry(
                  event.target.value,
                )
              }
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
            >
              <option value="">
                Select country
              </option>

              {countries.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </div>


          {/* Stage */}

          <div className="space-y-2">
            <Label htmlFor="current_stage">
              Current Stage
            </Label>

            <Input
              id="current_stage"
              value={currentStage}
              onChange={(event) =>
                setCurrentStage(
                  event.target.value,
                )
              }
              placeholder="Pending"
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
              disabled={loading}
            >
              {loading && (
                <Loader2 className="animate-spin" />
              )}

              {isEdit
                ? "Save Changes"
                : "Create Candidate"}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>
    </Dialog>
  );
}