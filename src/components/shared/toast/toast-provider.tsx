import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  toast,
  type ToastOptions,
  type ToastType,
} from "./toast";

import {
  Button,
} from "@/components/ui/button";


// =====================================================
// TOAST ITEM
// =====================================================

interface ToastItem
  extends ToastOptions {
  id: number;
}


// =====================================================
// ICON
// =====================================================

function ToastIcon({
  type,
}: {
  type: ToastType;
}) {

  if (type === "success") {
    return (
      <CheckCircle2
        className="
          h-4
          w-4
        "
      />
    );
  }

  if (type === "error") {
    return (
      <CircleAlert
        className="
          h-4
          w-4
        "
      />
    );
  }

  if (type === "warning") {
    return (
      <TriangleAlert
        className="
          h-4
          w-4
        "
      />
    );
  }

  return (
    <Info
      className="
        h-4
        w-4
      "
    />
  );
}


// =====================================================
// TOAST PROVIDER
// =====================================================

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [
    toasts,
    setToasts,
  ] = useState<ToastItem[]>([]);


  // ===================================================
  // SUBSCRIBE
  // ===================================================

  useEffect(() => {

    return toast.subscribe(
      (newToast) => {

        const id =
          Date.now() +
          Math.random();

        setToasts(
          (current) => [
            ...current,
            {
              ...newToast,
              id,
            },
          ],
        );

        const duration =
          newToast.duration ??
          4000;

        window.setTimeout(
          () => {

            setToasts(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !== id,
                ),
            );

          },
          duration,
        );
      },
    );

  }, []);


  // ===================================================
  // REMOVE
  // ===================================================

  function removeToast(
    id: number,
  ) {

    setToasts(
      (current) =>
        current.filter(
          (toast) =>
            toast.id !== id,
        ),
    );
  }


  // ===================================================
  // UI
  // ===================================================

  return (

    <>

      {children}


      {/* ================================================
          TOAST CONTAINER
          ================================================ */}

      <div
        className="
          pointer-events-none
          fixed
          right-4
          top-4
          z-[100]
          flex
          w-[380px]
          max-w-[calc(100vw-2rem)]
          flex-col
          gap-2
        "
      >

        {toasts.map(
          (item) => (

            <div
              key={
                item.id
              }
              className="
                pointer-events-auto
                flex
                items-start
                gap-3
                rounded-lg
                border
                bg-background
                p-4
                shadow-lg
                animate-in
                fade-in
                slide-in-from-right-5
              "
            >

              {/* ICON */}

              <div
                className={`
                  mt-0.5
                  shrink-0
                  ${
                    item.type ===
                    "success"
                      ? "text-emerald-600"
                      : ""
                  }
                  ${
                    item.type ===
                    "error"
                      ? "text-destructive"
                      : ""
                  }
                  ${
                    item.type ===
                    "warning"
                      ? "text-amber-600"
                      : ""
                  }
                  ${
                    item.type ===
                    "info"
                      ? "text-blue-600"
                      : ""
                  }
                `}
              >

                <ToastIcon
                  type={
                    item.type ??
                    "info"
                  }
                />

              </div>


              {/* CONTENT */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  {
                    item.title
                  }
                </p>


                {item.description && (

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-relaxed
                      text-muted-foreground
                    "
                  >
                    {
                      item.description
                    }
                  </p>

                )}

              </div>


              {/* CLOSE */}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="
                  -mr-2
                  -mt-2
                  h-7
                  w-7
                  shrink-0
                "
                onClick={() =>
                  removeToast(
                    item.id,
                  )
                }
              >

                <X
                  className="
                    h-4
                    w-4
                  "
                />

                <span
                  className="
                    sr-only
                  "
                >
                  Close notification
                </span>

              </Button>

            </div>

          ),
        )}

      </div>

    </>

  );
}