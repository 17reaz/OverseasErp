import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Globe2, Loader2, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { getSession } from "@/lib/supabase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function acceptInvitation() {
      if (!token) {
        if (!cancelled) {
          setError("Invitation token is missing.");
          setLoading(false);
        }
        return;
      }

      const { data: sessionData, error: sessionError } =
        await getSession();

      if (sessionError) {
        if (!cancelled) {
          setError(sessionError.message);
          setLoading(false);
        }
        return;
      }

      if (!sessionData.session) {
        /*
         * User is not logged in.
         *
         * Keep the token so after login/signup we can
         * return to this invitation.
         */
        if (!cancelled) {
          navigate(
            `/login?redirect=/accept-invite?token=${encodeURIComponent(token)}`,
            { replace: true },
          );
        }

        return;
      }

      const { error: acceptError } = await supabase.rpc(
        "accept_tenant_invitation",
        {
          p_token: token,
        },
      );

      if (cancelled) return;

      if (acceptError) {
        setError(acceptError.message);
        setLoading(false);
        return;
      }

      setAccepted(true);
      setLoading(false);

      /*
       * Give AuthProvider a moment to react to the
       * database/profile change before entering ERP.
       */
      setTimeout(() => {
        navigate("/app", { replace: true });
      }, 1200);
    }

    void acceptInvitation();

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Globe2 className="h-4.5 w-4.5" />
            </span>

            <span className="text-base font-semibold tracking-tight">
              OverseasERP
            </span>
          </Link>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-8 text-center">
            {loading && (
              <>
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-muted-foreground" />

                <h1 className="text-lg font-semibold">
                  Accepting invitation...
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we connect you to the workspace.
                </p>
              </>
            )}

            {accepted && (
              <>
                <CheckCircle2 className="mb-4 h-10 w-10 text-primary" />

                <h1 className="text-lg font-semibold">
                  Invitation accepted
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Your workspace access has been added successfully.
                </p>
              </>
            )}

            {!loading && !accepted && error && (
              <>
                <XCircle className="mb-4 h-10 w-10 text-destructive" />

                <h1 className="text-lg font-semibold">
                  Invitation could not be accepted
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {error}
                </p>

                <Button
                  className="mt-6"
                  onClick={() => navigate("/app")}
                >
                  Go to app
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}