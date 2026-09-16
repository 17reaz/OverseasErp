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

interface InvestmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InvestmentSheet({
  open,
  onOpenChange,
}: InvestmentSheetProps) {
  const [type, setType] = useState("shares");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Investment</SheetTitle>
          <SheetDescription>
            Record a business investment. This is an asset,
            not an expense.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-6">
          <div className="space-y-2">
            <Label>Investment Name</Label>
            <Input placeholder="ABC Ltd Shares" />
          </div>

          <div className="space-y-2">
            <Label>Investment Type</Label>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="shares">Shares</SelectItem>
                <SelectItem value="fixed_deposit">
                  Fixed Deposit
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              placeholder="200000"
            />
          </div>

          <div className="space-y-2">
            <Label>Current Value</Label>
            <Input
              type="number"
              min="0"
              placeholder="200000"
            />
          </div>

          <div className="space-y-2">
            <Label>Investment Date</Label>
            <Input type="date" />
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
            Save Investment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { InvestmentSheet };