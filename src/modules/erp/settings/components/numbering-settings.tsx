import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Hash,
  Loader2,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  getCurrentNumbering,
  updateNumberingStart,
} from "../settings-service";

type NumberingEntity =
  | "candidate"
  | "agent"
  | "agency";

interface NumberingCardProps {
  title: string;
  description: string;
  entity: NumberingEntity;
  enabled?: boolean;
}

function NumberingCard({
  title,
  description,
  entity,
  enabled = true,
}: NumberingCardProps) {
  const [currentHighest, setCurrentHighest] = useState(0);
  const [nextNumber, setNextNumber] = useState(1);
  const [newStartingNumber, setNewStartingNumber] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [success, setSuccess] = useState<string | null>(
    null,
  );

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const result = await getCurrentNumbering(entity);

      setCurrentHighest(result.currentHighest);
      setNextNumber(result.nextNumber);
    } catch (err) {
      console.error(err);

      setError(
        "Failed to load numbering information.",
      );
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
      setError(
        "Starting SL must be a valid positive number.",
      );
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

      const result = await updateNumberingStart(
        entity,
        value,
      );

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
    <Card
      className={
        !enabled
          ? "opacity-60"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
            <Hash className="size-4" />
          </div>

          <div className="min-w-0">
            <CardTitle className="text-base">
              {title}
            </CardTitle>

            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading numbering...
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Current highest SL
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {currentHighest}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Next SL
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {nextNumber}
                </p>
              </div>
            </div>

            <Separator />

            {!enabled ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                Manual numbering control for this module
                will be enabled after its numbering engine
                is migrated to the settings system.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <Label
                      htmlFor={`${entity}-starting-number`}
                    >
                      Change starting SL
                    </Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Use this when importing historical
                      records or continuing an existing
                      numbering sequence.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id={`${entity}-starting-number`}
                      type="number"
                      min={currentHighest + 1}
                      placeholder={`e.g. ${
                        currentHighest + 1
                      }`}
                      value={newStartingNumber}
                      onChange={(event) =>
                        setNewStartingNumber(
                          event.target.value,
                        )
                      }
                      className="sm:max-w-xs"
                      disabled={saving}
                    />

                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={
                        saving ||
                        !newStartingNumber.trim()
                      }
                    >
                      {saving ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 size-4" />
                      )}

                      Save
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />

                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

                    <span>{success}</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function NumberingSettings() {
  return (
    <div className="space-y-6">
      <NumberingCard
        title="Candidate SL"
        description="Control the serial number sequence used for candidates."
        entity="candidate"
        enabled
      />

      <NumberingCard
        title="Agent SL"
        description="View the serial number sequence used for agents."
        entity="agent"
        enabled={false}
      />

      <NumberingCard
        title="Agency SL"
        description="View the serial number sequence used for agencies."
        entity="agency"
        enabled={false}
      />
    </div>
  );
}