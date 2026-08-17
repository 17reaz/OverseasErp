// src/modules/erp/shared/ui/search-input.tsx

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
}: SearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        className="pl-9 pr-9"
      />

      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X />
          <span className="sr-only">
            Clear search
          </span>
        </Button>
      )}
    </div>
  );
}