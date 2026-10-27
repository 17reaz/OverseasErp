// src/modules/erp/files/components/files-toolbar.tsx
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { DocumentType } from "../types";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type DocTypeFilter = "all" | DocumentType;

interface FilesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  docType: DocTypeFilter;
  onDocTypeChange: (value: DocTypeFilter) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (value: "grid" | "list") => void;
  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
  createDisabled?: boolean;
}

export function FilesToolbar({
  search,
  onSearchChange,
  docType,
  onDocTypeChange,
  onRefresh,
  onCreate,
  viewMode,
onViewModeChange,
  refreshing = false,
  createDisabled = false,
}: FilesToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search candidate, passport or document..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Upload File"
      createDisabled={createDisabled}
    >
      <Select
        value={docType}
        onValueChange={(value) => onDocTypeChange(value as DocTypeFilter)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Document type" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All documents</SelectItem>
          <SelectItem value="passport">Passport</SelectItem>
          <SelectItem value="photo">Photo</SelectItem>
          <SelectItem value="medical">Medical</SelectItem>
          <SelectItem value="mofa">MOFA</SelectItem>
          <SelectItem value="visa">Visa</SelectItem>
          <SelectItem value="contract">Contract</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center rounded-md border p-1">
  <Button
    type="button"
    variant={viewMode === "grid" ? "secondary" : "ghost"}
    size="icon"
    className="h-8 w-8"
    title="Grid view"
    aria-label="Grid view"
    aria-pressed={viewMode === "grid"}
    onClick={() => onViewModeChange("grid")}
  >
    <LayoutGrid className="h-4 w-4" />
  </Button>

  <Button
    type="button"
    variant={viewMode === "list" ? "secondary" : "ghost"}
    size="icon"
    className="h-8 w-8"
    title="List view"
    aria-label="List view"
    aria-pressed={viewMode === "list"}
    onClick={() => onViewModeChange("list")}
  >
    <List className="h-4 w-4" />
  </Button>
</div>
    </PageToolbar>
  );
}