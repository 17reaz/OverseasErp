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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  createMedical,
  updateMedical,
  type Medical,
  type MedicalStatus,
} from "../medical-service";


interface CandidateOption {
  id: string;

  name: string;

  passport_no: string;
}


interface MedicalFormDialogProps {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  medical: Medical | null;

  onSuccess: () => void;
}


export function MedicalFormDialog({
  open,
  onOpenChange,
  medical,
  onSuccess,
}: MedicalFormDialogProps) {

  const [
    candidates,
    setCandidates,
  ] = useState<CandidateOption[]>(
    [],
  );

  const [
    candidateId,
    setCandidateId,
  ] = useState("");

  const [
    medicalDate,
    setMedicalDate,
  ] = useState("");

  const [
    fitDate,
    setFitDate,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<MedicalStatus>(
    "new",
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    candidatesLoading,
    setCandidatesLoading,
  ] = useState(false);


  // =====================================================
  // LOAD CANDIDATES
  // =====================================================

  useEffect(() => {

    if (!open) {
      return;
    }

    async function loadCandidates() {

      try {

        setCandidatesLoading(
          true,
        );

        const {
          data,
          error,
        } = await supabase
          .from("candidates")
          .select(
            "id, name, passport_no",
          )
          .eq(
            "is_deleted",
            false,
          )
          .eq(
            "is_returned",
            false,
          )
          .order(
            "sl",
            {
              ascending: false,
            },
          );

        if (error) {
          throw error;
        }

        setCandidates(
          data ?? [],
        );

      } catch (error) {

        console.error(
          error,
        );

        toast.error(
          "Failed to load candidates.",
          "Please try again.",
        );

      } finally {

        setCandidatesLoading(
          false,
        );

      }

    }

    loadCandidates();

  }, [
    open,
  ]);


  // =====================================================
  // LOAD FORM
  // =====================================================

  useEffect(() => {

    if (medical) {

      setCandidateId(
        medical.candidate_id,
      );

      setMedicalDate(
        medical.medical_date ??
          "",
      );

      setFitDate(
        medical.fit_date ??
          "",
      );

      setStatus(
        medical.status,
      );

      return;
    }

    setCandidateId("");
    setMedicalDate("");
    setFitDate("");
    setStatus("new");

  }, [
    medical,
    open,
  ]);


  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent,
  ) {

    event.preventDefault();

    if (!candidateId) {

      toast.error(
        "Candidate is required.",
        "Please select a candidate.",
      );

      return;
    }


    if (
      status === "fit" &&
      !fitDate
    ) {

      toast.error(
        "Fit date is required.",
        "Please select the date the candidate was marked fit.",
      );

      return;
    }


    try {

      setLoading(true);


      const input = {
        candidate_id:
          candidateId,

        medical_date:
          medicalDate ||
          null,

        fit_date:
          status === "fit"
            ? fitDate ||
              null
            : null,

        status,
      };


      const result =
        medical
          ? await updateMedical(
              medical.id,
              input,
            )
          : await createMedical(
              input,
            );


      if (
        result.error
      ) {

        console.error(
          result.error,
        );

        toast.error(
          medical
            ? "Failed to update medical."
            : "Failed to create medical.",
          result.error.message ||
            "Please try again.",
        );

        return;
      }


      toast.success(
        medical
          ? "Medical updated."
          : "Medical created.",
        medical
          ? "The medical record was updated successfully."
          : "The medical record was created successfully.",
      );


      onSuccess();

    } catch (error) {

      console.error(
        error,
      );

      toast.error(
        "Something went wrong.",
        "Please try again.",
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

      <DialogContent>

        <DialogHeader>

          <DialogTitle>
            {medical
              ? "Edit Medical"
              : "Add Medical"}
          </DialogTitle>

          <DialogDescription>
            Create or update the medical record for a candidate.
          </DialogDescription>

        </DialogHeader>


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          {/* Candidate */}

          <div className="space-y-2">

            <Label>
              Candidate
            </Label>

            <Select
              value={
                candidateId
              }
              onValueChange={
                setCandidateId
              }
              disabled={
                candidatesLoading ||
                Boolean(medical)
              }
            >

              <SelectTrigger>

                <SelectValue
                  placeholder={
                    candidatesLoading
                      ? "Loading candidates..."
                      : "Select candidate"
                  }
                />

              </SelectTrigger>


              <SelectContent>

                {candidates.map(
                  (
                    candidate,
                  ) => (

                    <SelectItem
                      key={
                        candidate.id
                      }
                      value={
                        candidate.id
                      }
                    >
                      {
                        candidate.name
                      }{" "}
                      —{" "}
                      {
                        candidate.passport_no
                      }
                    </SelectItem>

                  ),
                )}

              </SelectContent>

            </Select>

          </div>


          {/* Medical Date */}

          <div className="space-y-2">

            <Label htmlFor="medical-date">
              Medical Date
            </Label>

            <Input
              id="medical-date"
              type="date"
              value={
                medicalDate
              }
              onChange={(
                event,
              ) =>
                setMedicalDate(
                  event.target.value,
                )
              }
            />

          </div>


          {/* Status */}

          <div className="space-y-2">

            <Label>
              Status
            </Label>

            <Select
              value={
                status
              }
              onValueChange={(
                value,
              ) =>
                setStatus(
                  value as MedicalStatus,
                )
              }
            >

              <SelectTrigger>

                <SelectValue />

              </SelectTrigger>


              <SelectContent>

                <SelectItem value="new">
                  New
                </SelectItem>

                <SelectItem value="fit">
                  Fit
                </SelectItem>

                <SelectItem value="unfit">
                  Unfit
                </SelectItem>

                <SelectItem value="expired">
                  Expired
                </SelectItem>

              </SelectContent>

            </Select>

          </div>


          {/* Fit Date */}

          {status === "fit" && (

            <div className="space-y-2">

              <Label htmlFor="fit-date">
                Fit Date
              </Label>

              <Input
                id="fit-date"
                type="date"
                value={
                  fitDate
                }
                onChange={(
                  event,
                ) =>
                  setFitDate(
                    event.target.value,
                  )
                }
              />

            </div>

          )}


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
              disabled={
                loading
              }
            >
              Cancel
            </Button>


            <Button
              type="submit"
              disabled={
                loading ||
                candidatesLoading
              }
            >

              {loading && (
                <Loader2 className="animate-spin" />
              )}

              {medical
                ? "Update Medical"
                : "Create Medical"}

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  );
}