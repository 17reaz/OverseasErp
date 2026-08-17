import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StatusToggleProps {
  checked: boolean;

  onCheckedChange: (
    checked: boolean,
  ) => void;

  label?: string;

  disabled?: boolean;
}

export function StatusToggle({
  checked,
  onCheckedChange,
  label = "Active",
  disabled = false,
}: StatusToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />

      <Label className="cursor-pointer">
        {label}
      </Label>
    </div>
  );
}