
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Loader2,
  Plus,
  Search,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "./settings-ui";

import {
  addTradeProfession,
  getTradeProfessions,
  type TradeProfession,
} from "../takamul-rules-service";

export function TakamulRulesSettings() {
  const [professions, setProfessions] = useState<TradeProfession[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getTradeProfessions();
      setProfessions(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Trade Professions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfessions();
  }, [loadProfessions]);

  const filteredProfessions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    if (!query) return professions;

    return professions.filter(
      (profession) =>
        profession.name.toLocaleLowerCase().includes(query) ||
        profession.code.toLocaleLowerCase().includes(query),
    );
  }, [professions, search]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code.trim() || !name.trim()) {
      setError("Profession code and name are required.");
      return;
    }

    setAdding(true);
    setError("");
    setNotice("");

    try {
      const created = await addTradeProfession(code, name);

      setProfessions((current) =>
        [...current, created].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      setCode("");
      setName("");
      setNotice("Trade Profession added successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add Trade Profession.",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <SettingsPageHeader
        icon={BriefcaseBusiness}
        title="Trade Profession"
        description="Manage the shared global profession list used across all tenants."
      />

      <SettingsCard>
        <SettingsSection className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Add profession</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              New professions become available to every tenant.
              Existing professions cannot be deleted from this page.
            </p>
          </div>

          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Code (e.g. ENG)"
              aria-label="Profession code"
              maxLength={40}
              required
            />

            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Profession name"
              aria-label="Profession name"
              maxLength={120}
              required
            />

            <Button type="submit" disabled={adding || loading}>
              {adding ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Add
            </Button>
          </form>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </SettingsSection>

        <SettingsSection className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                Global profession list
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {professions.length} active{" "}
                {professions.length === 1 ? "profession" : "professions"}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadProfessions()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or profession name..."
              aria-label="Search Trade Professions"
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading professions...
            </div>
          ) : filteredProfessions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {professions.length === 0
                ? "No active professions found. Add the first profession above or insert it directly into the database."
                : "No professions match your search."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-[110px_1fr] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                <span>Code</span>
                <span>Profession name</span>
              </div>

              <div className="divide-y">
                {filteredProfessions.map((profession) => (
                  <div
                    key={profession.id}
                    className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"
                  >
                    <span className="font-mono text-sm">
                      {profession.code}
                    </span>
                    <span className="min-w-0 text-sm">
                      {profession.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingsSection>

        <SettingsSection muted className="py-3">
          <p className="text-xs text-muted-foreground">
            This list is shared globally. Adding a profession here or directly
            in the database makes it available to all tenants. There is no
            delete action on this page.
          </p>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
}
