/**
 * Watch History Page
 * 
 * Display recently watched lessons with quick resume functionality.
 */

'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Progress } from '@workspace/ui/components/progress';
import { Badge } from '@workspace/ui/components/badge';

interface WatchHistoryItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string;
  creatorName: string;
  thumbnailUrl?: string;
  lastWatchedAt: number;
  watchPosition: number; // milliseconds
  totalDuration: number; // milliseconds
  progress: number; // percentage
  completed: boolean;
}

// Mock data for demonstration
const MOCK_HISTORY: WatchHistoryItem[] = [
  {
    id: '1',
    lessonId: 'lesson-1',
    lessonTitle: 'Introduction to Linear Equations',
    lessonDescription: 'Learn the basics of linear equations with interactive examples',
    creatorName: 'Jane Smith',
    lastWatchedAt: Date.now() - 3600000, // 1 hour ago
    watchPosition: 1800000, // 30 minutes
    totalDuration: 3600000, // 60 minutes
    progress: 50,
    completed: false,
  },
  {
    id: '2',
    lessonId: 'lesson-2',
    lessonTitle: 'Quadratic Functions Deep Dive',
    lessonDescription: 'Master quadratic functions with visual examples',
    creatorName: 'Jane Smith',
    lastWatchedAt: Date.now() - 86400000, // 1 day ago
    watchPosition: 5400000, // 90 minutes
    totalDuration: 5400000, // 90 minutes
    progress: 100,
    completed: true,
  },
  {
    id: '3',
    lessonId: 'lesson-3',
    lessonTitle: 'Advanced Calculus Concepts',
    lessonDescription: 'Explore derivatives and integrals',
    creatorName: 'John Doe',
    lastWatchedAt: Date.now() - 86400000 * 2, // 2 days ago
    watchPosition: 1080000, // 18 minutes
    totalDuration: 7200000, // 120 minutes
    progress: 15,
    completed: false,
  },
  {
    id: '4',
    lessonId: 'lesson-4',
    lessonTitle: 'Polynomial Functions',
    lessonDescription: 'Understanding polynomial behavior',
    creatorName: 'Alice Brown',
    lastWatchedAt: Date.now() - 86400000 * 5, // 5 days ago
    watchPosition: 2400000, // 40 minutes
    totalDuration: 4800000, // 80 minutes
    progress: 50,
    completed: false,
  },
];

export default function HistoryPage() {
  const [history] = useState<WatchHistoryItem[]>(MOCK_HISTORY);

  const handleResume = (item: WatchHistoryItem) => {
    console.log('Resume lesson:', item.lessonId, 'at', item.watchPosition);
    // TODO: Navigate to lesson at watch position
  };

  const handleRestart = (item: WatchHistoryItem) => {
    console.log('Restart lesson:', item.lessonId);
    // TODO: Navigate to lesson from beginning
  };

  const handleRemove = (itemId: string) => {
    console.log('Remove from history:', itemId);
    // TODO: Remove from history
  };

  const formatLastWatched = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const groupedHistory = {
    today: history.filter((h) => Date.now() - h.lastWatchedAt < 86400000),
    thisWeek: history.filter(
      (h) => Date.now() - h.lastWatchedAt >= 86400000 && Date.now() - h.lastWatchedAt < 864000000 * 7
    ),
    older: history.filter((h) => Date.now() - h.lastWatchedAt >= 864000000 * 7),
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Watch History</h1>
        <p className="text-muted-foreground">
          Continue where you left off
        </p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No watch history yet. Start learning to see your history here!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Today */}
          {groupedHistory.today.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Today</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedHistory.today.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    formatLastWatched={formatLastWatched}
                    formatDuration={formatDuration}
                    onResume={() => handleResume(item)}
                    onRestart={() => handleRestart(item)}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* This Week */}
          {groupedHistory.thisWeek.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">This Week</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedHistory.thisWeek.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    formatLastWatched={formatLastWatched}
                    formatDuration={formatDuration}
                    onResume={() => handleResume(item)}
                    onRestart={() => handleRestart(item)}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Older */}
          {groupedHistory.older.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Older</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedHistory.older.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    formatLastWatched={formatLastWatched}
                    formatDuration={formatDuration}
                    onResume={() => handleResume(item)}
                    onRestart={() => handleRestart(item)}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

interface HistoryCardProps {
  item: WatchHistoryItem;
  formatLastWatched: (timestamp: number) => string;
  formatDuration: (ms: number) => string;
  onResume: () => void;
  onRestart: () => void;
  onRemove: () => void;
}

function HistoryCard({ item, formatLastWatched, formatDuration, onResume, onRestart, onRemove }: HistoryCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{item.lessonTitle}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {item.lessonDescription}
            </CardDescription>
          </div>
          {item.completed && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{item.creatorName}</span>
          <span>•</span>
          <span>{formatLastWatched(item.lastWatchedAt)}</span>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{item.progress}%</span>
          </div>
          <Progress value={item.progress} className="h-2" />
        </div>

        {/* Time info */}
        <div className="text-xs text-muted-foreground">
          {item.completed ? (
            <span>Completed • {formatDuration(item.totalDuration)}</span>
          ) : (
            <span>
              {formatDuration(item.watchPosition)} / {formatDuration(item.totalDuration)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          size="sm"
          onClick={onResume}
          className="flex-1"
        >
          {item.completed ? 'Review' : 'Continue'}
        </Button>
        {!item.completed && item.progress > 10 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
          >
            Restart
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}
