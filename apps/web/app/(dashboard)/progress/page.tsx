/**
 * Progress Overview Page
 * 
 * Display student's progress across all enrolled lessons.
 */

'use client';

import { useState } from 'react';
import { ProgressOverview } from '@/components/lesson/progress-overview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Progress } from '@workspace/ui/components/progress';

interface LessonProgress {
  lessonId: string;
  title: string;
  description: string;
  progress: number;
  completedBookmarks: number;
  totalBookmarks: number;
  totalWatchTime: number;
  isCompleted: boolean;
  thumbnailUrl?: string;
}

// Mock data for demonstration
const MOCK_PROGRESS: LessonProgress[] = [
  {
    lessonId: 'lesson-1',
    title: 'Introduction to Linear Equations',
    description: 'Learn the basics of linear equations',
    progress: 75,
    completedBookmarks: 6,
    totalBookmarks: 8,
    totalWatchTime: 45,
    isCompleted: false,
  },
  {
    lessonId: 'lesson-2',
    title: 'Quadratic Functions Deep Dive',
    description: 'Master quadratic functions',
    progress: 100,
    completedBookmarks: 10,
    totalBookmarks: 10,
    totalWatchTime: 90,
    isCompleted: true,
  },
  {
    lessonId: 'lesson-3',
    title: 'Advanced Calculus Concepts',
    description: 'Explore derivatives and integrals',
    progress: 30,
    completedBookmarks: 2,
    totalBookmarks: 7,
    totalWatchTime: 25,
    isCompleted: false,
  },
];

export default function ProgressPage() {
  const [progress] = useState<LessonProgress[]>(MOCK_PROGRESS);

  const stats = {
    totalLessons: progress.length,
    completed: progress.filter((p) => p.isCompleted).length,
    inProgress: progress.filter((p) => !p.isCompleted).length,
    avgProgress: Math.round(
      progress.reduce((sum, p) => sum + p.progress, 0) / progress.length
    ),
    totalWatchTime: progress.reduce((sum, p) => sum + p.totalWatchTime, 0),
  };

  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Progress</h1>
        <p className="text-muted-foreground">
          Track your progress across all enrolled lessons
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Lessons" value={stats.totalLessons.toString()} />
        <StatCard label="Completed" value={stats.completed.toString()} />
        <StatCard label="In Progress" value={stats.inProgress.toString()} />
        <StatCard label="Avg Progress" value={`${stats.avgProgress}%`} />
        <StatCard label="Watch Time" value={formatWatchTime(stats.totalWatchTime)} />
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {stats.completed} of {stats.totalLessons} lessons completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(stats.completed / stats.totalLessons) * 100} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round((stats.completed / stats.totalLessons) * 100)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Per-Lesson Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {progress.map((lesson) => (
          <ProgressOverview
            key={lesson.lessonId}
            lessonTitle={lesson.title}
            progressPercentage={lesson.progress}
            completedBookmarks={lesson.completedBookmarks}
            totalBookmarks={lesson.totalBookmarks}
            totalWatchTime={lesson.totalWatchTime}
            isCompleted={lesson.isCompleted}
            onBookmarkClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
