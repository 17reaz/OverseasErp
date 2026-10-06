import { useEffect, useState } from "react";
import {
  ChevronDown,
  Globe2,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
      enabled: ["candidates", "medical", "visa", "flight", "iqama"].includes(
        module.id,
      ),
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
      .replace(/^-+|-+$/g, "") || `country-${Date.now()}`
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
  const [countries, setCountries] = useState<CountryConfig[]>(loadCountries);

  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    countries[0]?.id ?? null,
  );

  const [isAdding, setIsAdding] = useState(false);
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);

  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryFlag, setCountryFlag] = useState("");

  const [expandedCountryId, setExpandedCountryId] = useState<string | null>(
    countries[0]?.id ?? null,
  );

  // UI only: which country is waiting for delete confirmation
  const [countryToDelete, setCountryToDelete] = useState<CountryConfig | null>(
    null,
  );

  /* -------------------------------------------------------
   * PERSIST
   * ------------------------------------------------------- */

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(countries));
  }, [countries]);

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

  function startEditCountry(country: CountryConfig) {
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
      toast.error("Country name is required.", "Please enter a country name.");
      return;
    }

    if (!code) {
      toast.error("Country code is required.", "Please enter a country code.");
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
        (country) => country.code.toLowerCase() === code.toLowerCase(),
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

      setCountries((current) => [...current, newCountry]);

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

  function toggleCountry(countryId: string, enabled: boolean) {
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

    const country = countries.find((item) => item.id === countryId);

    if (country) {
      toast.success(
        enabled ? "Country enabled." : "Country disabled.",
        country.name,
      );
    }
  }

  /* -------------------------------------------------------
   * DELETE COUNTRY (confirmation is now an AlertDialog)
   * ------------------------------------------------------- */

  function deleteCountry(countryId: string) {
    const country = countries.find((item) => item.id === countryId);

    if (!country) {
      return;
    }

    setCountries((current) => current.filter((item) => item.id !== countryId));

    if (selectedCountryId === countryId) {
      const remaining = countries.filter((item) => item.id !== countryId);

      setSelectedCountryId(remaining[0]?.id ?? null);
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
          modules: country.modules.map((module) =>
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

  function getEnabledModuleCount(country: CountryConfig) {
    return country.modules.filter((module) => module.enabled).length;
  }

  /* -------------------------------------------------------
   * RENDER
   * ------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Country configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose the countries you operate in and the ERP modules available
            for each one.
          </p>
        </div>

        <Button type="button" onClick={startAddCountry}>
          <Plus className="size-4" />
          Add country
        </Button>
      </div>

      {/* Country list */}
      {countries.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Globe2 className="size-5 text-muted-foreground" />
            </div>

            <h3 className="font-medium">No countries configured</h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first operating country to set up its ERP modules.
            </p>

            <Button type="button" className="mt-4" onClick={startAddCountry}>
              <Plus className="size-4" />
              Add country
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {countries.map((country) => {
            const isExpanded = expandedCountryId === country.id;
            const enabledModuleCount = getEnabledModuleCount(country);

            return (
              <Card key={country.id}>
                {/* Country header */}
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        !country.enabled && "opacity-60",
                      )}
                      onClick={() =>
                        setExpandedCountryId(isExpanded ? null : country.id)
                      }
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-2xl">
                        {country.flag}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">
                            {country.name}
                          </CardTitle>

                          <Badge variant="secondary">{country.code}</Badge>

                          {!country.enabled && (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>

                        <CardDescription className="mt-1">
                          {enabledModuleCount} of {country.modules.length}{" "}
                          modules enabled
                        </CardDescription>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <Switch
                        checked={country.enabled}
                        onCheckedChange={(checked) =>
                          toggleCountry(country.id, checked)
                        }
                        aria-label={`Enable ${country.name}`}
                        className="mr-1"
                      />

                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">
                              Actions for {country.name}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => startEditCountry(country)}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setCountryToDelete(country)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpandedCountryId(isExpanded ? null : country.id)
                        }
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                        <span className="sr-only">Toggle modules</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Modules */}
                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0">
                    <Separator className="mb-4" />

                    <div className="grid gap-2 md:grid-cols-2">
                      {country.modules.map((module) => (
                        <div
                          key={module.id}
                          className={cn(
                            "flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors",
                            module.enabled ? "bg-background" : "bg-muted/30",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {module.label}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          </div>

                          <Switch
                            checked={module.enabled}
                            disabled={!country.enabled}
                            onCheckedChange={(checked) =>
                              toggleModule(country.id, module.id, checked)
                            }
                            aria-label={`${module.label} for ${country.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Note */}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        These settings control which modules each country can use. ERP
        navigation and business logic will be connected to this configuration
        later.
      </p>

      {/* Add / edit dialog */}
      <Dialog
        open={isAdding}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveCountry();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editingCountryId ? "Edit country" : "Add country"}
              </DialogTitle>
              <DialogDescription>
                Set the country name, code, and flag.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="country-name">Country name</Label>
                <Input
                  id="country-name"
                  autoFocus
                  value={countryName}
                  onChange={(event) => setCountryName(event.target.value)}
                  placeholder="e.g. Saudi Arabia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country-code">Country code</Label>
                <Input
                  id="country-code"
                  maxLength={3}
                  value={countryCode}
                  onChange={(event) =>
                    setCountryCode(event.target.value.toUpperCase())
                  }
                  placeholder="SA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country-flag">Flag</Label>
                <Input
                  id="country-flag"
                  maxLength={4}
                  value={countryFlag}
                  onChange={(event) => setCountryFlag(event.target.value)}
                  placeholder="🇸🇦"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>

              <Button type="submit">
                {editingCountryId ? "Save changes" : "Add country"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={countryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCountryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {countryToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the country and its module configuration. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (countryToDelete) deleteCountry(countryToDelete.id);
                setCountryToDelete(null);
              }}
            >
              Delete country
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
