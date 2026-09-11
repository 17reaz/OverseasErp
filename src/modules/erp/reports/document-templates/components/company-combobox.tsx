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

import type { Agency } from "../../../agency/agency-service"

type CompanyComboboxProps = {
  companies: Agency[]
  value: string | null
  onChange: (companyId: string) => void
  disabled?: boolean
}

export function CompanyCombobox({
  companies,
  value,
  onChange,
  disabled,
}: CompanyComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = companies.find((c) => String(c.id) === value) ?? null

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
            <span className="truncate">{selected.name}</span>
          ) : (
            <span className="text-muted-foreground">Select company…</span>
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
          <CommandInput placeholder="Search companies…" />

          <CommandList>
            <CommandEmpty>No companies found.</CommandEmpty>

            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name ?? ""}
                  data-checked={String(company.id) === value}
                  onSelect={() => {
                    onChange(String(company.id))
                    setOpen(false)
                  }}
                >
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
