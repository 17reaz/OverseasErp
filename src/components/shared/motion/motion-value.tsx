import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import {
  MOTION_TEST,
} from "./motion-config";

interface MotionValueProps {
  value: number;
  duration?: number;
  className?: string;
  showChange?: boolean;
}

export function MotionValue({
  value,
  duration = 450,
  className,
  showChange = true,
}: MotionValueProps) {
  const targetValue =
    MOTION_TEST.enabled
      ? value - MOTION_TEST.offset
      : value;

  const previousValue =
    useRef(targetValue);

  const [displayValue, setDisplayValue] =
    useState(targetValue);

  const [change, setChange] =
    useState<number | null>(null);

  const [changed, setChanged] =
    useState(false);

  useEffect(() => {
    const previous =
      previousValue.current;

    if (previous === targetValue) {
      return;
    }

    const difference =
      targetValue - previous;

    setChange(
      MOTION_TEST.enabled
        ? difference
        : difference,
    );

    setChanged(true);

    const timer =
      window.setTimeout(() => {
        setChanged(false);
      }, 900);

    previousValue.current =
      targetValue;

    return () => {
      window.clearTimeout(timer);
    };
  }, [targetValue]);

  useEffect(() => {
    const startValue =
      displayValue;

    if (startValue === targetValue) {
      return;
    }

    const difference =
      targetValue - startValue;

    const startTime =
      performance.now();

    let frame = 0;

    function animate(
      currentTime: number,
    ) {
      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(
          elapsed / duration,
          1,
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      setDisplayValue(
        Math.round(
          startValue +
            difference * eased,
        ),
      );

      if (progress < 1) {
        frame =
          requestAnimationFrame(
            animate,
          );
      }
    }

    frame =
      requestAnimationFrame(
        animate,
      );

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    targetValue,
    duration,
    displayValue,
  ]);

  const isIncrease =
    (change ?? 0) > 0;

  const isDecrease =
    (change ?? 0) < 0;

  return (
    <span
      className={[
        "relative inline-flex items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "transition-transform duration-300",
          changed
            ? "scale-[1.04]"
            : "scale-100",
        ].join(" ")}
      >
        {displayValue.toLocaleString()}
      </span>

      {showChange &&
        changed &&
        change !== null &&
        change !== 0 && (
          <span
            className={[
              "absolute left-full ml-2 inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium",
              "animate-in fade-in slide-in-from-bottom-1 duration-300",
              isIncrease
                ? "text-emerald-600 dark:text-emerald-400"
                : "",
              isDecrease
                ? "text-destructive"
                : "",
            ].join(" ")}
          >
            {isIncrease && (
              <ArrowUp className="h-3 w-3" />
            )}

            {isDecrease && (
              <ArrowDown className="h-3 w-3" />
            )}

            {isIncrease
              ? `+${change}`
              : change}
          </span>
        )}
    </span>
  );
}