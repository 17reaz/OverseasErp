import { useState } from "react"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { CandidateReference } from "../../../candidates/candidate-service"

type CandidateComboboxProps = {
  candidates: CandidateReference[]
  value: string | null
  onChange: (candidateId: string) => void
  disabled?: boolean
}

export function CandidateCombobox({
  candidates,
  value,
  onChange,
  disabled,
}: CandidateComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = candidates.find((c) => c.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name} — {selected.passport_no}
            </span>
          ) : (
            <span className="text-muted-foreground">Select candidate…</span>
          )}

          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search by name or passport…" />

          <CommandList>
            <CommandEmpty>No candidates found.</CommandEmpty>

            <CommandGroup>
              {candidates.map((candidate) => (
                <CommandItem
                  key={candidate.id}
                  value={`${candidate.name ?? ""} ${candidate.passport_no ?? ""}`}
                  data-checked={candidate.id === value}
                  onSelect={() => {
                    onChange(candidate.id)
                    setOpen(false)
                  }}
                >
                  <span className="flex flex-col">
                    <span>{candidate.name}</span>

                    <span className="text-xs text-muted-foreground">
                      {candidate.passport_no}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
