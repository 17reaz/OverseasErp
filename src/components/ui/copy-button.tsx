"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  value: string
  successDuration?: number
}

export function CopyButton({
  value,
  className,
  successDuration = 2000,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const onCopy = async () => {
    if (hasCopied) return

    try {
      await navigator.clipboard.writeText(value)
      setHasCopied(true)

      setTimeout(() => {
        setHasCopied(false)
      }, successDuration)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <Button
      variant="outline"
      className={cn("relative gap-2 overflow-hidden transition-all duration-200 active:scale-95", className)}
      onClick={onCopy}
      {...props}
    >
      {/* Icon Container with smooth flip/fade */}
      <div className="relative h-4 w-4">
        <Copy
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out",
            hasCopied ? "scale-0 opacity-0 -rotate-90" : "scale-100 opacity-100 rotate-0"
          )}
        />
        <Check
          className={cn(
            "absolute inset-0 h-4 w-4 text-green-600 transition-all duration-300 ease-in-out",
            hasCopied ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 rotate-90"
          )}
        />
      </div>

      {/* Text Container with slide and fade animation */}
      <div className="relative overflow-hidden h-5 flex items-center">
        <span
          className={cn(
            "inline-block text-sm transition-all duration-300 ease-in-out",
            hasCopied ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
          )}
        >
          Copy
        </span>
        <span
          className={cn(
            "absolute left-0 inline-block text-sm text-green-600 font-medium transition-all duration-300 ease-in-out",
            hasCopied ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}
        >
          Copied!
        </span>
      </div>
    </Button>
  )
}