import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Fingerprint,
  Pencil,
  Plane,
  Stethoscope,
  XCircle,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  Link,
  useParams,
} from "react-router-dom"

import { QRCodeSVG } from "qrcode.react"

import {
  toast,
} from "@/components/shared/toast/toast"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Separator,
} from "@/components/ui/separator"

import {
  getCandidate,
  type Candidate,
} from "./candidate-service"


/* =========================================================
 * MODULE STATUS
 * ========================================================= */

type ModuleStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "not_started"


interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  status: ModuleStatus
  href: string
}


/* =========================================================
 * STATUS CONFIG
 * ========================================================= */

function getStatusConfig(
  status: ModuleStatus,
) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        variant: "default" as const,
        icon: CheckCircle2,
      }

    case "processing":
      return {
        label: "Processing",
        variant: "secondary" as const,
        icon: Clock3,
      }

    case "failed":
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: XCircle,
      }

    case "pending":
      return {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock3,
      }

    default:
      return {
        label: "Not Started",
        variant: "outline" as const,
        icon: Clock3,
      }
  }
}


/* =========================================================
 * MODULE CARD
 * ========================================================= */

function ModuleCard({
  title,
  description,
  icon,
  status,
  href,
}: ModuleCardProps) {
  const config =
    getStatusConfig(status)

  const StatusIcon =
    config.icon

  return (
    <Card
      className="
        group
        transition-colors
        hover:bg-muted/30
      "
    >
      <CardHeader
        className="
          space-y-0
          pb-3
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-md
                border
                bg-background
              "
            >
              {icon}
            </div>

            <div className="min-w-0">
              <CardTitle
                className="
                  text-sm
                  font-medium
                "
              >
                {title}
              </CardTitle>

              <p
                className="
                  mt-1
                  line-clamp-2
                  text-xs
                  leading-relaxed
                  text-muted-foreground
                "
              >
                {description}
              </p>
            </div>
          </div>

          <Badge
            variant={config.variant}
            className="
              shrink-0
              gap-1
              text-[11px]
            "
          >
            <StatusIcon
              className="h-3 w-3"
            />

            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="
            w-full
            justify-center
          "
        >
          <Link to={href}>
            Open {title}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


/* =========================================================
 * INFORMATION ITEM
 * ========================================================= */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div
      className="
        rounded-md
        border
        bg-muted/20
        px-4
        py-3
      "
    >
      <p
        className="
          text-[11px]
          font-medium
          uppercase
          tracking-wide
          text-muted-foreground
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1.5
          flex
          items-center
          gap-2
          text-sm
          font-medium
        "
      >
        {icon}

        {value}
      </p>
    </div>
  )
}


/* =========================================================
 * PAGE
 * ========================================================= */

export function CandidateProfilePage() {
  const {
    candidateId,
  } = useParams<{
    candidateId: string
  }>()

  const [
    candidate,
    setCandidate,
  ] = useState<Candidate | null>(
    null,
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )


  /* =======================================================
   * LOAD CANDIDATE
   * ======================================================= */

  useEffect(() => {
    async function loadCandidate() {
      if (!candidateId) {
        const message =
          "Candidate ID is missing."

        setError(message)
        setLoading(false)

        toast.error(
          "Candidate ID is missing.",
          "Please return to the Candidates page and select a candidate.",
        )

        return
      }

      try {
        setLoading(true)
        setError(null)

        const {
          data,
          error,
        } = await getCandidate(
          candidateId,
        )

        if (error) {
          throw error
        }

        if (!data) {
          const message =
            "Candidate not found."

          setError(message)

          toast.error(
            "Candidate not found.",
            "The requested candidate profile could not be found.",
          )

          return
        }

        setCandidate(data)
      } catch (error) {
        console.error(error)

        const message =
          "Failed to load candidate profile."

        setError(message)

        toast.error(
          "Failed to load candidate profile.",
          "Please try again.",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadCandidate()
  }, [candidateId])


  /* =======================================================
   * LOADING
   * ======================================================= */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[400px]
          items-center
          justify-center
        "
      >
        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          Loading candidate...
        </p>
      </div>
    )
  }


  /* =======================================================
   * ERROR
   * ======================================================= */

  if (
    error ||
    !candidate
  ) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          asChild
        >
          <Link to="/app/candidates">
            <ArrowLeft />
            Back to Candidates
          </Link>
        </Button>

        <div
          className="
            rounded-lg
            border
            border-destructive/30
            bg-destructive/5
            p-6
            text-sm
            text-destructive
          "
        >
          {error ??
            "Candidate not found."}
        </div>
      </div>
    )
  }


  /* =======================================================
   * PAGE
   * ======================================================= */

  return (
    <div
      className="
        min-h-0
        space-y-6
        pb-6
      "
    >

      {/* =================================================
       * HEADER
       * ================================================= */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
          >
            <Link to="/app/candidates">
              <ArrowLeft />
            </Link>
          </Button>

          <div className="min-w-0">
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <h1
                className="
                  truncate
                  text-2xl
                  font-semibold
                  tracking-tight
                "
              >
                {candidate.name}
              </h1>

              <Badge
                variant={
                  candidate.is_returned
                    ? "destructive"
                    : "default"
                }
              >
                {candidate.is_returned
                  ? "Returned"
                  : "Active"}
              </Badge>
            </div>

            <p
              className="
                mt-1
                text-sm
                text-muted-foreground
              "
            >
              Passport:{" "}
              {candidate.passport_no}
            </p>
          </div>
        </div>

        <Button>
          <Pencil />
          Edit Candidate
        </Button>
      </div>


      {/* =================================================
       * OVERVIEW
       * ================================================= */}

      <div
        className="
          grid
          gap-6
          lg:grid-cols-[minmax(0,1fr)_300px]
        "
      >

        {/* BASIC INFORMATION */}

        <Card>
          <CardHeader>
            <CardTitle>
              Candidate Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div
              className="
                grid
                gap-3
                sm:grid-cols-2
              "
            >
              <InfoItem
                label="Candidate Name"
                value={candidate.name}
              />

              <InfoItem
                label="Passport Number"
                value={candidate.passport_no}
              />

              <InfoItem
                label="Country"
                value={
                  candidate.country ??
                  "—"
                }
              />

              <InfoItem
                label="Received Date"
                value={
                  candidate.received_date ??
                  "—"
                }
                icon={
                  <CalendarDays
                    className="
                      h-4
                      w-4
                      text-muted-foreground
                    "
                  />
                }
              />

              <InfoItem
                label="Candidate SL"
                value={
                  candidate.sl ??
                  "—"
                }
              />

              <InfoItem
                label="Current Stage"
                value={
                  candidate.current_stage ??
                  "Pending"
                }
              />

              <InfoItem
                label="Status"
                value={
                  <Badge
                    variant={
                      candidate.is_returned
                        ? "destructive"
                        : "default"
                    }
                  >
                    {candidate.is_returned
                      ? "Returned"
                      : "Active"}
                  </Badge>
                }
              />

              {candidate.is_returned && (
                <InfoItem
                  label="Returned Date"
                  value={
                    candidate.returned_date ??
                    "—"
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>


        {/* QR */}

        <Card>
          <CardHeader>
            <CardTitle>
              Candidate QR
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                rounded-lg
                border
                bg-muted/20
                p-6
              "
            >
              <div
                className="
                  rounded-lg
                  border
                  bg-background
                  p-3
                  shadow-sm
                "
              >
                <QRCodeSVG
                  value={
                    `https://overseaserp.vercel.app/candidate/${candidate.id}`
                  }
                  size={150}
                  level="M"
                />
              </div>

              <p
                className="
                  mt-4
                  text-center
                  text-xs
                  text-muted-foreground
                "
              >
                Scan to open candidate
                profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* =================================================
       * PROCESSING MODULES
       * ================================================= */}

      <div className="space-y-4">
        <div>
          <h2
            className="
              text-lg
              font-semibold
            "
          >
            Processing Modules
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-muted-foreground
            "
          >
            Manage all processing
            activities for this candidate.
          </p>
        </div>

        <Separator />

        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >

          {/* MEDICAL */}

          <ModuleCard
            title="Medical"
            description="
              Medical examination and fitness records.
            "
            icon={
              <Stethoscope
                className="h-4 w-4"
              />
            }
            status="not_started"
            href={
              `/app/medical?candidate=${candidate.id}`
            }
          />


          {/* MOFA */}

          <ModuleCard
            title="MOFA"
            description="
              Ministry approval and application processing.
            "
            icon={
              <FileText
                className="h-4 w-4"
              />
            }
            status="not_started"
            href={
              `/app/mofa?candidate=${candidate.id}`
            }
          />


          {/* FINGER */}

          <ModuleCard
            title="Finger"
            description="
              Fingerprint registration and records.
            "
            icon={
              <Fingerprint
                className="h-4 w-4"
              />
            }
            status="not_started"
            href={
              `/app/finger?candidate=${candidate.id}`
            }
          />


          {/* DOCUMENTS */}

          <ModuleCard
            title="Documents"
            description="
              Candidate documents and file records.
            "
            icon={
              <FileText
                className="h-4 w-4"
              />
            }
            status="not_started"
            href={
              `/app/files?candidate=${candidate.id}`
            }
          />


          {/* VISA */}

          <ModuleCard
            title="Visa"
            description="
              Visa application and processing records.
            "
            icon={
              <FileText
                className="h-4 w-4"
              />
            }
            status="not_started"
            href={
              `/app/visa?candidate=${candidate.id}`
            }
          />


          {/* FLIGHT */}

          <ModuleCard
            title="Flight"
            description="
              Flight booking and travel information.
            "
            icon={
              <Plane
                className="h-4 w-4"
              />
            }
            status="not_started"
            href={
              `/app/flight?candidate=${candidate.id}`
            }
          />
        </div>
      </div>
    </div>
  )
}