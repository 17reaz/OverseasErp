import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

/* =========================================================
   ROOT FIELD
========================================================= */

interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  description,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div
      className={cn(
        "grid w-full gap-1.5",
        className,
      )}
    >
      {label && (
        <Label>
          {label}

          {required && (
            <span className="ml-1 text-destructive">
              *
            </span>
          )}
        </Label>
      )}

      {children}

      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}

      {!error && description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

interface FormInputProps
  extends React.ComponentProps<"input"> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
}

export function FormInput({
  label,
  description,
  error,
  required,
  fieldClassName,
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <Input
        {...props}
        aria-invalid={Boolean(error)}
      />
    </FormField>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

interface FormTextareaProps
  extends React.ComponentProps<"textarea"> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
}

export function FormTextarea({
  label,
  description,
  error,
  required,
  fieldClassName,
  ...props
}: FormTextareaProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <Textarea
        {...props}
        aria-invalid={Boolean(error)}
      />
    </FormField>
  );
}

/* =========================================================
   DATE INPUT
   Shadcn Input with date type
========================================================= */

interface FormDateProps
  extends React.ComponentProps<"input"> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
}

export function FormDate({
  label,
  description,
  error,
  required,
  fieldClassName,
  ...props
}: FormDateProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <Input
        type="date"
        {...props}
        aria-invalid={Boolean(error)}
      />
    </FormField>
  );
}

/* =========================================================
   SELECT
   Shadcn Select
========================================================= */

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;

  value?: string;
  defaultValue?: string;

  placeholder?: string;

  disabled?: boolean;

  options: FormSelectOption[];

  onValueChange?: (
    value: string,
  ) => void;

  fieldClassName?: string;
}

export function FormSelect({
  label,
  description,
  error,
  required,
  value,
  defaultValue,
  placeholder = "Select an option",
  disabled,
  options,
  onValueChange,
  fieldClassName,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-invalid={Boolean(error)}
        >
          <SelectValue
            placeholder={placeholder}
          />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

/* =========================================================
   CUSTOM SHADCN FIELD WRAPPER
   Useful for Popover / Combobox / Calendar
========================================================= */

interface FormCustomFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormCustomField({
  label,
  description,
  error,
  required,
  children,
  className,
}: FormCustomFieldProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      {children}
    </FormField>
  );
}