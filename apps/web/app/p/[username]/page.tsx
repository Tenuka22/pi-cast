/**
 * Public Profile Page
 * 
 * Display creator's public profile with their lessons and stats.
 */

'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';

// Mock data for demonstration
const MOCK_USER = {
  id: '1',
  name: 'Jane Smith',
  bio: 'Mathematics teacher with 10+ years of experience. Passionate about making math accessible and fun for everyone.',
  location: 'San Francisco, CA',
  website: 'https://janesmith.edu',
  image: null,
  role: 'teacher',
  createdAt: Date.now() - 86400000 * 365, // 1 year ago
};

const MOCK_STATS = {
  lessons: 12,
  students: 1543,
  rating: 4.8,
};

const MOCK_LESSONS = [
  {
    id: '1',
    title: 'Introduction to Linear Equations',
    description: 'Learn the basics of linear equations with interactive examples',
    level: 'beginner',
    views: 1234,
    rating: 4.5,
  },
  {
    id: '2',
    title: 'Quadratic Functions Deep Dive',
    description: 'Master quadratic functions with visual examples',
    level: 'intermediate',
    views: 890,
    rating: 4.8,
  },
  {
    id: '3',
    title: 'Advanced Calculus Concepts',
    description: 'Explore derivatives and integrals',
    level: 'advanced',
    views: 567,
    rating: 4.9,
  },
];

export default function PublicProfilePage() {
  const [user] = useState(MOCK_USER);
  const [stats] = useState(MOCK_STATS);
  const [lessons] = useState(MOCK_LESSONS);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-4xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-bold">{user.name}</h1>
              {user.role && (
                <Badge className="mt-2" variant="secondary">
                  {user.role === 'teacher' ? '🎓 Teacher' : user.role === 'admin' ? '👑 Admin' : '📚 Student'}
                </Badge>
              )}
              {user.location && (
                <p className="text-muted-foreground mt-2">📍 {user.location}</p>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mt-1 block"
                >
                  🔗 {user.website}
                </a>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button>Follow</Button>
              <Button variant="outline">Message</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Lessons" value={stats.lessons.toString()} />
          <StatCard label="Students" value={formatNumber(stats.students)} />
          <StatCard label="Rating" value={stats.rating.toFixed(1)} />
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lessons */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Lessons ({lessons.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-6 text-center">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function LessonCard({ lesson }: { lesson: typeof MOCK_LESSONS[0] }) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="capitalize">
            {lesson.level}
          </Badge>
          <span className="text-sm text-muted-foreground">⭐ {lesson.rating.toFixed(1)}</span>
        </div>
        <CardTitle className="text-lg">{lesson.title}</CardTitle>
        <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-sm text-muted-foreground">
          👁️ {formatNumber(lesson.views)} views
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Lesson</Button>
      </CardFooter>
    </Card>
  );
}
