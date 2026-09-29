import { useEffect, useState } from "react";
import {
  Activity,
  Monitor,
  Smartphone,
  Tablet,
  Clock3,
  MapPin,
  LogOut,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginSessions, type LoginSession } from "./login-session-service";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(
  loginAt: string,
  endAt?: string | null,
) {
  const start = new Date(loginAt).getTime();

  const end = endAt
    ? new Date(endAt).getTime()
    : Date.now();

  const minutes = Math.max(
    0,
    Math.floor((end - start) / 60000),
  );

  if (minutes < 1) {
    return "Less than a minute";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function DeviceIcon({
  device,
}: {
  device: string | null;
}) {
  const value = device?.toLowerCase() ?? "";

  if (value.includes("mobile")) {
    return <Smartphone className="size-4" />;
  }

  if (value.includes("tablet")) {
    return <Tablet className="size-4" />;
  }

  return <Monitor className="size-4" />;
}

function isCurrentlyActive(
  session: LoginSession,
) {
  if (!session.is_active) {
    return false;
  }

  const lastSeen =
    new Date(session.last_seen_at).getTime();

  return Date.now() - lastSeen < 2 * 60 * 1000;
}

export function LoginActivity() {
  const [sessions, setSessions] = useState<
    LoginSession[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSessions() {
      setLoading(true);
      setError(null);

      const { data, error } =
        await getLoginSessions();

      if (!mounted) return;

      if (error) {
        setError(
          "Unable to load login activity.",
        );
      } else {
        setSessions(data);
      }

      setLoading(false);
    }

    loadSessions();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Login Activity
        </h2>

        <p className="text-sm text-muted-foreground">
          See recent login sessions and device activity
          for your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4" />
            Recent Sessions
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Loading login activity...
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-8 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            sessions.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No login activity found.
              </div>
            )}

          {!loading &&
            !error &&
            sessions.length > 0 && (
              <div className="divide-y">
                {sessions.map((session) => {
                  const active =
                    isCurrentlyActive(session);

                  return (
                    <div
                      key={session.id}
                      className="px-6 py-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                          <DeviceIcon
                            device={session.device}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {session.browser ??
                                "Unknown browser"}
                            </p>

                            {active && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Current
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {session.os ??
                                "Unknown OS"}
                            </span>

                            <span>
                              {session.device ??
                                "Unknown device"}
                            </span>

                            {session.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3.5" />
                                {session.location}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Clock3 className="size-3.5" />

                              <span>
                                Login:{" "}
                                {formatDate(
                                  session.login_at,
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock3 className="size-3.5" />

                              <span>
                                Last seen:{" "}
                                {formatDate(
                                  session.last_seen_at,
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock3 className="size-3.5" />

                              <span>
                                Duration:{" "}
                                {formatDuration(
                                  session.login_at,
                                  session.logout_at,
                                )}
                              </span>
                            </div>

                            {session.logout_at && (
                              <div className="flex items-center gap-2">
                                <LogOut className="size-3.5" />

                                <span>
                                  Logged out:{" "}
                                  {formatDate(
                                    session.logout_at,
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}