import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  CheckCircle2,
  FileImage,
  Loader2,
  Upload,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type ExtractedData = {
  name: string
  passport_no: string
  date_of_birth: string
  nationality: string
}

type TaskDataCollectorProps = {
  onComplete?: (data: {
    fileName: string
    extracted: ExtractedData
  }) => void
}

type ProcessingStage = {
  label: string
  start: number
  end: number
}

const stages: ProcessingStage[] = [
  {
    label: "Uploading image",
    start: 0,
    end: 20,
  },
  {
    label: "Reading document",
    start: 20,
    end: 45,
  },
  {
    label: "Detecting fields",
    start: 45,
    end: 70,
  },
  {
    label: "Extracting data",
    start: 70,
    end: 90,
  },
  {
    label: "Finalizing",
    start: 90,
    end: 100,
  },
]

const dummyExtractedData: ExtractedData = {
  name: "AKIL MIAH",
  passport_no: "A03145678",
  date_of_birth: "1995-04-12",
  nationality: "Bangladeshi",
}

export function TaskDataCollector({
  onComplete,
}: TaskDataCollectorProps) {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const [file, setFile] =
    useState<File | null>(null)

  const [preview, setPreview] =
    useState<string | null>(null)

  const [progress, setProgress] =
    useState(0)

  const [processing, setProcessing] =
    useState(false)

  const [completed, setCompleted] =
    useState(false)

  const [stage, setStage] =
    useState("Select an image")

  const [extracted, setExtracted] =
    useState<ExtractedData | null>(null)

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (!selectedFile.type.startsWith("image/")) {
      return
    }

    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setFile(selectedFile)
    setPreview(
      URL.createObjectURL(selectedFile),
    )

    setProgress(0)
    setProcessing(false)
    setCompleted(false)
    setExtracted(null)
    setStage("Ready to collect data")
  }

  function clearFile() {
    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setFile(null)
    setPreview(null)
    setProgress(0)
    setProcessing(false)
    setCompleted(false)
    setExtracted(null)
    setStage("Select an image")

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  function getCurrentStage(
    value: number,
  ) {
    if (value >= 100) {
      return "Data collection complete"
    }

    const current =
      stages.find(
        (item) =>
          value >= item.start &&
          value < item.end,
      )

    return (
      current?.label ??
      "Preparing document"
    )
  }

  async function startCollection() {
    if (!file || processing) {
      return
    }

    setProcessing(true)
    setCompleted(false)
    setExtracted(null)
    setProgress(0)

    for (
      let value = 0;
      value <= 100;
      value += 2
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, 80),
      )

      setProgress(value)
      setStage(
        getCurrentStage(value),
      )
    }

    const result = {
      ...dummyExtractedData,
    }

    setExtracted(result)
    setCompleted(true)
    setProcessing(false)
    setStage(
      "Data collection complete",
    )

    onComplete?.({
      fileName: file.name,
      extracted: result,
    })
  }

  return (
    <div className="space-y-5">
      {/* IMAGE SELECTOR */}
      {!file && (
        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center transition hover:bg-muted/40"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-medium">
            Select document image
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Passport, certificate, ID or
            other document
          </p>
        </button>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* FILE PREVIEW */}
      {file && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border bg-muted/20">
            {preview ? (
              <img
                src={preview}
                alt={file.name}
                className="max-h-72 w-full object-contain"
              />
            ) : (
              <div className="flex h-48 items-center justify-center">
                <FileImage className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            {!processing && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {file.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {(
                  file.size /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS */}
      {file && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {processing && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {completed && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}

              <span className="text-sm font-medium">
                {stage}
              </span>
            </div>

            <span className="text-sm tabular-nums text-muted-foreground">
              {progress}%
            </span>
          </div>

          <Progress value={progress} />
        </div>
      )}

      {/* ACTION */}
      {file && !completed && (
        <Button
          type="button"
          className="w-full"
          onClick={() =>
            void startCollection()
          }
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Collecting data...
            </>
          ) : (
            <>
              <FileImage className="h-4 w-4" />
              Start data collection
            </>
          )}
        </Button>
      )}

      {/* RESULT */}
      {completed && extracted && (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />

            <div>
              <p className="text-sm font-semibold">
                Data collected
              </p>

              <p className="text-xs text-muted-foreground">
                Dummy OCR result
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ResultField
              label="Name"
              value={extracted.name}
            />

            <ResultField
              label="Passport No."
              value={extracted.passport_no}
            />

            <ResultField
              label="Date of Birth"
              value={
                extracted.date_of_birth
              }
            />

            <ResultField
              label="Nationality"
              value={extracted.nationality}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={clearFile}
          >
            Process another document
          </Button>
        </div>
      )}
    </div>
  )
}

function ResultField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  )
}