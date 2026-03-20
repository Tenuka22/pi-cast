/**
 * Enrolled Lessons Display Component
 * 
 * Shows all lessons a student is enrolled in with progress indicators.
 * Includes filtering and sorting capabilities.
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Progress } from '@workspace/ui/components/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';

export interface EnrolledLesson {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  creatorName: string;
  progress: number; // 0-100
  isCompleted: boolean;
  completedAt?: number;
  lastAccessedAt: number;
  totalWatchTime: number; // In minutes
  enrolledAt: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  duration?: number; // Estimated duration in minutes
}

interface EnrolledLessonsDisplayProps {
  lessons: EnrolledLesson[];
  onLessonClick: (lessonId: string) => void;
  onResumeLesson: (lessonId: string) => void;
}

type FilterType = 'all' | 'in-progress' | 'completed';
type SortType = 'lastAccessed' | 'enrolled' | 'progress' | 'title';

export function EnrolledLessonsDisplay({
  lessons,
  onLessonClick,
  onResumeLesson,
}: EnrolledLessonsDisplayProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('lastAccessed');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedLessons = useMemo(() => {
    let result = [...lessons];

    // Apply filter
    if (filter === 'in-progress') {
      result = result.filter((l) => !l.isCompleted);
    } else if (filter === 'completed') {
      result = result.filter((l) => l.isCompleted);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.creatorName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'lastAccessed':
          return b.lastAccessedAt - a.lastAccessedAt;
        case 'enrolled':
          return b.enrolledAt - a.enrolledAt;
        case 'progress':
          return b.progress - a.progress;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [lessons, filter, sortBy, searchQuery]);

  const stats = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.filter((l) => l.isCompleted).length;
    const inProgress = total - completed;
    const avgProgress =
      total > 0 ? Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / total) : 0;

    return { total, completed, inProgress, avgProgress };
  }, [lessons]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Lessons" value={stats.total.toString()} />
        <StatCard label="In Progress" value={stats.inProgress.toString()} />
        <StatCard label="Completed" value={stats.completed.toString()} />
        <StatCard label="Avg Progress" value={`${stats.avgProgress}%`} />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">All ({lessons.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastAccessed">Last Accessed</SelectItem>
              <SelectItem value="enrolled">Enrollment Date</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredAndSortedLessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery
              ? 'No lessons match your search'
              : filter === 'completed'
              ? 'No completed lessons yet'
              : filter === 'in-progress'
              ? 'No lessons in progress'
              : 'No enrolled lessons yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              formatTime={formatTime}
              formatDate={formatDate}
              onClick={() => onLessonClick(lesson.lessonId)}
              onResume={() => onResumeLesson(lesson.lessonId)}
            />
          ))}
        </div>
      )}
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

interface LessonCardProps {
  lesson: EnrolledLesson;
  formatTime: (minutes: number) => string;
  formatDate: (timestamp: number) => string;
  onClick: () => void;
  onResume: () => void;
}

function LessonCard({ lesson, formatTime, formatDate, onClick, onResume }: LessonCardProps) {
  return (
    <Card className="flex flex-col h-full" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{lesson.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {lesson.description}
            </CardDescription>
          </div>
          {lesson.isCompleted && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{lesson.progress}%</span>
          </div>
          <Progress value={lesson.progress} className="h-2" />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Creator:</span> {lesson.creatorName}
          </div>
          <div>
            <span className="font-medium">Level:</span>{' '}
            <span className="capitalize">{lesson.level}</span>
          </div>
          {lesson.duration && (
            <div>
              <span className="font-medium">Duration:</span> {formatTime(lesson.duration)}
            </div>
          )}
          <div>
            <span className="font-medium">Watch Time:</span> {formatTime(lesson.totalWatchTime)}
          </div>
        </div>

        {/* Last Accessed */}
        <div className="text-xs text-muted-foreground">
          Last accessed: {formatDate(lesson.lastAccessedAt)}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onResume();
          }}
        >
          {lesson.isCompleted ? 'Review Lesson' : lesson.progress > 0 ? 'Continue Learning' : 'Start Learning'}
        </Button>
      </CardFooter>
    </Card>
  );
}
