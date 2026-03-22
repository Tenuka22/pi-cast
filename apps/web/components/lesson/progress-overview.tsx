/**
 * Progress Overview Component
 *
 * Displays lesson progress with visual indicators.
 * Shows completed bookmarks, watch time, and completion status.
 */

"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { BookmarkProgress } from "@/lib/lesson-system/use-lesson-progress"

interface ProgressOverviewProps {
  lessonTitle: string
  progressPercentage: number
  completedBookmarks: number
  totalBookmarks: number
  totalWatchTime: number // In minutes
  isCompleted: boolean
  bookmarkProgress?: BookmarkProgress[]
  onBookmarkClick?: (bookmarkId: string) => void
}

export function ProgressOverview({
  lessonTitle,
  progressPercentage,
  completedBookmarks,
  totalBookmarks,
  totalWatchTime,
  isCompleted,
  bookmarkProgress,
  onBookmarkClick,
}: ProgressOverviewProps) {
  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const completionDate = isCompleted ? new Date().toLocaleDateString() : null

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{lessonTitle}</CardTitle>
            <CardDescription>
              {isCompleted ? "Completed" : "In Progress"}
              {completionDate && ` on ${completionDate}`}
            </CardDescription>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Bookmarks"
            value={`${completedBookmarks}/${totalBookmarks}`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            }
          />
          <StatCard
            label="Watch Time"
            value={formatWatchTime(totalWatchTime)}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatCard
            label="Completion"
            value={`${progressPercentage}%`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
        </div>

        {/* Bookmark Progress Timeline */}
        {bookmarkProgress && bookmarkProgress.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Bookmark Progress</h4>
            <div className="space-y-2">
              {bookmarkProgress.map((bookmark, index) => (
                <BookmarkProgressItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  index={index}
                  total={bookmarkProgress.length}
                  onClick={onBookmarkClick}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-card p-3">
      <div className="mb-1 text-muted-foreground">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

interface BookmarkProgressItemProps {
  bookmark: BookmarkProgress
  index: number
  total: number
  onClick?: (bookmarkId: string) => void
}

function BookmarkProgressItem({
  bookmark,
  index,
  total,
  onClick,
}: BookmarkProgressItemProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`flex cursor-pointer items-center gap-2 ${
              bookmark.isCompleted
                ? "text-green-600 dark:text-green-500"
                : "text-muted-foreground"
            }`}
            onClick={() => onClick?.(bookmark.id)}
          >
            <div
              className={`h-3 w-3 rounded-full border-2 ${
                bookmark.isCompleted
                  ? "border-green-600 bg-green-600 dark:border-green-500 dark:bg-green-500"
                  : "border-muted-foreground"
              }`}
            />
            <span className="flex-1 text-sm">{bookmark.title}</span>
            <span className="font-mono text-xs">
              {formatTime(bookmark.timestamp)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {bookmark.isCompleted ? "Completed" : "Not completed"} • {index + 1}{" "}
            of {total}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
