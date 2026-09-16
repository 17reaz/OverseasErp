import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface VisaInventorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VisaInventorySheet({
  open,
  onOpenChange,
}: VisaInventorySheetProps) {
  const [country, setCountry] = useState("saudi_arabia");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Visa Stock</SheetTitle>

          <SheetDescription>
            Add purchased visas to your business inventory.
            This purchase is recorded as an asset, not an
            immediate expense.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-6">
          <div className="space-y-2">
            <Label>Country</Label>

            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="saudi_arabia">
                  Saudi Arabia
                </SelectItem>

                <SelectItem value="qatar">
                  Qatar
                </SelectItem>

                <SelectItem value="uae">
                  UAE
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visa Type</Label>
            <Input placeholder="Work Visa" />
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label>Unit Cost</Label>
            <Input
              type="number"
              min="0"
              placeholder="20000"
            />
          </div>

          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Input type="date" />
          </div>

          <div className="space-y-2">
            <Label>Reference</Label>
            <Input placeholder="INV-2026-001" />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input placeholder="Optional notes" />
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button onClick={() => onOpenChange(false)}>
            Add Stock
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { VisaInventorySheet };