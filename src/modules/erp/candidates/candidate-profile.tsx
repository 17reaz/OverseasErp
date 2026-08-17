import type { ReactNode } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plane,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CandidatePassportUpload } from "./candidate-passport-upload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CandidateProfileProps {
  onBack?: () => void;
}

export function CandidateProfile({
  onBack,
}: CandidateProfileProps) {
  return (
    <div className="space-y-6">
      {/* ========================= */}
      {/* Page Header */}
      {/* ========================= */}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Candidate Profile
            </h1>

            <p className="text-sm text-muted-foreground">
              View candidate information and recruitment progress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="size-4" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="icon"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* ========================= */}
      {/* Candidate Overview */}
      {/* ========================= */}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Candidate Identity */}

            <div className="flex items-center gap-4">
              {/* Avatar */}

              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="size-9 text-muted-foreground" />
              </div>

              {/* Name */}

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold">
                    Reaz Ahmed
                  </h2>

                  <Badge>
                    Active
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Candidate ID: CND-00025
                </p>

                <p className="text-sm text-muted-foreground">
                  Passport: A12345678
                </p>
              </div>
            </div>

            {/* Quick Information */}

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <ProfileStat
                label="Country"
                value="Saudi Arabia"
              />

              <ProfileStat
                label="Job"
                value="Electrician"
              />

              <ProfileStat
                label="Agent"
                value="REAZ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================= */}
      {/* Main Content */}
      {/* ========================= */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ======================= */}
        {/* Left Column */}
        {/* ======================= */}

        <div className="space-y-6 lg:col-span-2">
          {/* ===================== */}
          {/* Personal Information */}
          {/* ===================== */}

          <Card>
            <CardHeader>
              <CardTitle>
                Personal Information
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  label="Full Name"
                  value="Reaz Ahmed"
                  icon={
                    <User className="size-4 text-muted-foreground" />
                  }
                />

                <InfoItem
                  label="Date of Birth"
                  value="12 January 1998"
                  icon={
                    <CalendarDays className="size-4 text-muted-foreground" />
                  }
                />

                <InfoItem
                  label="Phone"
                  value="+880 1700-000000"
                  icon={
                    <Phone className="size-4 text-muted-foreground" />
                  }
                />

                <InfoItem
                  label="Email"
                  value="reaz@example.com"
                  icon={
                    <Mail className="size-4 text-muted-foreground" />
                  }
                />

                <InfoItem
                  label="Nationality"
                  value="Bangladeshi"
                  icon={
                    <MapPin className="size-4 text-muted-foreground" />
                  }
                />

                <InfoItem
                  label="Current Location"
                  value="Dhaka, Bangladesh"
                  icon={
                    <MapPin className="size-4 text-muted-foreground" />
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* ===================== */}
          {/* Recruitment Information */}
          {/* ===================== */}

          <Card>
            <CardHeader>
              <CardTitle>
                Recruitment Information
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  label="Agent"
                  value="REAZ"
                />

                <InfoItem
                  label="Agency"
                  value="ABC Recruiting"
                />

                <InfoItem
                  label="Destination"
                  value="Saudi Arabia"
                />

                <InfoItem
                  label="Job Position"
                  value="Electrician"
                />

                <InfoItem
                  label="Application Status"
                  value="Processing"
                />

                <InfoItem
                  label="Created"
                  value="17 August 2026"
                />
              </div>
            </CardContent>
          </Card>

          {/* ===================== */}
          {/* Documents */}
          {/* ===================== */}

          <Card>
            <CardHeader>
              <CardTitle>
                Documents
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <DocumentRow
                  name="Passport"
                  status="completed"
                />

                <DocumentRow
                  name="Candidate Photo"
                  status="completed"
                />

                <DocumentRow
                  name="Medical Certificate"
                  status="completed"
                />

                <DocumentRow
                  name="MOFA Document"
                  status="pending"
                />

                <DocumentRow
                  name="Visa"
                  status="pending"
                /><CandidatePassportUpload
  tenantId="YOUR_TENANT_ID"
  candidateId="CANDIDATE_UUID"
  candidateSl={25}
  candidateName="Reaz Ahmed"
  passportNo="A12345678"
/>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================= */}
        {/* Right Column */}
        {/* ======================= */}

        <div className="space-y-6">
          {/* ===================== */}
          {/* Application Progress */}
          {/* ===================== */}

          <Card>
            <CardHeader>
              <CardTitle>
                Application Progress
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-5">
                <ProgressItem
                  title="Candidate Created"
                  description="Candidate profile created"
                  status="completed"
                />

                <ProgressItem
                  title="Agent Assigned"
                  description="Agent REAZ assigned"
                  status="completed"
                />

                <ProgressItem
                  title="Medical"
                  description="Medical completed"
                  status="completed"
                />

                <ProgressItem
                  title="MOFA"
                  description="Waiting for MOFA"
                  status="current"
                />

                <ProgressItem
                  title="Visa"
                  description="Visa not started"
                  status="pending"
                />

                <ProgressItem
                  title="Flight"
                  description="Flight not scheduled"
                  status="pending"
                  last
                />
              </div>
            </CardContent>
          </Card>

          {/* ===================== */}
          {/* Quick Actions */}
          {/* ===================== */}

          <Card>
            <CardHeader>
              <CardTitle>
                Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="size-4" />
                View Documents
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Plane className="size-4" />
                Manage Visa
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Phone className="size-4" />
                Contact Candidate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* Profile Stat */
/* ================================================= */

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

/* ================================================= */
/* Info Item */
/* ================================================= */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          {icon}
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ================================================= */
/* Document Row */
/* ================================================= */

function DocumentRow({
  name,
  status,
}: {
  name: string;
  status: "completed" | "pending";
}) {
  const completed = status === "completed";

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileText className="size-4 text-muted-foreground" />
        </div>

        <span className="truncate text-sm font-medium">
          {name}
        </span>
      </div>

      {completed ? (
        <Badge
          variant="secondary"
          className="shrink-0"
        >
          <CheckCircle2 className="size-3.5" />
          Complete
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="shrink-0"
        >
          Pending
        </Badge>
      )}
    </div>
  );
}

/* ================================================= */
/* Progress Item */
/* ================================================= */

function ProgressItem({
  title,
  description,
  status,
  last = false,
}: {
  title: string;
  description: string;
  status: "completed" | "current" | "pending";
  last?: boolean;
}) {
  const completed = status === "completed";
  const current = status === "current";

  return (
    <div className="flex gap-3">
      {/* Timeline Indicator */}

      <div className="flex flex-col items-center">
        <div
          className={[
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            completed
              ? "bg-primary text-primary-foreground"
              : current
                ? "border-2 border-primary text-primary"
                : "border bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {completed ? (
            <CheckCircle2 className="size-4" />
          ) : current ? (
            <div className="size-2 rounded-full bg-primary" />
          ) : (
            <div className="size-2 rounded-full bg-muted-foreground/40" />
          )}
        </div>

        {!last && (
          <Separator
            orientation="vertical"
            className="my-1 min-h-6 flex-1"
          />
        )}
      </div>

      {/* Content */}

      <div className="pb-2">
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}