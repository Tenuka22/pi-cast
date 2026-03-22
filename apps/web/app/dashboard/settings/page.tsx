import { AuthGuard } from "@/components/auth/auth-guard"
import { SettingsContent } from "./settings-content"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}
