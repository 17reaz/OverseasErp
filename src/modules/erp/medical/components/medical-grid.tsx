import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  MedicalPipelineCard,
  type MedicalPipelineItem,
} from "./medical-pipeline-card";

interface MedicalGridProps {
  items: MedicalPipelineItem[];
  loading?: boolean;
  onOpen?: (candidateId: string) => void;
}

const MEDICAL_VALIDITY_DAYS = 90;

function isMedicalValid(item: MedicalPipelineItem) {
  const fitDate = item.medical.fit_date;

  if (!fitDate) {
    return false;
  }

  const fitTime = new Date(fitDate).getTime();
  const nowTime = Date.now();

  if (Number.isNaN(fitTime)) {
    return false;
  }

  // Future fit date is not considered valid
  if (fitTime > nowTime) {
    return false;
  }

  const validityTime =
    MEDICAL_VALIDITY_DAYS *
    24 *
    60 *
    60 *
    1000;

  return nowTime - fitTime < validityTime;
}

function MedicalGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map(
        (_, index) => (
          <Card
            key={index}
            size="sm"
            className="h-[250px] animate-pulse rounded-xl"
          >
            <CardContent className="space-y-4 p-4">
              <div className="h-3 w-16 rounded bg-muted" />

              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>

              <div className="space-y-3 pt-2">
                <div className="h-7 rounded bg-muted" />
                <div className="h-7 rounded bg-muted" />
                <div className="h-7 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}

function MedicalGridEmpty() {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>

        <h3 className="text-sm font-medium">
          No medical records found
        </h3>

        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          There are no valid medical records
          within the last 90 days.
        </p>
      </CardContent>
    </Card>
  );
}

export function MedicalGrid({
  items,
  loading = false,
  onOpen,
}: MedicalGridProps) {
  if (loading) {
    return <MedicalGridSkeleton />;
  }

  const validItems = items.filter(isMedicalValid);

  if (!validItems.length) {
    return <MedicalGridEmpty />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {validItems.map((item) => (
        <MedicalPipelineCard
          key={item.medical.id}
          item={item}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}