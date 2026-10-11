import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "bn", label: "Bengali" },
  { id: "ar", label: "Arabic" },
];

export function OcrSettings() {
  const [engine, setEngine] = useState("cloud");
  const [langs, setLangs] = useState<Record<string, boolean>>({ en: true, bn: true, ar: false });
  const [mrz, setMrz] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [threshold, setThreshold] = useState(95);
  const [saved, setSaved] = useState(false);

  const touch = () => setSaved(false);

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reading engine</CardTitle>
          <CardDescription>Choose how documents are read. This does nothing yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Engine</Label>
            <Select
              value={engine}
              onValueChange={(v) => {
                setEngine(v);
                touch();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">Cloud OCR (more accurate)</SelectItem>
                <SelectItem value="local">On-server OCR (documents stay private)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Languages on your documents</Label>
            <div className="space-y-2">
              {LANGUAGES.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{l.label}</span>
                  <Switch
                    checked={langs[l.id]}
                    onCheckedChange={(v) => {
                      setLangs((s) => ({ ...s, [l.id]: v }));
                      touch();
                    }}
                    aria-label={l.label}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Read passport MRZ lines</p>
              <p className="text-xs text-muted-foreground">Use the two machine-readable lines to double-check fields.</p>
            </div>
            <Switch
              checked={mrz}
              onCheckedChange={(v) => {
                setMrz(v);
                touch();
              }}
              aria-label="Read passport MRZ lines"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review rules</CardTitle>
          <CardDescription>Decide which scans can skip manual review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Approve high-confidence scans automatically</p>
              <p className="text-xs text-muted-foreground">Scans below the limit still go to review.</p>
            </div>
            <Switch
              checked={autoApprove}
              onCheckedChange={(v) => {
                setAutoApprove(v);
                touch();
              }}
              aria-label="Approve high-confidence scans automatically"
            />
          </div>

          <div className={autoApprove ? "space-y-3" : "space-y-3 opacity-50"}>
            <div className="flex items-center justify-between">
              <Label>Minimum confidence</Label>
              <span className="text-sm font-medium tabular-nums">{threshold}%</span>
            </div>
            <Slider
              value={[threshold]}
              min={70}
              max={100}
              step={1}
              disabled={!autoApprove}
              onValueChange={(v) => {
                setThreshold(v[0]);
                touch();
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => setSaved(true)}>Save settings</Button>
        {saved && <span className="text-sm text-muted-foreground">Settings saved</span>}
      </div>
    </div>
  );
}
