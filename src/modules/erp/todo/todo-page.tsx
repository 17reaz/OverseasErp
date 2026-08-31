import { CopyButton } from "@/components/ui/copy-button"

export function SaaSPage() {
  const apiKey = "sk_live_51NzXXXXXXXXXXXXXXXXX"

  return (
    <div className="flex items-center gap-2 p-4 border rounded-lg max-w-sm">
      <input 
        type="text" 
        readOnly 
        value={apiKey} 
        className="bg-transparent text-sm outline-none w-full font-mono text-muted-foreground" 
      />
      {/* Animated Copy Button */}
      <CopyButton value={apiKey} />
    </div>
  )
}