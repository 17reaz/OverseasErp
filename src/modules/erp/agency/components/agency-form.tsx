import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Building2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  UniversalSheet,
} from "@/modules/erp/shared/forms/universal-sheet";

import {
  createAgency,
  updateAgency,
  type Agency,
  type AgencyInput,
} from "../agency-service";


interface AgencyFormProps {
  open: boolean;

  agency: Agency | null;

  tenantId: string;

  onOpenChange: (
    open: boolean,
  ) => void;

  onSuccess: (
    agency: Agency,
  ) => void;
}


export function AgencyForm({
  open,
  agency,
  tenantId,
  onOpenChange,
  onSuccess,
}: AgencyFormProps) {

  const isEditing =
    Boolean(agency);


  const [
    name,
    setName,
  ] = useState("");


  const [
    code,
    setCode,
  ] = useState("");


  const [
    phone,
    setPhone,
  ] = useState("");


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    address,
    setAddress,
  ] = useState("");


  const [
    isActive,
    setIsActive,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  /*
   * =========================================================
   * LOAD FORM DATA
   * =========================================================
   */

  useEffect(() => {

    if (!open) {
      return;
    }


    setName(
      agency?.name ?? "",
    );


    setCode(
      agency?.code ?? "",
    );


    setPhone(
      agency?.phone ?? "",
    );


    setEmail(
      agency?.email ?? "",
    );


    setAddress(
      agency?.address ?? "",
    );


    setIsActive(
      agency?.is_active ?? true,
    );


    setError(null);

  }, [
    open,
    agency,
  ]);


  /*
   * =========================================================
   * UNSAVED CHANGES
   * =========================================================
   */

  const hasChanges =
    agency
      ? (
          name.trim() !==
            (agency.name ?? "") ||
          code.trim() !==
            (agency.code ?? "") ||
          phone.trim() !==
            (agency.phone ?? "") ||
          email.trim() !==
            (agency.email ?? "") ||
          address.trim() !==
            (agency.address ?? "") ||
          isActive !==
            (agency.is_active ?? true)
        )
      : (
          name.trim() !== "" ||
          code.trim() !== "" ||
          phone.trim() !== "" ||
          email.trim() !== "" ||
          address.trim() !== "" ||
          !isActive
        );


  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setError(null);


    const trimmedName =
      name.trim();


    const trimmedCode =
      code.trim();


    if (!trimmedName) {

      setError(
        "Agency name is required.",
      );

      return;
    }


    if (!trimmedCode) {

      setError(
        "Agency code is required.",
      );

      return;
    }


    const input: AgencyInput = {

      name:
        trimmedName,

      code:
        trimmedCode,

      phone:
        phone.trim() ||
        null,

      email:
        email.trim() ||
        null,

      address:
        address.trim() ||
        null,

      is_active:
        isActive,
    };


    try {

      setSaving(true);


      const result =
        isEditing && agency
          ? await updateAgency(
              agency.id,
              input,
            )
          : await createAgency(
              tenantId,
              input,
            );


      onSuccess(
        result,
      );

    } catch (error) {

      console.error(
        error,
      );


      setError(
        error instanceof Error
          ? error.message
          : "Failed to save agency.",
      );

    } finally {

      setSaving(false);

    }
  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <UniversalSheet

      open={
        open
      }

      onOpenChange={
        onOpenChange
      }

      title={
        isEditing
          ? "Edit Agency"
          : "Create Agency"
      }

      description={
        isEditing
          ? "Update agency information."
          : "Add a new agency to your tenant."
      }

      onSubmit={
        handleSubmit
      }

      loading={
        saving
      }

      disabled={
        !name.trim() ||
        !code.trim()
      }

      hasChanges={
        hasChanges
      }

      submitLabel={
        isEditing
          ? "Update Agency"
          : "Create Agency"
      }

    >

      {/* ==================================================
          AGENCY HEADER
          ================================================== */}

      <div
        className="
          flex
          items-center
          gap-3
          rounded-lg
          border
          bg-muted/20
          p-4
        "
      >

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-md
            border
            bg-background
          "
        >

          <Building2
            className="
              h-5
              w-5
              text-muted-foreground
            "
          />

        </div>


        <div>

          <p
            className="
              text-sm
              font-medium
            "
          >
            Agency Information
          </p>


          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            Basic agency details
          </p>

        </div>

      </div>


      {/* ==================================================
          NAME
          ================================================== */}

      <div
        className="
          space-y-2
        "
      >

        <Label htmlFor="agency-name">
          Agency Name
        </Label>


        <Input
          id="agency-name"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
          placeholder="Enter agency name"
          disabled={saving}
          autoComplete="organization"
        />

      </div>


      {/* ==================================================
          CODE
          ================================================== */}

      <div
        className="
          space-y-2
        "
      >

        <Label htmlFor="agency-code">
          Agency Code
        </Label>


        <Input
          id="agency-code"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase(),
            )
          }
          placeholder="e.g. ABC001"
          disabled={saving}
          autoComplete="off"
        />

      </div>


      {/* ==================================================
          PHONE
          ================================================== */}

      <div
        className="
          space-y-2
        "
      >

        <Label htmlFor="agency-phone">
          Phone
        </Label>


        <Input
          id="agency-phone"
          value={phone}
          onChange={(event) =>
            setPhone(
              event.target.value,
            )
          }
          placeholder="Enter phone number"
          disabled={saving}
          type="tel"
          autoComplete="tel"
        />

      </div>


      {/* ==================================================
          EMAIL
          ================================================== */}

      <div
        className="
          space-y-2
        "
      >

        <Label htmlFor="agency-email">
          Email
        </Label>


        <Input
          id="agency-email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value,
            )
          }
          placeholder="Enter email address"
          disabled={saving}
          type="email"
          autoComplete="email"
        />

      </div>


      {/* ==================================================
          ADDRESS
          ================================================== */}

      <div
        className="
          space-y-2
        "
      >

        <Label htmlFor="agency-address">
          Address
        </Label>


        <Textarea
          id="agency-address"
          value={address}
          onChange={(event) =>
            setAddress(
              event.target.value,
            )
          }
          placeholder="Enter agency address"
          disabled={saving}
          rows={4}
        />

      </div>


      {/* ==================================================
          STATUS
          ================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-lg
          border
          p-4
        "
      >

        <div>

          <p
            className="
              text-sm
              font-medium
            "
          >
            Agency Status
          </p>


          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            Inactive agencies cannot be used
            for new operations.
          </p>

        </div>


        <Button
          type="button"
          variant={
            isActive
              ? "default"
              : "outline"
          }
          size="sm"
          disabled={saving}
          onClick={() =>
            setIsActive(
              (current) =>
                !current,
            )
          }
        >
          {isActive
            ? "Active"
            : "Inactive"}
        </Button>

      </div>


      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (

        <div
          className="
            rounded-md
            border
            border-destructive/30
            bg-destructive/5
            px-3
            py-2
            text-sm
            text-destructive
          "
        >
          {error}
        </div>

      )}

    </UniversalSheet>
  );
}