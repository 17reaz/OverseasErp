import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StatusActionOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface StatusActionProps<T extends string> {
  value: T;
  options: StatusActionOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  label?: string;
  buttonClassName?: string;
}

export function StatusAction<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  label = "Change status",
  buttonClassName,
}: StatusActionProps<T>) {
  const currentOption = options.find(
    (option) => option.value === value,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label={label}
          className={
            buttonClassName ??
            "h-7 gap-1.5 px-2.5 text-xs"
          }
        >
          {currentOption?.label ?? value}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-36"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={
              option.disabled ||
              option.value === value
            }
            onSelect={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
