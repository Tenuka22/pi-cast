/**
 * Admin Lesson Review Queue Component
 * 
 * Displays lessons pending review with approval/rejection capabilities.
 * Admins can view, filter, and manage lesson status.
 */

'use client';

import { useState, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';

export interface AdminLesson {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  visibility: 'public' | 'private' | 'organization' | 'unlisted';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  thumbnailUrl?: string | null;
  duration?: number | null;
  creatorId: string;
  creatorName: string;
  organizationId?: string | null;
  views: number;
  completions: number;
  averageRating: number;
  totalRatings: number;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number | null;
}

interface LessonReviewQueueProps {
  lessons: AdminLesson[];
  totalLessons: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onStatusChange: (lessonId: string, status: 'draft' | 'published' | 'archived') => void;
  onViewLesson: (lessonId: string) => void;
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';
type VisibilityFilter = 'all' | 'public' | 'private' | 'organization' | 'unlisted';

export function LessonReviewQueue({
  lessons,
  totalLessons,
  isLoading,
  onPageChange,
  onStatusChange,
  onViewLesson,
}: LessonReviewQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    lessonId: string;
    status: 'draft' | 'published' | 'archived';
  } | null>(null);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(totalLessons / ITEMS_PER_PAGE);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    if (value === 'all' || value === 'draft' || value === 'published' || value === 'archived') {
      setStatusFilter(value);
    }
    setCurrentPage(1);
  }, []);

  const handleVisibilityFilter = useCallback((value: string) => {
    if (value === 'all' || value === 'public' || value === 'private' || value === 'organization' || value === 'unlisted') {
      setVisibilityFilter(value);
    }
    setCurrentPage(1);
  }, []);

  const handleStatusClick = useCallback((lessonId: string, status: 'draft' | 'published' | 'archived') => {
    setPendingAction({ lessonId, status });
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingAction) {
      onStatusChange(pendingAction.lessonId, pendingAction.status);
      setConfirmDialogOpen(false);
      setPendingAction(null);
    }
  }, [pendingAction, onStatusChange]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getVisibilityBadgeVariant = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'default';
      case 'organization':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusActionLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Publish';
      case 'published':
        return 'Archive';
      case 'archived':
        return 'Restore';
      default:
        return 'Manage';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={handleVisibilityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalLessons} lessons total
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading...</div>
        ) : lessons.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No lessons found</div>
        ) : (
          lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onView={() => onViewLesson(lesson.id)}
              onStatusChange={handleStatusClick}
              getStatusBadgeVariant={getStatusBadgeVariant}
              getVisibilityBadgeVariant={getVisibilityBadgeVariant}
              getStatusActionLabel={getStatusActionLabel}
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              onPageChange(currentPage - 1);
            }}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              onPageChange(currentPage + 1);
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {pendingAction?.status === 'published' ? 'Publish' : pendingAction?.status === 'archived' ? 'Archive' : 'Restore'} Lesson
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.status === 'published'
                ? 'This lesson will be visible to the public. Are you sure?'
                : pendingAction?.status === 'archived'
                ? 'This lesson will be hidden from public view. Are you sure?'
                : 'This lesson will be returned to draft status. Are you sure?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={pendingAction?.status === 'published' ? 'default' : 'secondary'}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LessonCardProps {
  lesson: AdminLesson;
  onView: () => void;
  onStatusChange: (lessonId: string, status: 'draft' | 'published' | 'archived') => void;
  getStatusBadgeVariant: (status: string) => 'default' | 'secondary' | 'outline' | 'destructive';
  getVisibilityBadgeVariant: (visibility: string) => 'default' | 'secondary' | 'outline';
  getStatusActionLabel: (status: string) => string;
  formatDate: (timestamp: number) => string;
}

function LessonCard({
  lesson,
  onView,
  onStatusChange,
  getStatusBadgeVariant,
  getVisibilityBadgeVariant,
  getStatusActionLabel,
  formatDate,
}: LessonCardProps) {
  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{lesson.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {lesson.description}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant={getStatusBadgeVariant(lesson.status)}>
            {lesson.status}
          </Badge>
          <Badge variant={getVisibilityBadgeVariant(lesson.visibility)}>
            {lesson.visibility}
          </Badge>
          <Badge variant="outline">
            {lesson.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* Creator */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {lesson.creatorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{lesson.creatorName}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 rounded bg-muted">
            <div className="font-semibold">{formatNumber(lesson.views)}</div>
            <div className="text-muted-foreground">Views</div>
          </div>
          <div className="text-center p-2 rounded bg-muted">
            <div className="font-semibold">{formatNumber(lesson.completions)}</div>
            <div className="text-muted-foreground">Completions</div>
          </div>
          <div className="text-center p-2 rounded bg-muted">
            <div className="font-semibold">
              {lesson.averageRating > 0 ? lesson.averageRating.toFixed(1) : 'N/A'}
            </div>
            <div className="text-muted-foreground">Rating</div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Duration: {formatDuration(lesson.duration)}</div>
          <div>Created: {formatDate(lesson.createdAt)}</div>
          {lesson.publishedAt && (
            <div>Published: {formatDate(lesson.publishedAt)}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          View Details
        </Button>
        <Button
          size="sm"
          onClick={() => onStatusChange(lesson.id, lesson.status === 'published' ? 'archived' : 'published')}
          className="flex-1"
        >
          {getStatusActionLabel(lesson.status)}
        </Button>
      </CardFooter>
    </Card>
  );
}
