import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Fingerprint,
  Plane,
  Pencil,
  Stethoscope,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Separator,
} from "@/components/ui/separator";

import {
  getCandidate,
  type Candidate,
} from "./candidate-service";
import { QRCodeSVG } from "qrcode.react"

/* =========================================================
 * MODULE STATUS
 * ========================================================= */

type ModuleStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "not_started";


interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: ModuleStatus;
  href: string;
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
      };

    case "processing":
      return {
        label: "Processing",
        variant: "secondary" as const,
        icon: Clock3,
      };

    case "failed":
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: XCircle,
      };

    case "pending":
      return {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock3,
      };

    default:
      return {
        label: "Not Started",
        variant: "outline" as const,
        icon: Clock3,
      };
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
    getStatusConfig(
      status,
    );

  const StatusIcon =
    config.icon;

  return (
    <Card
      className="
        transition-colors
        hover:bg-muted/30
      "
    >

      <CardHeader
        className="
          flex
          flex-row
          items-start
          justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-md
              border
              bg-background
            "
          >
            {icon}
          </div>

          <div>

            <CardTitle
              className="
                text-sm
              "
            >
              {title}
            </CardTitle>

            <p
              className="
                mt-1
                text-xs
                text-muted-foreground
              "
            >
              {description}
            </p>

          </div>

        </div>

        <Badge
          variant={
            config.variant
          }
          className="
            gap-1
          "
        >
          <StatusIcon
            className="
              h-3 w-3
            "
          />

          {config.label}
        </Badge>

      </CardHeader>

      <CardContent>

        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link to={href}>
            Open {title}
          </Link>
        </Button>

      </CardContent>

    </Card>
  );
}


/* =========================================================
 * PAGE
 * ========================================================= */

export function CandidateProfilePage() {

  const {
    candidateId,
  } = useParams<{
    candidateId: string;
  }>();


  const [
    candidate,
    setCandidate,
  ] = useState<Candidate | null>(
    null,
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  /* =======================================================
   * LOAD CANDIDATE
   * ======================================================= */

  useEffect(() => {

    async function loadCandidate() {

      if (!candidateId) {

        const message =
          "Candidate ID is missing.";

        setError(message);
        setLoading(false);

        toast.error(
          "Candidate ID is missing.",
          "Please return to the Candidates page and select a candidate.",
        );

        return;
      }


      try {

        setLoading(true);
        setError(null);


        const {
          data,
          error,
        } = await getCandidate(
          candidateId,
        );


        if (error) {
          throw error;
        }


        if (!data) {

          const message =
            "Candidate not found.";

          setError(message);

          toast.error(
            "Candidate not found.",
            "The requested candidate profile could not be found.",
          );

          return;
        }


        setCandidate(data);

      } catch (error) {

        console.error(error);

        const message =
          "Failed to load candidate profile.";

        setError(message);

        toast.error(
          "Failed to load candidate profile.",
          "Please try again.",
        );

      } finally {

        setLoading(false);

      }

    }


    void loadCandidate();

  }, [
    candidateId,
  ]);


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
    );

  }


  /* =======================================================
   * ERROR
   * ======================================================= */

  if (
    error ||
    !candidate
  ) {

    return (
      <div
        className="
          space-y-4
        "
      >

        <Button
          variant="ghost"
          asChild
        >

          <Link
            to="/app/candidates"
          >
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
    );

  }


  /* =======================================================
   * PAGE
   * ======================================================= */

  return (
    <div
      className="
        space-y-6
      "
    >

      {/* =================================================
       * HEADER
       * ================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <Button
            variant="ghost"
            size="icon"
            asChild
          >

            <Link
              to="/app/candidates"
            >
              <ArrowLeft />
            </Link>

          </Button>


          <div>

            <h1
              className="
                text-2xl
                font-semibold
                tracking-tight
              "
            >
              {candidate.name}
            </h1>


            <p
              className="
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
       * BASIC INFORMATION
       * ================================================= */}

      <div
        className="
          grid
          gap-6
          md:grid-cols-2
        "
      >
        
        {/* PERSONAL */}

        <Card>

          <CardHeader>

            <CardTitle>
              Personal Information
            </CardTitle>

          </CardHeader>


          <CardContent
            className="
              space-y-5
            "
          >

            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Candidate Name
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                "
              >
                {candidate.name}
              </p>
              <QRCodeSVG
  value={`https://your-app.com/candidate/${candidate.id}`}
  size={160}
  level="M"
/>

            </div>


            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Passport Number
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                "
              >
                {candidate.passport_no}
              </p>

            </div>


            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Country
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                "
              >
                {candidate.country ??
                  "—"}
              </p>

            </div>


            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Received Date
              </p>

              <p
                className="
                  mt-1
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-medium
                "
              >

                <CalendarDays
                  className="
                    h-4
                    w-4
                    text-muted-foreground
                  "
                />

                {candidate.received_date ??
                  "—"}

              </p>

            </div>

          </CardContent>

        </Card>


        {/* PROCESSING */}

        <Card>

          <CardHeader>

            <CardTitle>
              Processing Information
            </CardTitle>

          </CardHeader>


          <CardContent
            className="
              space-y-5
            "
          >

            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Candidate SL
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                "
              >
                {candidate.sl ??
                  "—"}
              </p>

            </div>


            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Current Stage
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                "
              >
                {candidate.current_stage ??
                  "Pending"}
              </p>

            </div>


            <div>

              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                Status
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                "
              >
                {candidate.is_returned
                  ? "Returned"
                  : "Active"}
              </p>

            </div>


            {candidate.is_returned && (

              <div>

                <p
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Returned Date
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                  "
                >
                  {candidate.returned_date ??
                    "—"}
                </p>

              </div>

            )}

          </CardContent>

        </Card>

      </div>


      {/* =================================================
       * MODULE PROCESSING
       * ================================================= */}

      <div
        className="
          space-y-4
        "
      >

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
              text-sm
              text-muted-foreground
            "
          >
            Manage all processing activities
            for this candidate.
          </p>

        </div>


        <Separator />


        <div
          className="
            grid
            gap-4
            md:grid-cols-2
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
                className="
                  h-4
                  w-4
                "
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
                className="
                  h-4
                  w-4
                "
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
                className="
                  h-4
                  w-4
                "
              />
            }

            status="not_started"

            href={
              `/app/finger?candidate=${candidate.id}`
            }

          />


          {/* DOCUMENT */}

          <ModuleCard

            title="Documents"

            description="
              Candidate documents and file records.
            "

            icon={
              <FileText
                className="
                  h-4
                  w-4
                "
              />
            }

            status="not_started"

            href={
              `/app/documents?candidate=${candidate.id}`
            }

          />


          {/* VISA */}

          <ModuleCard

            title="Visa"

            description="
              Visa application and processing.
            "

            icon={
              <CheckCircle2
                className="
                  h-4
                  w-4
                "
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
                className="
                  h-4
                  w-4
                "
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
  );
}