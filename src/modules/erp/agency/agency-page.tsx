import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "@/components/shared/toast/toast";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  AgencyForm,
} from "./components/agency-form";

import {
  AgencyTable,
} from "./components/agency-table";

import {
  AgencyToolbar,
  type AgencyFilterState,
  type AgencySortState,
} from "./components/agency-toolbar";

import {
  deleteAgency,
  getAgencies,
  type Agency,
} from "./agency-service";


const defaultFilter: AgencyFilterState = {
  status: "all",
};


const defaultSort: AgencySortState = {
  field: "sl",
  mode: "ascending",
};


const PAGE_SIZE = 10;


export function AgencyPage() {

  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const [
    agencies,
    setAgencies,
  ] = useState<Agency[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  /*
   * =========================================================
   * TENANT
   * =========================================================
   */

  const [
    tenantId,
    setTenantId,
  ] = useState<string | null>(
    null,
  );


  /*
   * =========================================================
   * SHEET
   * =========================================================
   */

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    editingAgency,
    setEditingAgency,
  ] = useState<Agency | null>(
    null,
  );


  /*
   * =========================================================
   * SEARCH
   * =========================================================
   */

  const [
    search,
    setSearch,
  ] = useState("");


  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const [
    filter,
    setFilter,
  ] =
    useState<AgencyFilterState>(
      defaultFilter,
    );


  /*
   * =========================================================
   * SORT
   * =========================================================
   */

  const [
    sort,
    setSort,
  ] =
    useState<AgencySortState>(
      defaultSort,
    );


  /*
   * =========================================================
   * PAGINATION
   * =========================================================
   */

  const [
    page,
    setPage,
  ] = useState(1);


  /*
   * =========================================================
   * LOAD TENANT
   * =========================================================
   */

  const loadTenant =
    useCallback(
      async () => {

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();


        if (userError) {
          throw userError;
        }


        if (!user) {
          throw new Error(
            "Authenticated user not found.",
          );
        }


        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .select("tenant_id")
            .eq(
              "id",
              user.id,
            )
            .single();


        if (error) {
          throw error;
        }


        setTenantId(
          data?.tenant_id ??
            null,
        );

      },
      [],
    );


  /*
   * =========================================================
   * LOAD AGENCIES
   * =========================================================
   */

  const loadAgencies =
    useCallback(
      async () => {

        try {

          setLoading(true);


          const data =
            await getAgencies();


          setAgencies(
            data,
          );

        } catch (error) {

          console.error(
            error,
          );


          toast.error(
            "Failed to load agencies.",
            "Please try again.",
          );

        } finally {

          setLoading(false);

        }

      },
      [],
    );


  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {

    async function initialize() {

      try {

        await loadTenant();

        await loadAgencies();

      } catch (error) {

        console.error(
          error,
        );


        toast.error(
          "Failed to initialize agency module.",
          "Please try again.",
        );

      }

    }


    void initialize();

  }, [
    loadTenant,
    loadAgencies,
  ]);


  /*
   * =========================================================
   * FILTER + SEARCH + SORT
   * =========================================================
   */

  const filteredAgencies =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      let result =
        agencies.filter(
          (agency) => {

            /*
             * SEARCH
             */

            const matchesSearch =
              !query ||
              agency.name
                .toLowerCase()
                .includes(query) ||
              agency.code
                .toLowerCase()
                .includes(query) ||
              agency.phone
                ?.toLowerCase()
                .includes(query) ||
              agency.email
                ?.toLowerCase()
                .includes(query);


            /*
             * STATUS
             */

            const matchesStatus =
              filter.status ===
                "all" ||
              (
                filter.status ===
                  "active" &&
                agency.is_active
              ) ||
              (
                filter.status ===
                  "inactive" &&
                !agency.is_active
              );


            return (
              matchesSearch &&
              matchesStatus
            );

          },
        );


      /*
       * =======================================================
       * SORT
       * =======================================================
       */

      result = [
        ...result,
      ].sort(
        (a, b) => {

          let first = "";
          let second = "";


          switch (
            sort.field
          ) {

            case "name":

              first =
                a.name;

              second =
                b.name;

              break;


            case "code":

              first =
                a.code;

              second =
                b.code;

              break;


            case "created_at":

              first =
                a.created_at;

              second =
                b.created_at;

              break;


            case "updated_at":

              first =
                a.updated_at;

              second =
                b.updated_at;

              break;


            case "sl":

            default:

              first =
                String(
                  a.sl,
                );

              second =
                String(
                  b.sl,
                );

              break;

          }


          const comparison =
            first.localeCompare(
              second,
              undefined,
              {
                numeric: true,
                sensitivity:
                  "base",
              },
            );


          if (
            sort.mode ===
            "descending"
          ) {
            return -comparison;
          }


          return comparison;

        },
      );


      return result;

    }, [
      agencies,
      search,
      filter.status,
      sort,
    ]);


  /*
   * =========================================================
   * PAGE RESET
   * =========================================================
   */

  useEffect(() => {

    setPage(1);

  }, [
    search,
    filter.status,
    sort,
  ]);


  /*
   * =========================================================
   * PAGINATED DATA
   * =========================================================
   */

  const paginatedAgencies =
    useMemo(() => {

      const start =
        (page - 1) *
        PAGE_SIZE;


      return filteredAgencies.slice(
        start,
        start +
          PAGE_SIZE,
      );

    }, [
      filteredAgencies,
      page,
    ]);


  /*
   * =========================================================
   * CREATE
   * =========================================================
   */

  function handleCreate() {

    setEditingAgency(
      null,
    );

    setFormOpen(
      true,
    );

  }


  /*
   * =========================================================
   * EDIT
   * =========================================================
   */

  function handleEdit(
    agency: Agency,
  ) {

    setEditingAgency(
      agency,
    );

    setFormOpen(
      true,
    );

  }


  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  async function handleDelete(
    agency: Agency,
  ) {

    const confirmed =
      window.confirm(
        `Delete agency "${agency.name}"?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      await deleteAgency(
        agency.id,
      );


      toast.success(
        "Agency deleted.",
        "The agency was deleted successfully.",
      );


      await loadAgencies();


    } catch (error) {

      console.error(
        error,
      );


      toast.error(
        "Failed to delete agency.",
        "Please try again.",
      );

    }

  }


  /*
   * =========================================================
   * FORM SUCCESS
   * =========================================================
   */

  function handleFormSuccess(
    agency: Agency,
  ) {

    setFormOpen(
      false,
    );

    setEditingAgency(
      null,
    );


    setAgencies(
      (current) => {

        const exists =
          current.some(
            (item) =>
              item.id ===
              agency.id,
          );


        if (exists) {

          return current.map(
            (item) =>
              item.id ===
              agency.id
                ? agency
                : item,
          );

        }


        return [
          agency,
          ...current,
        ];

      },
    );


    toast.success(
      editingAgency
        ? "Agency updated."
        : "Agency created.",
      editingAgency
        ? "The agency was updated successfully."
        : "The agency was created successfully.",
    );

  }


  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  async function handleRefresh() {

    await loadAgencies();

  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className="
        space-y-6
      "
    >

      {/* ==================================================
          TOOLBAR
          ================================================== */}

      <AgencyToolbar

        search={
          search
        }

        searchPlaceholder={
          "Search agency, code, phone or email..."
        }

        onSearchChange={
          setSearch
        }

        filter={
          filter
        }

        onFilterChange={
          setFilter
        }

        sort={
          sort
        }

        onSortChange={
          setSort
        }

        onRefresh={
          handleRefresh
        }

        onCreate={
          handleCreate
        }

        refreshing={
          loading
        }

      />


      {/* ==================================================
          TABLE
          ================================================== */}

      <AgencyTable

        agencies={
          paginatedAgencies
        }

        loading={
          loading
        }

        page={
          page
        }

        pageSize={
          PAGE_SIZE
        }

        total={
          filteredAgencies.length
        }

        onPageChange={
          setPage
        }

        onEdit={
          handleEdit
        }

        onDelete={
          handleDelete
        }

      />


      {/* ==================================================
          UNIVERSAL SHEET
          ================================================== */}

      {tenantId && (

        <AgencyForm

          open={
            formOpen
          }

          agency={
            editingAgency
          }

          tenantId={
            tenantId
          }

          onOpenChange={
            setFormOpen
          }

          onSuccess={
            handleFormSuccess
          }

        />

      )}

    </div>
  );
}