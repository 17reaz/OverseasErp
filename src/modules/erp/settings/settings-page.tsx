import { Hash, Settings2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { NumberingSettings } from "./components/numbering-settings";

export function SettingsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
              <Settings2 className="size-4" />
            </div>

            <div>
              <h1 className="text-xl font-semibold">
                Settings
              </h1>

              <p className="text-sm text-muted-foreground">
                Manage your ERP configuration and numbering.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="size-4" />
                Numbering
              </CardTitle>

              <CardDescription>
                Configure and monitor serial numbering used
                across your ERP modules.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Numbering settings are tenant-specific. Existing
                records are never renumbered automatically.
              </p>
            </CardContent>
          </Card>

          <NumberingSettings />
        </div>
      </div>
    </div>
  );
}