/**
 * Enrolled Lessons Page
 * 
 * Display all lessons the student is enrolled in.
 */

'use client';

import { useState } from 'react';
import { EnrolledLessonsDisplay } from '@/components/dashboard/enrolled-lessons';
import type { EnrolledLesson } from '@/components/dashboard/enrolled-lessons';

// Mock data for demonstration
const MOCK_ENROLLED_LESSONS: EnrolledLesson[] = [
  {
    id: '1',
    lessonId: 'lesson-1',
    title: 'Introduction to Linear Equations',
    description: 'Learn the basics of linear equations with interactive examples',
    creatorName: 'Jane Smith',
    progress: 75,
    isCompleted: false,
    lastAccessedAt: Date.now() - 3600000, // 1 hour ago
    totalWatchTime: 45,
    enrolledAt: Date.now() - 86400000 * 5, // 5 days ago
    level: 'beginner',
    duration: 60,
  },
  {
    id: '2',
    lessonId: 'lesson-2',
    title: 'Quadratic Functions Deep Dive',
    description: 'Master quadratic functions with visual examples',
    creatorName: 'Jane Smith',
    progress: 100,
    isCompleted: true,
    completedAt: Date.now() - 86400000 * 2,
    lastAccessedAt: Date.now() - 86400000 * 2,
    totalWatchTime: 90,
    enrolledAt: Date.now() - 86400000 * 10,
    level: 'intermediate',
    duration: 90,
  },
  {
    id: '3',
    lessonId: 'lesson-3',
    title: 'Advanced Calculus Concepts',
    description: 'Explore derivatives and integrals',
    creatorName: 'John Doe',
    progress: 30,
    isCompleted: false,
    lastAccessedAt: Date.now() - 86400000, // 1 day ago
    totalWatchTime: 25,
    enrolledAt: Date.now() - 86400000 * 3,
    level: 'advanced',
    duration: 120,
  },
];

export default function EnrolledLessonsPage() {
  const [lessons] = useState<EnrolledLesson[]>(MOCK_ENROLLED_LESSONS);

  const handleLessonClick = (lessonId: string) => {
    console.log('Navigate to lesson:', lessonId);
    // TODO: Navigate to lesson page
  };

  const handleResumeLesson = (lessonId: string) => {
    console.log('Resume lesson:', lessonId);
    // TODO: Navigate to lesson playback
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Lessons</h1>
        <p className="text-muted-foreground">
          Track your enrolled lessons and continue learning
        </p>
      </div>

      <EnrolledLessonsDisplay
        lessons={lessons}
        onLessonClick={handleLessonClick}
        onResumeLesson={handleResumeLesson}
      />
    </div>
  );
}
