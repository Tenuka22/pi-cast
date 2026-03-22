import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-6 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">User Not Found</h2>
        <p className="max-w-md text-muted-foreground">
          The user you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex justify-center gap-4">
          <Button render={<Link href="/">Go Home</Link>}></Button>
          <Button
            variant="outline"
            render={<Link href="/dashboard">Go to Dashboard</Link>}
          ></Button>
        </div>
      </div>
    </div>
  )
}
