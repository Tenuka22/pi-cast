/**
 * Dashboard Page - Server Component
 * Fetches user profile data and passes it to the client component
 */

import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardContent } from "./dashboard-content"
import { getApiProfileMe } from "@/lib/api/profile/profile"
import { authServerClient } from "@/lib/auth"

export default async function DashboardPage() {
  // Check session first before making API call
  const userSession = await authServerClient.getSession()
  
  if (!userSession.data?.session || !userSession.data?.user) {
    return (
      <AuthGuard>
        <div />
      </AuthGuard>
    )
  }

  try {
    const profile = await getApiProfileMe()

    return (
      <AuthGuard>
        <DashboardContent profile={profile} />
      </AuthGuard>
    )
  } catch (error) {
    // If API call fails (e.g., backend not available), show error
    const errorMessage = error instanceof Error ? error.message : "Failed to load profile"
    
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{errorMessage}</p>
        <p className="text-sm text-muted-foreground">
          Make sure the backend server is running on port 8787
        </p>
      </div>
    )
  }
}
