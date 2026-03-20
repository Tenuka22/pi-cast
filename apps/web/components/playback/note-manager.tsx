/**
 * Note Manager Component
 * 
 * Displays and manages timestamped notes for lesson playback.
 * Supports creating, editing, and deleting notes.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
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
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';

export interface LessonNote {
  id: string;
  content: string;
  timestamp: number;
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
}

interface NoteManagerProps {
  notes: LessonNote[];
  currentTime: number;
  onAddNote: (content: string, timestamp: number, isPrivate: boolean) => void;
  onUpdateNote: (noteId: string, content: string, isPrivate: boolean) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToTimestamp: (timestamp: number) => void;
}

export function NoteManager({
  notes,
  currentTime,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onJumpToTimestamp,
}: NoteManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<LessonNote | null>(null);
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleOpenDialog = useCallback(() => {
    setContent('');
    setEditingNote(null);
    setIsPrivate(true);
    setIsDialogOpen(true);
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!content.trim()) return;

    if (editingNote) {
      onUpdateNote(editingNote.id, content.trim(), isPrivate);
    } else {
      onAddNote(content.trim(), currentTime, isPrivate);
    }

    setIsDialogOpen(false);
    setContent('');
    setEditingNote(null);
  }, [content, currentTime, editingNote, isPrivate, onAddNote, onUpdateNote]);

  const handleEditNote = useCallback((note: LessonNote) => {
    setEditingNote(note);
    setContent(note.content);
    setIsPrivate(note.isPrivate);
    setIsDialogOpen(true);
  }, []);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.createdAt - a.createdAt),
    [notes]
  );

  const privateNotes = useMemo(
    () => sortedNotes.filter((n) => n.isPrivate),
    [sortedNotes]
  );

  const sharedNotes = useMemo(
    () => sortedNotes.filter((n) => !n.isPrivate),
    [sortedNotes]
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Notes</CardTitle>
            <CardDescription>
              Take timestamped notes while watching
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenDialog}>
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? 'Edit Note' : 'Create Note'}
                </DialogTitle>
                <DialogDescription>
                  {editingNote
                    ? 'Update your note'
                    : `Create a note at ${formatTime(currentTime)}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="note-content">Note</Label>
                  <Textarea
                    id="note-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note here..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="note-private"
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="note-private" className="text-sm cursor-pointer">
                    Keep this note private
                  </Label>
                </div>
                {!editingNote && (
                  <div className="text-xs text-muted-foreground">
                    Timestamp: <span className="font-mono">{formatTime(currentTime)}</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} disabled={!content.trim()}>
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({notes.length})</TabsTrigger>
            <TabsTrigger value="private">Private ({privateNotes.length})</TabsTrigger>
            <TabsTrigger value="shared">Shared ({sharedNotes.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <NoteList
              notes={sortedNotes}
              formatTime={formatTime}
              onJump={onJumpToTimestamp}
              onEdit={handleEditNote}
              onDelete={onDeleteNote}
              emptyMessage="No notes yet. Add your first note!"
            />
          </TabsContent>
          <TabsContent value="private" className="mt-4">
            <NoteList
              notes={privateNotes}
              formatTime={formatTime}
              onJump={onJumpToTimestamp}
              onEdit={handleEditNote}
              onDelete={onDeleteNote}
              emptyMessage="No private notes yet."
            />
          </TabsContent>
          <TabsContent value="shared" className="mt-4">
            <NoteList
              notes={sharedNotes}
              formatTime={formatTime}
              onJump={onJumpToTimestamp}
              onEdit={handleEditNote}
              onDelete={onDeleteNote}
              emptyMessage="No shared notes yet."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface NoteListProps {
  notes: LessonNote[];
  formatTime: (ms: number) => string;
  onJump: (timestamp: number) => void;
  onEdit: (note: LessonNote) => void;
  onDelete: (noteId: string) => void;
  emptyMessage: string;
}

function NoteList({
  notes,
  formatTime,
  onJump,
  onEdit,
  onDelete,
  emptyMessage,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          formatTime={formatTime}
          onJump={() => onJump(note.timestamp)}
          onEdit={() => onEdit(note)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </div>
  );
}

interface NoteItemProps {
  note: LessonNote;
  formatTime: (ms: number) => string;
  onJump: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function NoteItem({ note, formatTime, onJump, onEdit, onDelete }: NoteItemProps) {
  return (
    <div
      className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onJump}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {formatTime(note.timestamp)}
          </span>
          {note.isPrivate ? (
            <span className="text-xs text-muted-foreground">🔒 Private</span>
          ) : (
            <span className="text-xs text-muted-foreground">🌍 Shared</span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Updated {new Date(note.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
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
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
