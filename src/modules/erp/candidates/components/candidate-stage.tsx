// src/modules/erp/candidates/components/candidate-stage.tsx

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { toast } from "@/components/shared/toast/toast";

import {
  REQUESTED_SERVICE_DEFINITIONS,
  fetchRequestedServices,
  getDefaultRequestedServices,
  updateRequestedServices,
  type RequestedServiceKey,
  type RequestedServices,
} from "../stage-service";

/* =========================================================
 * CANDIDATE REQUESTED SERVICES SHEET
 * ---------------------------------------------------------
 * "Universal sheet" pattern (ModuleRecordsSheet-এর মতো
 * Sheet + Header/Footer layout) follow করে বানানো — কিন্তু
 * এটা independent, নিজের candidate-stage.tsx-এই self
 * contained। কোনো existing engine touch করা হয়নি।
 *
 * NOTE (temporary):
 * নাম "candidate-stage" হলেও এটা global workflow stage না —
 * শুধু candidate.requested_services (jsonb) toggle করে। এখন
 * এই নামেই রাখা হচ্ছে, future cleanup-এ rename হবে।
 * ========================================================= */

interface CandidateStageSheetProps {
  candidateId: string;
  candidateName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CandidateStageSheet({
  candidateId,
  candidateName,
  open,
  onOpenChange,
  onSuccess,
}: CandidateStageSheetProps) {
  const [services, setServices] = useState<RequestedServices>(
    getDefaultRequestedServices(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const data = await fetchRequestedServices(candidateId);
        if (active) setServices(data);
      } catch (error) {
        console.error(error);

        if (active) {
          toast.error(
            "Failed to load requested services.",
            "Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [open, candidateId]);

  function toggleService(key: RequestedServiceKey, checked: boolean) {
    setServices((prev) => ({ ...prev, [key]: checked }));
  }

  function handleClose() {
    if (saving) return;
    onOpenChange(false);
  }

  async function handleSave() {
    setSaving(true);

    try {
      await updateRequestedServices(candidateId, services);

      toast.success(
        "Requested services updated.",
        "Changes have been saved for this candidate.",
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to update requested services.",
        "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Requested Services</SheetTitle>

          <SheetDescription>
            {candidateName
              ? `Select which services apply to ${candidateName}.`
              : "Select which services apply to this candidate."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading services...
            </p>
          ) : (
            REQUESTED_SERVICE_DEFINITIONS.map((definition, index) => (
              <div key={definition.key}>
                <div className="flex items-center justify-between gap-4 py-3">
                  <Label
                    htmlFor={`requested-service-${definition.key}`}
                    className="text-sm font-medium"
                  >
                    {definition.label}
                  </Label>

                  <Switch
                    id={`requested-service-${definition.key}`}
                    checked={services[definition.key]}
                    onCheckedChange={(checked) =>
                      toggleService(definition.key, checked)
                    }
                    disabled={saving}
                  />
                </div>

                {index < REQUESTED_SERVICE_DEFINITIONS.length - 1 && (
                  <Separator />
                )}
              </div>
            ))
          )}
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button type="button" onClick={handleSave} disabled={loading || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
