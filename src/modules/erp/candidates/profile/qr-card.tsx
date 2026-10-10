import { QRCodeSVG } from "qrcode.react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CandidateQrCard({ candidateId }: { candidateId: string }) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Candidate QR</CardTitle>
      </CardHeader>

      <CardContent className="px-4">
        <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 p-3">
          <div className="rounded-md border bg-background p-2 shadow-sm">
            <QRCodeSVG
              value={`https://overseaserp.vercel.app/candidate/${candidateId}`}
              size={110}
              level="M"
            />
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Scan to open profile
          </p>
        </div>
      </CardContent>
    </Card>
  )
}