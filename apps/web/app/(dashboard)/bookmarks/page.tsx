/**
 * Bookmarks Library Page
 * 
 * Display all personal bookmarks across lessons.
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

interface Bookmark {
  id: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  description?: string;
  timestamp: number; // milliseconds
  type: 'teacher' | 'student';
  createdAt: number;
}

// Mock data for demonstration
const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: '1',
    lessonId: 'lesson-1',
    lessonTitle: 'Introduction to Linear Equations',
    title: 'Key Concept: Slope Formula',
    description: 'Remember: m = (y2 - y1) / (x2 - x1)',
    timestamp: 120000, // 2 minutes
    type: 'student',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: '2',
    lessonId: 'lesson-1',
    lessonTitle: 'Introduction to Linear Equations',
    title: 'Y-Intercept Explanation',
    timestamp: 300000, // 5 minutes
    type: 'teacher',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: '3',
    lessonId: 'lesson-2',
    lessonTitle: 'Quadratic Functions Deep Dive',
    title: 'Important: Vertex Form',
    description: 'y = a(x - h)^2 + k',
    timestamp: 600000, // 10 minutes
    type: 'student',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: '4',
    lessonId: 'lesson-3',
    lessonTitle: 'Advanced Calculus Concepts',
    title: 'Derivative Rules',
    timestamp: 900000, // 15 minutes
    type: 'student',
    createdAt: Date.now() - 86400000,
  },
];

export default function BookmarksPage() {
  const [bookmarks] = useState<Bookmark[]>(MOCK_BOOKMARKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLesson, setFilterLesson] = useState<string>('all');

  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    if (filterLesson !== 'all') {
      result = result.filter((b) => b.lessonId === filterLesson);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.lessonTitle.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [bookmarks, filterLesson, searchQuery]);

  const uniqueLessons = useMemo(() => {
    const lessonMap = new Map<string, string>();
    bookmarks.forEach((b) => {
      lessonMap.set(b.lessonId, b.lessonTitle);
    });
    return Array.from(lessonMap.entries());
  }, [bookmarks]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleJumpToBookmark = (bookmark: Bookmark) => {
    console.log('Jump to bookmark:', bookmark);
    // TODO: Navigate to lesson at timestamp
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    console.log('Delete bookmark:', bookmarkId);
    // TODO: Delete bookmark
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bookmarks</h1>
        <p className="text-muted-foreground">
          All your saved moments across lessons
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <select
            value={filterLesson}
            onChange={(e) => setFilterLesson(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Lessons</option>
            {uniqueLessons.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredBookmarks.length} bookmarks
        </div>
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterLesson !== 'all'
              ? 'No bookmarks match your filters'
              : 'No bookmarks yet. Add bookmarks while watching lessons!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredBookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className="hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleJumpToBookmark(bookmark)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={bookmark.type === 'teacher' ? 'secondary' : 'default'}>
                        {bookmark.type === 'teacher' ? 'Teacher' : 'Your'}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {formatTime(bookmark.timestamp)}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{bookmark.title}</CardTitle>
                    {bookmark.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {bookmark.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToBookmark(bookmark);
                      }}
                    >
                      Jump
                    </Button>
                    {bookmark.type === 'student' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBookmark(bookmark.id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{bookmark.lessonTitle}</span>
                  <span className="mx-2">•</span>
                  <span>Added {formatDate(bookmark.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
