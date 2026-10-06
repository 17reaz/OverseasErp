import {
  useEffect,
  useState,
} from "react";

interface MotionNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function MotionNumber({
  value,
  duration = 450,
  className,
}: MotionNumberProps) {
  const [displayValue, setDisplayValue] =
    useState(value);

  useEffect(() => {
    const startValue =
      displayValue;

    if (startValue === value) {
      return;
    }

    const difference =
      value - startValue;

    const startTime =
      performance.now();

    let animationFrame = 0;

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

      // Ease-out
      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      const nextValue =
        startValue +
        difference * eased;

      setDisplayValue(
        Math.round(nextValue),
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(
            animate,
          );
      }
    }

    animationFrame =
      requestAnimationFrame(
        animate,
      );

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [
    value,
    duration,
    displayValue,
  ]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  );
}