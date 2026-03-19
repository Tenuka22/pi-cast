import { HugeiconsIcon } from "@hugeicons/react"
import { LoadingIcon } from "@hugeicons/core-free-icons"

export function LoadingSpinner({ size = "h-8 w-8" }: { size?: string }) {
  return (
    <div className={`flex items-center justify-center`}>
      <HugeiconsIcon 
        icon={LoadingIcon} 
        className={`${size} animate-spin text-current`} 
      />
    </div>
  )
}
