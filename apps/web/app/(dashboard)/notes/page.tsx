/**
 * Notes Collection Page
 * 
 * Display all personal notes organized by lesson.
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
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';

interface Note {
  id: string;
  lessonId: string;
  lessonTitle: string;
  content: string;
  timestamp: number; // milliseconds
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
}

// Mock data for demonstration
const MOCK_NOTES: Note[] = [
  {
    id: '1',
    lessonId: 'lesson-1',
    lessonTitle: 'Introduction to Linear Equations',
    content: 'Remember to check the slope formula carefully. The key is understanding how rise over run works with different coordinate pairs.',
    timestamp: 180000, // 3 minutes
    isPrivate: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    lessonId: 'lesson-1',
    lessonTitle: 'Introduction to Linear Equations',
    content: 'Practice problems: y = 2x + 3, y = -x + 5',
    timestamp: 420000, // 7 minutes
    isPrivate: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: '3',
    lessonId: 'lesson-2',
    lessonTitle: 'Quadratic Functions Deep Dive',
    content: 'Vertex form is super important! y = a(x - h)^2 + k where (h, k) is the vertex. This makes graphing so much easier.',
    timestamp: 600000, // 10 minutes
    isPrivate: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: '4',
    lessonId: 'lesson-3',
    lessonTitle: 'Advanced Calculus Concepts',
    content: 'Derivative rules summary:\n- Power rule: d/dx(x^n) = nx^(n-1)\n- Product rule: (fg)\' = f\'g + fg\'\n- Quotient rule: (f/g)\' = (f\'g - fg\')/g^2',
    timestamp: 900000, // 15 minutes
    isPrivate: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
];

export default function NotesPage() {
  const [notes] = useState<Note[]>(MOCK_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'shared'>('all');

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by tab
    if (activeTab === 'private') {
      result = result.filter((n) => n.isPrivate);
    } else if (activeTab === 'shared') {
      result = result.filter((n) => !n.isPrivate);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.content.toLowerCase().includes(query) ||
          n.lessonTitle.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, activeTab, searchQuery]);

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

  const handleJumpToNote = (note: Note) => {
    console.log('Jump to note:', note);
    // TODO: Navigate to lesson at timestamp
  };

  const handleEditNote = (noteId: string) => {
    console.log('Edit note:', noteId);
    // TODO: Open edit dialog
  };

  const handleDeleteNote = (noteId: string) => {
    console.log('Delete note:', noteId);
    // TODO: Delete note
  };

  const stats = {
    total: notes.length,
    private: notes.filter((n) => n.isPrivate).length,
    shared: notes.filter((n) => !n.isPrivate).length,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Notes</h1>
        <p className="text-muted-foreground">
          All your timestamped notes from lessons
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Notes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{stats.private}</div>
            <div className="text-sm text-muted-foreground">Private</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{stats.shared}</div>
            <div className="text-sm text-muted-foreground">Shared</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="private">Private ({stats.private})</TabsTrigger>
            <TabsTrigger value="shared">Shared ({stats.shared})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery
              ? 'No notes match your search'
              : activeTab === 'private'
              ? 'No private notes yet'
              : activeTab === 'shared'
              ? 'No shared notes yet'
              : 'No notes yet. Start taking notes while watching lessons!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleJumpToNote(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {formatTime(note.timestamp)}
                      </span>
                      <Badge variant={note.isPrivate ? 'outline' : 'default'}>
                        {note.isPrivate ? '🔒 Private' : '🌍 Shared'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mb-2">
                      {note.lessonTitle}
                    </CardDescription>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToNote(note);
                      }}
                    >
                      Jump
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note.id);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Updated {formatDate(note.updatedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
