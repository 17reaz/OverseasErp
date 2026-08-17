import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  UniversalSheet,
} from "../shared/forms/universal-sheet";

import {
  FormSection,
} from "../shared/forms/form-section";

import { createAgent } from "./agents-service";

interface AgentFormProps {
  open: boolean;
  tenantId: string;

  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AgentForm({
  open,
  tenantId,
  onOpenChange,
  onSuccess,
}: AgentFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }

    if (!tenantId) {
      setError(
        "Tenant information is missing.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createAgent(
        name.trim(),
        code.trim(),
        tenantId,
      );

      setName("");
      setCode("");

      onSuccess();
    } catch (error) {
      console.error(
        "Failed to create agent:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create agent.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Agent"
      description="Create a new recruitment agent."
      onSubmit={handleSubmit}
      submitLabel="Create Agent"
      loading={loading}
      disabled={!name.trim()}
    >
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <FormSection
        title="Agent Information"
        description="Basic information about the recruitment agent."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">
              Agent Name
            </Label>

            <Input
              id="agent-name"
              placeholder="Enter agent name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-code">
              Agent Code
            </Label>

            <Input
              id="agent-code"
              placeholder="e.g. AGT-001"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              disabled={loading}
            />
          </div>
        </div>
      </FormSection>
    </UniversalSheet>
  );
}