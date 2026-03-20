/**
 * Student Dashboard Home Page
 * 
 * Main landing page for students with quick access to all learning features.
 */

"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { UserNav } from "@/components/auth/user-nav"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function StudentDashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { data: session } = authClient.useSession()

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold">Learning Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session.user.name || session.user.email}!
            </p>
          </div>
          <UserNav />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Enrolled Lessons"
            value="3"
            description="Active courses"
            icon="📚"
          />
          <StatCard
            title="In Progress"
            value="2"
            description="Currently learning"
            icon="⏳"
          />
          <StatCard
            title="Completed"
            value="1"
            description="Lessons finished"
            icon="✅"
          />
          <StatCard
            title="Watch Time"
            value="2h 40m"
            description="Total learning time"
            icon="⏱️"
          />
        </div>

        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Link href="/enrolled">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ContinueLearningItem
                lessonTitle="Introduction to Linear Equations"
                progress={75}
                lastWatched="1 hour ago"
                href="/enrolled"
              />
              <ContinueLearningItem
                lessonTitle="Advanced Calculus Concepts"
                progress={30}
                lastWatched="1 day ago"
                href="/enrolled"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="My Lessons"
            description="View and manage your enrolled lessons"
            href="/enrolled"
            icon="📖"
          />
          <ActionCard
            title="Progress"
            description="Track your learning progress across all lessons"
            href="/progress"
            icon="📊"
          />
          <ActionCard
            title="Bookmarks"
            description="Access your saved moments from lessons"
            href="/bookmarks"
            icon="🔖"
          />
          <ActionCard
            title="Notes"
            description="Review your timestamped notes"
            href="/notes"
            icon="📝"
          />
          <ActionCard
            title="History"
            description="Continue from your watch history"
            href="/history"
            icon="🕐"
          />
          <ActionCard
            title="Settings"
            description="Manage your account and preferences"
            href="/dashboard/settings"
            icon="⚙️"
          />
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{session.user.name || "N/A"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Verified:</span>
                <span className="font-medium">{session.user.emailVerified ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: string
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ActionCardProps {
  title: string
  description: string
  href: string
  icon: string
}

function ActionCard({ title, description, href, icon }: ActionCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <Link href={href}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Link>
    </Card>
  )
}

interface ContinueLearningItemProps {
  lessonTitle: string
  progress: number
  lastWatched: string
  href: string
}

function ContinueLearningItem({ lessonTitle, progress, lastWatched, href }: ContinueLearningItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{lessonTitle}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{lastWatched}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{progress}% complete</span>
        </div>
        <div className="mt-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <Button size="sm" className="ml-4">
        <Link href={href}>Continue</Link>
      </Button>
    </div>
  )
}
