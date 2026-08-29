import { QRCodeSVG } from "qrcode.react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CandidateQrCard({ candidateId }: { candidateId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate QR</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 p-6">
          <div className="rounded-lg border bg-background p-3 shadow-sm">
            <QRCodeSVG
              value={`https://overseaserp.vercel.app/candidate/${candidateId}`}
              size={150}
              level="M"
            />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Scan to open candidate profile
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
