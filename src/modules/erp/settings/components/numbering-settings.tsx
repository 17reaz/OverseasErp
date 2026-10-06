import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Hash,
  Loader2,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getCurrentNumbering,
  updateNumberingStart,
} from "../settings-service";

type NumberingEntity = "candidate" | "agent" | "agency";

interface NumberingRowProps {
  title: string;
  description: string;
  entity: NumberingEntity;
  enabled?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Numbering row                                                              */
/* -------------------------------------------------------------------------- */

function NumberingRow({
  title,
  description,
  entity,
  enabled = true,
}: NumberingRowProps) {
  const [currentHighest, setCurrentHighest] = useState(0);
  const [nextNumber, setNextNumber] = useState(1);
  const [newStartingNumber, setNewStartingNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const result = await getCurrentNumbering(entity);

      setCurrentHighest(result.currentHighest);
      setNextNumber(result.nextNumber);
    } catch (err) {
      console.error(err);
      setError("Failed to load numbering information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [entity]);

  async function handleSave() {
    const value = Number(newStartingNumber);

    setError(null);
    setSuccess(null);

    if (!Number.isInteger(value) || value < 1) {
      setError("Starting SL must be a valid positive number.");
      return;
    }

    if (value <= currentHighest) {
      setError(
        `Starting SL must be greater than current highest SL (${currentHighest}).`,
      );
      return;
    }

    try {
      setSaving(true);

      const result = await updateNumberingStart(entity, value);

      setNextNumber(result.nextNumber);
      setNewStartingNumber("");

      setSuccess(
        `Next ${title.replace(" SL", "")} SL will start from ${result.nextNumber}.`,
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save numbering setting.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="p-5">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:gap-6">
        {/* Title + stats */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
              <Hash className="size-4" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading numbering...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Current highest SL
                </p>
                <p className="mt-0.5 text-xl font-semibold">
                  {currentHighest}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Next SL</p>
                <p className="mt-0.5 text-xl font-semibold">{nextNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="min-w-0 lg:flex lg:flex-col lg:justify-center">
          {loading ? null : !enabled ? (
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Manual numbering control for this module will be enabled after
              its numbering engine is migrated to the settings system.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`${entity}-starting-number`}>
                  Change starting SL
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Use this when importing historical records or continuing an
                  existing numbering sequence.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`${entity}-starting-number`}
                  type="number"
                  min={currentHighest + 1}
                  placeholder={`e.g. ${currentHighest + 1}`}
                  value={newStartingNumber}
                  onChange={(event) => setNewStartingNumber(event.target.value)}
                  className="sm:max-w-xs"
                  disabled={saving}
                />

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !newStartingNumber.trim()}
                >
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Save
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Numbering settings                                                         */
/* -------------------------------------------------------------------------- */

export function NumberingSettings() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Numbering</h2>
        <p className="text-sm text-muted-foreground">
          Manage serial number sequences used across your ERP.
        </p>
      </div>

      <Card className="divide-y overflow-hidden">
        <NumberingRow
          title="Candidate SL"
          description="Control the serial number sequence used for candidates."
          entity="candidate"
          enabled
        />

        <div className="bg-muted/20">
          <NumberingRow
            title="Agent SL"
            description="View the serial number sequence used for agents."
            entity="agent"
            enabled={false}
          />
        </div>

        <div className="bg-muted/20">
          <NumberingRow
            title="Agency SL"
            description="View the serial number sequence used for agencies."
            entity="agency"
            enabled={false}
          />
        </div>
      </Card>
    </div>
  );
}