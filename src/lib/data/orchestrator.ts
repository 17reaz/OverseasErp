import { supabase } from "@/lib/supabase/client";

export type DataSourceError = {
  message: string;
  code?: string;
};

export async function executeDataRequest<T>(
  request: () => PromiseLike<{
    data: T | null;
    error: {
      message: string;
      code?: string;
    } | null;
  }>,
): Promise<T> {
  try {
    const { data, error } = await request();

    if (error) {
      throw {
        message: error.message,
        code: error.code,
      } satisfies DataSourceError;
    }

    if (data === null) {
      return data as T;
    }

    return data;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      throw error;
    }

    throw {
      message: "Data request failed.",
    } satisfies DataSourceError;
  }
}

/**
 * Central data entry point.
 * Supabase remains the active data source.
 */
export const orchestrator = {
  supabase,

  query<T>(
    request: () => PromiseLike<{
      data: T | null;
      error: {
        message: string;
        code?: string;
      } | null;
    }>,
  ): Promise<T> {
    return executeDataRequest<T>(request);
  },

  dashboard: {
    async getData() {
      const service = await import(
        "@/modules/erp/dashboard/dashboard-service"
      );

      return service.getDashboardData();
    },

    async getVisaWarnings() {
      const service = await import(
        "@/modules/erp/dashboard/dashboard-visa-monitor-service"
      );

      return service.getDashboardVisaWarnings();
    },
  },
};

