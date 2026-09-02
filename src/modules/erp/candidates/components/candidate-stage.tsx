// src/modules/erp/candidates/components/candidate-stage.tsx

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

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
 * Uses the module-wide UniversalSheet component.
 *
 * IMPORTANT:
 * - Does NOT modify global candidate stage engine.
 * - Only manages candidate.requested_services.
 * - Existing stage-service logic remains unchanged.
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

  const [initialServices, setInitialServices] =
    useState<RequestedServices>(getDefaultRequestedServices());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* =========================================================
   * LOAD REQUESTED SERVICES
   * ========================================================= */
  useEffect(() => {
    if (!open) return;

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const data = await fetchRequestedServices(candidateId);

        if (active) {
          setServices(data);
          setInitialServices(data);
        }
      } catch (error) {
        console.error(error);

        if (active) {
          toast.error(
            "Failed to load requested services.",
            "Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [open, candidateId]);

  /* =========================================================
   * TOGGLE SERVICE
   * ========================================================= */
  function toggleService(
    key: RequestedServiceKey,
    checked: boolean,
  ) {
    setServices((prev) => ({
      ...prev,
      [key]: checked,
    }));
  }

  /* =========================================================
   * CHECK UNSAVED CHANGES
   * ========================================================= */
  const hasChanges =
    JSON.stringify(services) !== JSON.stringify(initialServices);

  /* =========================================================
   * SAVE
   * ========================================================= */
  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading || saving) return;

    setSaving(true);

    try {
      await updateRequestedServices(candidateId, services);

      toast.success(
        "Requested services updated.",
        "Changes have been saved for this candidate.",
      );

      setInitialServices(services);

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

  /* =========================================================
   * RENDER
   * ========================================================= */
  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Requested Services"
      description={
        candidateName
          ? `Select which services apply to ${candidateName}.`
          : "Select which services apply to this candidate."
      }
      onSubmit={handleSave}
      submitLabel="Save Changes"
      cancelLabel="Cancel"
      loading={saving}
      disabled={loading}
      hasChanges={hasChanges}
    >
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading services...
            </span>
          </div>
        ) : (
          REQUESTED_SERVICE_DEFINITIONS.map(
            (definition, index) => (
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
                      toggleService(
                        definition.key,
                        checked,
                      )
                    }
                    disabled={saving}
                  />
                </div>

                {index <
                  REQUESTED_SERVICE_DEFINITIONS.length - 1 && (
                  <Separator />
                )}
              </div>
            ),
          )
        )}
      </div>
    </UniversalSheet>
  );
}
