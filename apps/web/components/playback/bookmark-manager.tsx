/**
 * Bookmark Manager Component
 * 
 * Displays and manages bookmarks for lesson playback.
 * Supports creating, editing, and deleting bookmarks.
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Textarea } from '@workspace/ui/components/textarea';
import type { Bookmark } from '@/lib/recording-system/types';

interface BookmarkManagerProps {
  bookmarks: Bookmark[];
  currentTime: number;
  onAddBookmark: (title: string, description?: string) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  onJumpToBookmark: (bookmarkId: string) => void;
  onEditBookmark?: (bookmarkId: string, title: string, description?: string) => void;
}

export function BookmarkManager({
  bookmarks,
  currentTime,
  onAddBookmark,
  onRemoveBookmark,
  onJumpToBookmark,
  onEditBookmark,
}: BookmarkManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOpenDialog = useCallback(() => {
    setTitle('');
    setDescription('');
    setEditingBookmark(null);
    setIsDialogOpen(true);
  }, []);

  const handleSaveBookmark = useCallback(() => {
    if (!title.trim()) return;

    if (editingBookmark && onEditBookmark) {
      onEditBookmark(editingBookmark.id, title.trim(), description.trim() || undefined);
    } else {
      onAddBookmark(title.trim(), description.trim() || undefined);
    }

    setIsDialogOpen(false);
    setTitle('');
    setDescription('');
    setEditingBookmark(null);
  }, [title, description, editingBookmark, onAddBookmark, onEditBookmark]);

  const handleEditBookmark = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setTitle(bookmark.title);
    setDescription(bookmark.description || '');
    setIsDialogOpen(true);
  }, []);

  const sortedBookmarks = [...bookmarks].sort((a, b) => a.timestamp - b.timestamp);

  const teacherBookmarks = sortedBookmarks.filter((b) => b.type === 'teacher');
  const studentBookmarks = sortedBookmarks.filter((b) => b.type === 'student');

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Bookmarks</CardTitle>
            <CardDescription>
              Navigate key moments and create personal markers
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenDialog}>
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBookmark ? 'Edit Bookmark' : 'Create Bookmark'}
                </DialogTitle>
                <DialogDescription>
                  {editingBookmark
                    ? 'Update your bookmark details'
                    : `Create a bookmark at ${formatTime(currentTime)}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bookmark-title">Title</Label>
                  <Input
                    id="bookmark-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Key Concept: Slope Formula"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bookmark-description">Description (optional)</Label>
                  <Textarea
                    id="bookmark-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this bookmark..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBookmark} disabled={!title.trim()}>
                  {editingBookmark ? 'Save Changes' : 'Create Bookmark'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Teacher Bookmarks */}
          {teacherBookmarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Teacher Bookmarks
              </h4>
              <div className="space-y-2">
                {teacherBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    formatTime={formatTime}
                    onJump={() => onJumpToBookmark(bookmark.id)}
                    onEdit={onEditBookmark ? () => handleEditBookmark(bookmark) : undefined}
                    onDelete={onRemoveBookmark}
                    canEdit={bookmark.type === 'student' || !!onEditBookmark}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Student Bookmarks */}
          {studentBookmarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Your Bookmarks
              </h4>
              <div className="space-y-2">
                {studentBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    formatTime={formatTime}
                    onJump={() => onJumpToBookmark(bookmark.id)}
                    onEdit={() => handleEditBookmark(bookmark)}
                    onDelete={onRemoveBookmark}
                    canEdit
                  />
                ))}
              </div>
            </div>
          )}

          {bookmarks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No bookmarks yet. Add bookmarks to mark important moments.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  formatTime: (ms: number) => string;
  onJump: () => void;
  onEdit?: () => void;
  onDelete: (bookmarkId: string) => void;
  canEdit: boolean;
}

function BookmarkItem({
  bookmark,
  formatTime,
  onJump,
  onEdit,
  onDelete,
  canEdit,
}: BookmarkItemProps) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onJump}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-1 h-8 rounded-full shrink-0"
          style={{ backgroundColor: bookmark.color || '#3b82f6' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{bookmark.title}</p>
          {bookmark.description && (
            <p className="text-xs text-muted-foreground truncate">
              {bookmark.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatTime(bookmark.timestamp)}
          </p>
        </div>
      </div>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger onClick={(e: any) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onJump(); }}>
              Jump to timestamp
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bookmark.id);
              }}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
