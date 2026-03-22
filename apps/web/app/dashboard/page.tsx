/**
 * Dashboard Page - Server Component
 * Fetches user profile data and passes it to the client component
 */

import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardContent } from "./dashboard-content"
import { orpc } from "@/lib/server-orpc-client"

export default async function DashboardPage() {
  const profile = await orpc.profileGetMyProfile()

  return (
    <AuthGuard>
      <DashboardContent profile={profile} />
    </AuthGuard>
  )
}
