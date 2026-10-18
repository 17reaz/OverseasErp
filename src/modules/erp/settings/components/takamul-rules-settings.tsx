
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Save, Trash2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "./settings-ui";

import {
  getTakamulRequiredTrades,
  saveTakamulRequiredTrades,
} from "../takamul-rules-service";

export function TakamulRulesSettings() {
  const [trades, setTrades] = useState<string[]>([]);
  const [newTrade, setNewTrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    getTakamulRequiredTrades()
      .then((result) => {
        if (active) setTrades(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load Takamul rules.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function addTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = newTrade.trim();
    if (!value) return;

    const exists = trades.some(
      (trade) => trade.toLocaleLowerCase() === value.toLocaleLowerCase(),
    );

    if (exists) {
      setError("This profession is already in the list.");
      return;
    }

    setTrades((current) => [...current, value]);
    setNewTrade("");
    setError("");
    setNotice("");
  }

  function removeTrade(value: string) {
    setTrades((current) =>
      current.filter(
        (trade) => trade.toLocaleLowerCase() !== value.toLocaleLowerCase(),
      ),
    );
    setNotice("");
  }

  async function saveRules() {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const saved = await saveTakamulRequiredTrades(trades);
      setTrades(saved);
      setNotice("Takamul rules saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save Takamul rules.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <SettingsPageHeader
        icon={Workflow}
        title="Takamul Rules"
        description="Choose which MOFA professions require completed Takamul before Visa processing."
      />

      <SettingsCard>
        <SettingsSection className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              Professions requiring Takamul
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Profession names must match the MOFA Trade field. Matching is
              case-insensitive but otherwise exact.
            </p>
          </div>

          <form onSubmit={addTrade} className="flex gap-2">
            <Input
              value={newTrade}
              onChange={(event) => setNewTrade(event.target.value)}
              placeholder="Enter a profession name"
              aria-label="Profession name"
              maxLength={120}
            />
            <Button type="submit" disabled={!newTrade.trim()}>
              <Plus className="mr-2 size-4" />
              Add
            </Button>
          </form>

          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading Takamul rules...
            </div>
          ) : trades.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              No professions configured. Takamul will not be mandatory for any
              profession until you add one.
            </div>
          ) : (
            <div className="space-y-2">
              {trades.map((trade) => (
                <div
                  key={trade.toLocaleLowerCase()}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <span className="text-sm">{trade}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${trade}`}
                    onClick={() => removeTrade(trade)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

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

          <div className="flex justify-end border-t pt-4">
            <Button onClick={saveRules} disabled={loading || saving}>
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save rules
            </Button>
          </div>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
}
