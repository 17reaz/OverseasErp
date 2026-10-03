import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Globe2,
  Loader2,
  Plus,
  Save,
  Trash2,
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
import { Switch } from "@/components/ui/switch";

import {
  DEFAULT_COUNTRIES,
  getTenantCountries,
  saveTenantCountries,
  type TenantCountry,
} from "../country-settings-service";

export function CountrySettings() {
  const [countries, setCountries] =
    useState<TenantCountry[]>(DEFAULT_COUNTRIES);

  const [newCountry, setNewCountry] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadCountries() {
    try {
      setLoading(true);
      setError(null);

      const result = await getTenantCountries();

      setCountries(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load country settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCountries();
  }, []);

  function handleToggle(
    countryName: string,
    enabled: boolean,
  ) {
    setCountries((current) =>
      current.map((country) =>
        country.name === countryName
          ? {
              ...country,
              enabled,
            }
          : country,
      ),
    );

    setSuccess(null);
    setError(null);
  }

  function handleAddCountry() {
    const name = newCountry.trim();

    if (!name) {
      return;
    }

    const alreadyExists = countries.some(
      (country) =>
        country.name.toLowerCase() === name.toLowerCase(),
    );

    if (alreadyExists) {
      setError("This country already exists.");
      return;
    }

    setCountries((current) => [
      ...current,
      {
        name,
        enabled: true,
      },
    ]);

    setNewCountry("");
    setError(null);
    setSuccess(null);
  }

  function handleRemoveCountry(name: string) {
    setCountries((current) =>
      current.filter(
        (country) => country.name !== name,
      ),
    );

    setSuccess(null);
    setError(null);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const saved = await saveTenantCountries(
        countries,
      );

      setCountries(saved);

      setSuccess(
        "Country settings saved successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save country settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
            <Globe2 className="size-4" />
          </div>

          <div className="min-w-0">
            <CardTitle className="text-base">
              Countries
            </CardTitle>

            <CardDescription className="mt-1">
              Manage the countries available for your
              tenant.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading countries...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {countries.map((country) => (
                <div
                  key={country.name}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {country.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {country.enabled
                        ? "Available in the ERP"
                        : "Disabled"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={country.enabled}
                      onCheckedChange={(checked) =>
                        handleToggle(
                          country.name,
                          checked,
                        )
                      }
                      disabled={saving}
                      aria-label={`Enable ${country.name}`}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRemoveCountry(
                          country.name,
                        )
                      }
                      disabled={saving}
                      aria-label={`Remove ${country.name}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label htmlFor="new-country">
                  Add Country
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add a new country to your tenant.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="new-country"
                  placeholder="e.g. Japan"
                  value={newCountry}
                  onChange={(event) =>
                    setNewCountry(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddCountry();
                    }
                  }}
                  disabled={saving}
                  className="sm:max-w-sm"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCountry}
                  disabled={
                    saving || !newCountry.trim()
                  }
                >
                  <Plus className="mr-2 size-4" />
                  Add
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

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}

                Save Countries
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}