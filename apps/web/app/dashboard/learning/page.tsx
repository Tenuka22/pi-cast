/**
 * Student Dashboard Home Page
 *
 * Main landing page for students with quick access to all learning features.
 */

import { AuthGuard } from "@/components/auth/auth-guard"
import { LearningContent } from "./learning-content"

export default function StudentDashboardPage() {
  return (
    <AuthGuard>
      <LearningContent />
    </AuthGuard>
  )
}
