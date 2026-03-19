/**
 * Lesson Discovery Component
 * 
 * Homepage with featured lessons, search, and browsing.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { Lesson, Category } from '@/lib/lesson-system/types';

interface LessonDiscoveryProps {
  lessons?: Lesson[];
  categories?: Category[];
  onLessonClick?: (lesson: Lesson) => void;
  className?: string;
}

// Mock data for demonstration
const MOCK_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Introduction to Linear Equations',
    description: 'Learn the basics of linear equations and graphing',
    status: 'published',
    visibility: 'public',
    level: 'beginner',
    tags: ['algebra', 'linear', 'equations'],
    creatorId: 'user-1',
    creatorName: 'Sarah Chen',
    views: 1234,
    completions: 890,
    averageRating: 4.8,
    totalRatings: 156,
    createdAt: Date.now() - 86400000 * 7,
    publishedAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 1,
    version: 3,
    blocks: [],
    bookmarks: [],
  },
  {
    id: 'lesson-2',
    title: 'Quadratic Functions Masterclass',
    description: 'Master quadratic functions and parabolas',
    status: 'published',
    visibility: 'public',
    level: 'intermediate',
    tags: ['algebra', 'quadratic', 'functions'],
    creatorId: 'user-2',
    creatorName: 'John Smith',
    views: 2345,
    completions: 1567,
    averageRating: 4.9,
    totalRatings: 234,
    createdAt: Date.now() - 86400000 * 14,
    publishedAt: Date.now() - 86400000 * 13,
    updatedAt: Date.now() - 86400000 * 2,
    version: 5,
    blocks: [],
    bookmarks: [],
  },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Algebra', slug: 'algebra', order: 1, isFeatured: true, lessonCount: 45 },
  { id: 'cat-2', name: 'Geometry', slug: 'geometry', order: 2, isFeatured: true, lessonCount: 32 },
  { id: 'cat-3', name: 'Calculus', slug: 'calculus', order: 3, isFeatured: true, lessonCount: 28 },
  { id: 'cat-4', name: 'Statistics', slug: 'statistics', order: 4, isFeatured: false, lessonCount: 19 },
];

export function LessonDiscovery({ lessons, categories, onLessonClick, className }: LessonDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular');

  const displayLessons = lessons || MOCK_LESSONS;
  const displayCategories = categories || MOCK_CATEGORIES;

  // Filter and sort lessons
  const filteredLessons = useMemo(() => {
    let filtered = [...displayLessons];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.description.toLowerCase().includes(query) ||
          lesson.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((lesson) => lesson.categoryId === selectedCategory);
    }

    // Level filter
    if (selectedLevel) {
      filtered = filtered.filter((lesson) => lesson.level === selectedLevel);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
        break;
      case 'rating':
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
    }

    return filtered;
  }, [displayLessons, searchQuery, selectedCategory, selectedLevel, sortBy]);

  // Get featured lessons
  const featuredLessons = useMemo(() => {
    return [...displayLessons]
      .filter((lesson) => lesson.status === 'published' && lesson.visibility === 'public')
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
  }, [displayLessons]);

  return (
    <div className={cn('flex min-h-screen flex-col', className)}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-4xl font-bold">Learn Mathematics Interactively</h1>
          <p className="mb-6 text-lg text-muted-foreground">
            Explore interactive lessons with real-time visualization
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons..."
                className="flex-1 rounded-md border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto flex-1 px-4 py-8">
        {/* Categories */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Browse Categories</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={cn(
                'rounded-full px-4 py-2 text-sm transition-colors',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent'
              )}
            >
              All
            </button>
            {displayCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                )}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-60">({category.lessonCount})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Lessons */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Featured Lessons</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {featuredLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} onClick={() => onLessonClick?.(lesson)} />
              ))}
            </div>
          </div>
        )}

        {/* All Lessons */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {searchQuery ? 'Search Results' : selectedCategory ? 'Lessons' : 'All Lessons'}
            </h2>
            <div className="flex items-center gap-4">
              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value || undefined)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {filteredLessons.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} onClick={() => onLessonClick?.(lesson)} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No lessons found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Lesson Card Component
function LessonCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5" />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium',
              lesson.level === 'beginner' && 'bg-green-100 text-green-800',
              lesson.level === 'intermediate' && 'bg-yellow-100 text-yellow-800',
              lesson.level === 'advanced' && 'bg-red-100 text-red-800'
            )}
          >
            {lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
          </span>
          {lesson.averageRating > 0 && (
            <span className="flex items-center gap-1 text-xs text-yellow-600">
              ★ {lesson.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <h3 className="mb-1 font-semibold">{lesson.title}</h3>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{lesson.description}</p>

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>{lesson.creatorName}</span>
          <span>{lesson.views.toLocaleString()} views</span>
        </div>
      </div>
    </button>
  );
}

export default LessonDiscovery;
