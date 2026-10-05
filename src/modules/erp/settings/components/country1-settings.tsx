import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Globe2,
  Pencil,
  Plus,
  Power,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { toast } from "@/components/shared/toast/toast";

/* =========================================================
 * TYPES
 * ========================================================= */

interface CountryModule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface CountryConfig {
  id: string;
  name: string;
  code: string;
  flag: string;
  enabled: boolean;
  modules: CountryModule[];
}

/* =========================================================
 * CONSTANTS
 * ========================================================= */

const STORAGE_KEY = "erp:country-configurations";

const DEFAULT_MODULES: Omit<CountryModule, "enabled">[] = [
  {
    id: "candidates",
    label: "Candidates",
    description: "Candidate registration and management.",
  },
  {
    id: "medical",
    label: "Medical",
    description: "Medical processing and fitness management.",
  },
  {
    id: "mofa",
    label: "MOFA",
    description: "MOFA application and processing.",
  },
  {
    id: "finger",
    label: "Finger",
    description: "Fingerprint and biometric processing.",
  },
  {
    id: "pcc",
    label: "PCC",
    description: "Police clearance certificate processing.",
  },
  {
    id: "takamul",
    label: "Takamul",
    description: "Takamul registration and processing.",
  },
  {
    id: "visa",
    label: "Visa",
    description: "Visa processing and tracking.",
  },
  {
    id: "bmet",
    label: "BMET / Manpower",
    description: "BMET, manpower and clearance processing.",
  },
  {
    id: "flight",
    label: "Flight",
    description: "Flight booking and departure management.",
  },
  {
    id: "iqama",
    label: "Iqama",
    description: "Iqama processing and completion tracking.",
  },
];

const DEFAULT_COUNTRIES: CountryConfig[] = [
  {
    id: "bangladesh",
    name: "Bangladesh",
    code: "BD",
    flag: "🇧🇩",
    enabled: true,
    modules: DEFAULT_MODULES.map((module) => ({
      ...module,
      enabled: true,
    })),
  },
  {
    id: "saudi-arabia",
    name: "Saudi Arabia",
    code: "SA",
    flag: "🇸🇦",
    enabled: true,
    modules: DEFAULT_MODULES.map((module) => ({
      ...module,
      enabled: true,
    })),
  },
  {
    id: "japan",
    name: "Japan",
    code: "JP",
    flag: "🇯🇵",
    enabled: true,
    modules: DEFAULT_MODULES.map((module) => ({
      ...module,
      enabled: [
        "candidates",
        "medical",
        "visa",
        "flight",
        "iqama",
      ].includes(module.id),
    })),
  },
];

/* =========================================================
 * HELPERS
 * ========================================================= */

function createCountryId(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    `country-${Date.now()}`
  );
}

function createModules(): CountryModule[] {
  return DEFAULT_MODULES.map((module) => ({
    ...module,
    enabled: true,
  }));
}

function loadCountries(): CountryConfig[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_COUNTRIES;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_COUNTRIES;
    }

    return parsed;
  } catch {
    return DEFAULT_COUNTRIES;
  }
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

export function CountrySettings1() {
  const [countries, setCountries] =
    useState<CountryConfig[]>(loadCountries);

  const [selectedCountryId, setSelectedCountryId] =
    useState<string | null>(
      countries[0]?.id ?? null,
    );

  const [isAdding, setIsAdding] =
    useState(false);

  const [editingCountryId, setEditingCountryId] =
    useState<string | null>(null);

  const [countryName, setCountryName] =
    useState("");

  const [countryCode, setCountryCode] =
    useState("");

  const [countryFlag, setCountryFlag] =
    useState("");

  const [expandedCountryId, setExpandedCountryId] =
    useState<string | null>(
      countries[0]?.id ?? null,
    );

  /* -------------------------------------------------------
   * PERSIST
   * ------------------------------------------------------- */

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(countries),
    );
  }, [countries]);

  /* -------------------------------------------------------
   * SELECTED COUNTRY
   * ------------------------------------------------------- */

 
  /* -------------------------------------------------------
   * COUNTRY FORM
   * ------------------------------------------------------- */

  function resetForm() {
    setCountryName("");
    setCountryCode("");
    setCountryFlag("");
    setEditingCountryId(null);
    setIsAdding(false);
  }

  function startAddCountry() {
    resetForm();
    setIsAdding(true);
  }

  function startEditCountry(
    country: CountryConfig,
  ) {
    setCountryName(country.name);
    setCountryCode(country.code);
    setCountryFlag(country.flag);
    setEditingCountryId(country.id);
    setIsAdding(true);
  }

  function saveCountry() {
    const name = countryName.trim();
    const code = countryCode.trim().toUpperCase();
    const flag = countryFlag.trim();

    if (!name) {
      toast.error(
        "Country name is required.",
        "Please enter a country name.",
      );
      return;
    }

    if (!code) {
      toast.error(
        "Country code is required.",
        "Please enter a country code.",
      );
      return;
    }

    if (editingCountryId) {
      setCountries((current) =>
        current.map((country) =>
          country.id === editingCountryId
            ? {
                ...country,
                name,
                code,
                flag: flag || "🌍",
              }
            : country,
        ),
      );

      toast.success(
        "Country updated.",
        `${name} configuration has been updated.`,
      );
    } else {
      const duplicate = countries.some(
        (country) =>
          country.code.toLowerCase() ===
          code.toLowerCase(),
      );

      if (duplicate) {
        toast.error(
          "Country already exists.",
          `A country with code ${code} already exists.`,
        );
        return;
      }

      const newCountry: CountryConfig = {
        id: createCountryId(name),
        name,
        code,
        flag: flag || "🌍",
        enabled: true,
        modules: createModules(),
      };

      setCountries((current) => [
        ...current,
        newCountry,
      ]);

      setSelectedCountryId(newCountry.id);
      setExpandedCountryId(newCountry.id);

      toast.success(
        "Country added.",
        `${name} has been added to country configuration.`,
      );
    }

    resetForm();
  }

  /* -------------------------------------------------------
   * COUNTRY STATUS
   * ------------------------------------------------------- */

  function toggleCountry(
    countryId: string,
    enabled: boolean,
  ) {
    setCountries((current) =>
      current.map((country) =>
        country.id === countryId
          ? {
              ...country,
              enabled,
            }
          : country,
      ),
    );

    const country = countries.find(
      (item) => item.id === countryId,
    );

    if (country) {
      toast.success(
        enabled
          ? "Country enabled."
          : "Country disabled.",
        country.name,
      );
    }
  }

  /* -------------------------------------------------------
   * DELETE COUNTRY
   * ------------------------------------------------------- */

  function deleteCountry(
    countryId: string,
  ) {
    const country = countries.find(
      (item) => item.id === countryId,
    );

    if (!country) {
      return;
    }

    if (
      !window.confirm(
        `Delete ${country.name} country configuration?`,
      )
    ) {
      return;
    }

    setCountries((current) =>
      current.filter(
        (item) => item.id !== countryId,
      ),
    );

    if (selectedCountryId === countryId) {
      const remaining = countries.filter(
        (item) => item.id !== countryId,
      );

      setSelectedCountryId(
        remaining[0]?.id ?? null,
      );
    }

    if (expandedCountryId === countryId) {
      setExpandedCountryId(null);
    }

    toast.success(
      "Country removed.",
      `${country.name} configuration has been removed.`,
    );
  }

  /* -------------------------------------------------------
   * MODULE TOGGLE
   * ------------------------------------------------------- */

  function toggleModule(
    countryId: string,
    moduleId: string,
    enabled: boolean,
  ) {
    setCountries((current) =>
      current.map((country) => {
        if (country.id !== countryId) {
          return country;
        }

        return {
          ...country,
          modules: country.modules.map(
            (module) =>
              module.id === moduleId
                ? {
                    ...module,
                    enabled,
                  }
                : module,
          ),
        };
      }),
    );
  }

  /* -------------------------------------------------------
   * COUNTS
   * ------------------------------------------------------- */

  function getEnabledModuleCount(
    country: CountryConfig,
  ) {
    return country.modules.filter(
      (module) => module.enabled,
    ).length;
  }

  /* -------------------------------------------------------
   * RENDER
   * ------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Country Configuration
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure which countries your organization operates
            in and which ERP modules are available for each country.
          </p>
        </div>

        <Button
          type="button"
          onClick={startAddCountry}
        >
          <Plus className="mr-2 size-4" />
          Add Country
        </Button>
      </div>

      {/* Add / Edit */}
      {isAdding && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {editingCountryId
                ? "Edit Country"
                : "Add Country"}
            </CardTitle>

            <CardDescription>
              Configure the basic country information.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="country-name">
                  Country Name
                </Label>

                <Input
                  id="country-name"
                  value={countryName}
                  onChange={(event) =>
                    setCountryName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Saudi Arabia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country-code">
                  Country Code
                </Label>

                <Input
                  id="country-code"
                  maxLength={3}
                  value={countryCode}
                  onChange={(event) =>
                    setCountryCode(
                      event.target.value
                        .toUpperCase(),
                    )
                  }
                  placeholder="SA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country-flag">
                  Flag
                </Label>

                <Input
                  id="country-flag"
                  maxLength={4}
                  value={countryFlag}
                  onChange={(event) =>
                    setCountryFlag(
                      event.target.value,
                    )
                  }
                  placeholder="🇸🇦"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveCountry}
              >
                <Check className="mr-2 size-4" />
                {editingCountryId
                  ? "Save Changes"
                  : "Add Country"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Country list */}
      {countries.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Globe2 className="size-5 text-muted-foreground" />
            </div>

            <h3 className="font-medium">
              No countries configured
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Add your first operating country to configure
              country-specific ERP modules.
            </p>

            <Button
              type="button"
              className="mt-4"
              onClick={startAddCountry}
            >
              <Plus className="mr-2 size-4" />
              Add Country
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {countries.map((country) => {
            const isExpanded =
              expandedCountryId ===
              country.id;

            const enabledModuleCount =
              getEnabledModuleCount(country);

            return (
              <Card
                key={country.id}
                className={
                  country.enabled
                    ? undefined
                    : "opacity-70"
                }
              >
                {/* Country header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() =>
                        setExpandedCountryId(
                          isExpanded
                            ? null
                            : country.id,
                        )
                      }
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-2xl">
                        {country.flag}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">
                            {country.name}
                          </CardTitle>

                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {country.code}
                          </Badge>

                          {!country.enabled && (
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              Disabled
                            </Badge>
                          )}
                        </div>

                        <CardDescription className="mt-1">
                          {enabledModuleCount} of{" "}
                          {country.modules.length}{" "}
                          modules enabled
                        </CardDescription>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <div className="mr-2 hidden items-center gap-2 sm:flex">
                        <Power className="size-3.5 text-muted-foreground" />

                        <Switch
                          checked={country.enabled}
                          onCheckedChange={(checked) =>
                            toggleCountry(
                              country.id,
                              checked,
                            )
                          }
                          aria-label={`Enable ${country.name}`}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          startEditCountry(
                            country,
                          )
                        }
                      >
                        <Pencil className="size-4" />

                        <span className="sr-only">
                          Edit {country.name}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deleteCountry(
                            country.id,
                          )
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />

                        <span className="sr-only">
                          Delete {country.name}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpandedCountryId(
                            isExpanded
                              ? null
                              : country.id,
                          )
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}

                        <span className="sr-only">
                          Toggle modules
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Modules */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />

                    <div className="grid gap-2 md:grid-cols-2">
                      {country.modules.map(
                        (module) => (
                          <div
                            key={module.id}
                            className={`
                              flex items-center justify-between gap-4
                              rounded-lg border p-3
                              transition-colors
                              ${
                                module.enabled
                                  ? "bg-background"
                                  : "bg-muted/30"
                              }
                            `}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {module.label}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {
                                  module.description
                                }
                              </p>
                            </div>

                            <Switch
                              checked={
                                module.enabled
                              }
                              disabled={
                                !country.enabled
                              }
                              onCheckedChange={(
                                checked,
                              ) =>
                                toggleModule(
                                  country.id,
                                  module.id,
                                  checked,
                                )
                              }
                              aria-label={`${module.label} for ${country.name}`}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Info */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex gap-3 p-4">
          <Globe2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <div>
            <p className="text-sm font-medium">
              Country-specific modules
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              These settings control the module configuration for
              each operating country. ERP navigation and business
              logic will be connected to this configuration later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}