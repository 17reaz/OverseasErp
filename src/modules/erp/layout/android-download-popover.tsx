import { Download, GitBranch, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const APK_URL =
  "https://github.com/17reaz/oerp/releases/download/v1.0.1/build.apk";

const RELEASES_URL = "https://github.com/17reaz/oerp/releases";

const VERSION = "1.0.1";

export function AndroidDownloadPopover() {
  const downloadPageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/download`
      : "/download";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Download OERP Android App"
          title="Download OERP Android App"
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[320px] p-4"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold">
                OERP Android App
              </p>
              <p className="text-xs text-muted-foreground">
                Download the latest mobile app
              </p>
            </div>
          </div>

          {/* QR */}
          <div className="flex justify-center rounded-xl border bg-muted/20 p-4">
            <QRCodeSVG
              value={downloadPageUrl}
              size={184}
              level="H"
              includeMargin
              className="rounded-md bg-white"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium">
              Scan with your Android phone
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open the download page and install OERP
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href={APK_URL}>
                <Download className="mr-2 h-4 w-4" />
                Download APK
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noreferrer"
              >
                <GitBranch className="mr-2 h-4 w-4" />
                GitHub Releases
              </a>
            </Button>
          </div>

          {/* Version */}
          <div className="border-t pt-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              OERP Android · Version {VERSION}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}