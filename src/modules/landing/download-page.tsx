import { Download, GitBranch, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const APK_URL =
  "https://github.com/17reaz/oerp/releases/download/v1.0.1/build.apk";

export function DownloadPage() {
  const downloadUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/download`
      : "https://your-domain.com/download";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Smartphone className="h-8 w-8" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            OERP Android App
          </h1>

          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Manage your Overseas ERP business directly from your Android
            device.
          </p>

          <div className="mx-auto mt-8 w-fit rounded-2xl border bg-card p-6 shadow-sm">
            <QRCodeSVG
              value={downloadUrl}
              size={240}
              level="H"
              includeMargin
              className="rounded-lg"
            />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Scan this QR code with your Android phone
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={APK_URL}
              download
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Download APK
            </a>

            <a
              href="https://github.com/17reaz/oerp/releases"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <GitBranch className="h-4 w-4" />
GitHub Releases
            </a>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            OERP Android · Version 1.0.1
          </p>
        </div>
      </div>
    </div>
  );
}