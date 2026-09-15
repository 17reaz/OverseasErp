import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

import { supabase } from "@/lib/supabase/client";

interface Employee {
  id: string;
  tenant_id: string;

  employee_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;

  designation: string | null;
  department: string | null;

  join_date: string | null;

  basic_salary: number | string;
  default_allowances: number | string;
  default_deductions: number | string;

  status: "active" | "inactive";

  notes: string | null;

  created_at: string;
  updated_at: string;
}

interface EmployeeForm {
  employeeCode: string;
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  joinDate: string;
  basicSalary: string;
  defaultAllowances: string;
  defaultDeductions: string;
  status: "active" | "inactive";
  notes: string;
}

const emptyForm: EmployeeForm = {
  employeeCode: "",
  fullName: "",
  phone: "",
  email: "",
  designation: "",
  department: "",
  joinDate: "",
  basicSalary: "0",
  defaultAllowances: "0",
  defaultDeductions: "0",
  status: "active",
  notes: "",
};

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function normalizeEmployee(row: Employee): Employee {
  return {
    ...row,
    basic_salary: Number(row.basic_salary),
    default_allowances: Number(row.default_allowances),
    default_deductions: Number(row.default_deductions),
  };
}

interface EmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSaved: () => void;
}

function EmployeeSheet({
  open,
  onOpenChange,
  employee,
  onSaved,
}: EmployeeSheetProps) {
  const [form, setForm] =
    useState<EmployeeForm>(emptyForm);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const isEditing = Boolean(employee);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (employee) {
      setForm({
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        phone: employee.phone ?? "",
        email: employee.email ?? "",
        designation: employee.designation ?? "",
        department: employee.department ?? "",
        joinDate: employee.join_date ?? "",
        basicSalary: String(employee.basic_salary),
        defaultAllowances: String(
          employee.default_allowances,
        ),
        defaultDeductions: String(
          employee.default_deductions,
        ),
        status: employee.status,
        notes: employee.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setError(null);
  }, [open, employee]);

  function updateField<K extends keyof EmployeeForm>(
    field: K,
    value: EmployeeForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const employeeCode =
      form.employeeCode.trim();

    const fullName =
      form.fullName.trim();

    if (!employeeCode) {
      setError("Employee code is required.");
      return;
    }

    if (!fullName) {
      setError("Employee name is required.");
      return;
    }

    const basicSalary =
      Number(form.basicSalary);

    const defaultAllowances =
      Number(form.defaultAllowances);

    const defaultDeductions =
      Number(form.defaultDeductions);

    if (
      !Number.isFinite(basicSalary) ||
      basicSalary < 0
    ) {
      setError(
        "Basic salary must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(defaultAllowances) ||
      defaultAllowances < 0
    ) {
      setError(
        "Default allowance must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(defaultDeductions) ||
      defaultDeductions < 0
    ) {
      setError(
        "Default deduction must be a valid non-negative number.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        employee_code: employeeCode,
        full_name: fullName,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        designation:
          form.designation.trim() || null,
        department:
          form.department.trim() || null,
        join_date: form.joinDate || null,
        basic_salary: basicSalary,
        default_allowances:
          defaultAllowances,
        default_deductions:
          defaultDeductions,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (employee) {
        const { error: updateError } =
          await supabase
            .schema("finance")
            .from("employees")
            .update(payload)
            .eq("id", employee.id);

        if (updateError) {
          throw new Error(
            updateError.message,
          );
        }
      } else {
        const { data: tenantData, error: tenantError } =
          await supabase.rpc(
            "get_my_tenant_id",
          );

        if (tenantError) {
          throw new Error(
            tenantError.message,
          );
        }

        const { error: insertError } =
          await supabase
            .schema("finance")
            .from("employees")
            .insert({
              ...payload,
              tenant_id: tenantData,
            });

        if (insertError) {
          throw new Error(
            insertError.message,
          );
        }
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save employee.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing
              ? "Edit Employee"
              : "Add Employee"}
          </SheetTitle>

          <SheetDescription>
            {isEditing
              ? "Update employee information and salary settings."
              : "Add an employee to your payroll employee list."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-1"
        >
          <div className="space-y-6 py-6">
            {/* BASIC INFORMATION */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">
                  Basic Information
                </h3>

                <p className="text-sm text-muted-foreground">
                  Employee identity and contact information.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee-code">
                    Employee Code
                  </Label>

                  <Input
                    id="employee-code"
                    value={form.employeeCode}
                    onChange={(event) =>
                      updateField(
                        "employeeCode",
                        event.target.value,
                      )
                    }
                    placeholder="EMP-001"
                    disabled={isEditing}
                  />

                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Employee code cannot be changed after creation.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-name">
                    Full Name
                  </Label>

                  <Input
                    id="employee-name"
                    value={form.fullName}
                    onChange={(event) =>
                      updateField(
                        "fullName",
                        event.target.value,
                      )
                    }
                    placeholder="Md. Rahim"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee-phone">
                    Phone
                  </Label>

                  <Input
                    id="employee-phone"
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-email">
                    Email
                  </Label>

                  <Input
                    id="employee-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="employee@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee-designation">
                    Designation
                  </Label>

                  <Input
                    id="employee-designation"
                    value={form.designation}
                    onChange={(event) =>
                      updateField(
                        "designation",
                        event.target.value,
                      )
                    }
                    placeholder="Manager"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-department">
                    Department
                  </Label>

                  <Input
                    id="employee-department"
                    value={form.department}
                    onChange={(event) =>
                      updateField(
                        "department",
                        event.target.value,
                      )
                    }
                    placeholder="Operations"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-join-date">
                  Join Date
                </Label>

                <Input
                  id="employee-join-date"
                  type="date"
                  value={form.joinDate}
                  onChange={(event) =>
                    updateField(
                      "joinDate",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>

            {/* SALARY */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">
                  Salary Defaults
                </h3>

                <p className="text-sm text-muted-foreground">
                  These values will be used as defaults when creating payroll.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="employee-basic">
                    Basic Salary
                  </Label>

                  <Input
                    id="employee-basic"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basicSalary}
                    onChange={(event) =>
                      updateField(
                        "basicSalary",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-allowance">
                    Default Allowance
                  </Label>

                  <Input
                    id="employee-allowance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.defaultAllowances
                    }
                    onChange={(event) =>
                      updateField(
                        "defaultAllowances",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-deduction">
                    Default Deduction
                  </Label>

                  <Input
                    id="employee-deduction"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.defaultDeductions
                    }
                    onChange={(event) =>
                      updateField(
                        "defaultDeductions",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">
                  Employment Status
                </h3>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    form.status === "active"
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    updateField(
                      "status",
                      "active",
                    )
                  }
                >
                  Active
                </Button>

                <Button
                  type="button"
                  variant={
                    form.status === "inactive"
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    updateField(
                      "status",
                      "inactive",
                    )
                  }
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <Label htmlFor="employee-notes">
                Notes
              </Label>

              <textarea
                id="employee-notes"
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value,
                  )
                }
                placeholder="Optional notes..."
                rows={4}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <SheetFooter className="sticky bottom-0 border-t bg-background py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                !form.employeeCode.trim() ||
                !form.fullName.trim()
              }
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              {isEditing
                ? "Save Changes"
                : "Create Employee"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PayrollEmployees() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">(
      "active",
    );

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  async function loadEmployees(
    showRefresh = false,
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const { data, error: queryError } =
        await supabase
          .schema("finance")
          .from("employees")
          .select(
            `
              id,
              tenant_id,
              employee_code,
              full_name,
              phone,
              email,
              designation,
              department,
              join_date,
              basic_salary,
              default_allowances,
              default_deductions,
              status,
              notes,
              created_at,
              updated_at
            `,
          )
          .order("full_name", {
            ascending: true,
          });

      if (queryError) {
        throw new Error(
          queryError.message,
        );
      }

      setEmployees(
        ((data as Employee[] | null) ?? []).map(
          normalizeEmployee,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load employees.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  const filteredEmployees =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return employees.filter((employee) => {
        const matchesStatus =
          statusFilter === "all" ||
          employee.status === statusFilter;

        if (!matchesStatus) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          employee.full_name
            .toLowerCase()
            .includes(query) ||
          employee.employee_code
            .toLowerCase()
            .includes(query) ||
          employee.designation
            ?.toLowerCase()
            .includes(query) ||
          employee.department
            ?.toLowerCase()
            .includes(query) ||
          employee.phone
            ?.toLowerCase()
            .includes(query)
        );
      });
    }, [
      employees,
      search,
      statusFilter,
    ]);

  const activeCount =
    employees.filter(
      (employee) =>
        employee.status === "active",
    ).length;

  const inactiveCount =
    employees.filter(
      (employee) =>
        employee.status === "inactive",
    ).length;

  const columns: DataTableColumn<Employee>[] =
    [
      {
        key: "employee",
        header: "Employee",
        cell: (employee) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-4 text-muted-foreground" />
            </div>

            <div>
              <div className="font-medium">
                {employee.full_name}
              </div>

              <div className="text-xs text-muted-foreground">
                {employee.employee_code}
              </div>
            </div>
          </div>
        ),
      },

      {
        key: "designation",
        header: "Designation",
        cell: (employee) =>
          employee.designation ?? "—",
      },

      {
        key: "department",
        header: "Department",
        cell: (employee) =>
          employee.department ?? "—",
      },

      {
        key: "salary",
        header: "Basic Salary",
        cell: (employee) =>
          formatMoney(
            employee.basic_salary,
          ),
      },

      {
        key: "phone",
        header: "Phone",
        cell: (employee) =>
          employee.phone ?? "—",
      },

      {
        key: "status",
        header: "Status",
        cell: (employee) => (
          <Badge
            variant={
              employee.status === "active"
                ? "default"
                : "outline"
            }
          >
            {employee.status}
          </Badge>
        ),
      },

      {
        key: "actions",
        header: "",
        className: "w-[70px]",
        cell: (employee) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingEmployee(
                employee,
              );
              setSheetOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        ),
      },
    ];

  function openCreate() {
    setEditingEmployee(null);
    setSheetOpen(true);
  }

  function handleSaved() {
    void loadEmployees(true);
  }

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserRound className="size-5" />

            <h1 className="text-lg font-semibold">
              Employees
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Manage employees used for payroll.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add Employee
        </Button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto p-6">
        {/* SUMMARY */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Total Employees
            </div>

            <div className="mt-1 text-xl font-semibold">
              {employees.length}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Active
            </div>

            <div className="mt-1 text-xl font-semibold">
              {activeCount}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Inactive
            </div>

            <div className="mt-1 text-xl font-semibold">
              {inactiveCount}
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search employee..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={
                statusFilter === "active"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setStatusFilter("active")
              }
            >
              Active
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === "inactive"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setStatusFilter("inactive")
              }
            >
              Inactive
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === "all"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setStatusFilter("all")
              }
            >
              All
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                void loadEmployees(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "size-4 animate-spin"
                    : "size-4"
                }
              />
            </Button>
          </div>
        </div>

        {/* ERROR */}
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredEmployees}
            getRowKey={(employee) =>
              employee.id
            }
            loading={loading}
            emptyTitle="No employees found"
            emptyDescription="Add an employee to start managing payroll."
          />
        )}
      </div>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={editingEmployee}
        onSaved={handleSaved}
      />
    </div>
  );
}

export { PayrollEmployees };
