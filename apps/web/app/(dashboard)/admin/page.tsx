/**
 * Admin Dashboard Page
 * 
 * Main admin interface for platform management.
 * Includes user management, lesson review, and analytics.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { AdminUserList } from '@/components/admin/user-list';
import { LessonReviewQueue } from '@/components/admin/lesson-review-queue';
import type { AdminUser } from '@/components/admin/user-list';
import type { AdminLesson } from '@/components/admin/lesson-review-queue';

// Mock data for demonstration
const MOCK_USERS: AdminUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    role: 'admin',
    banned: false,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    emailVerified: true,
    role: 'teacher',
    banned: false,
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    emailVerified: false,
    role: 'student',
    banned: false,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now(),
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    emailVerified: true,
    role: 'student',
    banned: true,
    banReason: 'Violated community guidelines',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now(),
  },
];

const MOCK_LESSONS: AdminLesson[] = [
  {
    id: '1',
    title: 'Introduction to Linear Equations',
    description: 'Learn the basics of linear equations with interactive examples',
    status: 'published',
    visibility: 'public',
    level: 'beginner',
    creatorId: '2',
    creatorName: 'Jane Smith',
    views: 1234,
    completions: 567,
    averageRating: 4.5,
    totalRatings: 89,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 86400000 * 5,
  },
  {
    id: '2',
    title: 'Quadratic Functions Deep Dive',
    description: 'Master quadratic functions with visual examples',
    status: 'draft',
    visibility: 'private',
    level: 'intermediate',
    creatorId: '2',
    creatorName: 'Jane Smith',
    views: 0,
    completions: 0,
    averageRating: 0,
    totalRatings: 0,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
  },
  {
    id: '3',
    title: 'Advanced Calculus Concepts',
    description: 'Explore derivatives and integrals',
    status: 'published',
    visibility: 'public',
    level: 'advanced',
    creatorId: '2',
    creatorName: 'Jane Smith',
    views: 890,
    completions: 234,
    averageRating: 4.8,
    totalRatings: 45,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 86400000 * 15,
  },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lessons'>('overview');
  const [users] = useState<AdminUser[]>(MOCK_USERS);
  const [lessons] = useState<AdminLesson[]>(MOCK_LESSONS);

  const handleRoleChange = useCallback((userId: string, role: 'student' | 'teacher' | 'admin') => {
    console.log(`Update user ${userId} role to ${role}`);
    // TODO: Implement API call
  }, []);

  const handleBanUser = useCallback((userId: string, banned: boolean, reason?: string) => {
    console.log(`Ban user ${userId}: ${banned}, reason: ${reason}`);
    // TODO: Implement API call
  }, []);

  const handleViewUser = useCallback((userId: string) => {
    console.log(`View user ${userId}`);
    // TODO: Navigate to user detail page
  }, []);

  const handleStatusChange = useCallback((lessonId: string, status: 'draft' | 'published' | 'archived') => {
    console.log(`Update lesson ${lessonId} status to ${status}`);
    // TODO: Implement API call
  }, []);

  const handleViewLesson = useCallback((lessonId: string) => {
    console.log(`View lesson ${lessonId}`);
    // TODO: Navigate to lesson detail page
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, lessons, and platform settings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={users.length.toString()}
          description="Active user accounts"
        />
        <StatCard
          title="Total Lessons"
          value={lessons.length.toString()}
          description="Published lessons"
        />
        <StatCard
          title="Pending Reviews"
          value={lessons.filter((l) => l.status === 'draft').length.toString()}
          description="Lessons awaiting approval"
        />
        <StatCard
          title="Banned Users"
          value={users.filter((u) => u.banned).length.toString()}
          description="Suspended accounts"
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>New user registered</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lesson published</span>
                    <span className="text-muted-foreground">5 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User banned</span>
                    <span className="text-muted-foreground">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  Review Lessons
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <AdminUserList
            users={users}
            totalUsers={users.length}
            isLoading={false}
            onPageChange={() => {}}
            onRoleChange={handleRoleChange}
            onBanUser={handleBanUser}
            onViewUser={handleViewUser}
          />
        </TabsContent>

        <TabsContent value="lessons">
          <LessonReviewQueue
            lessons={lessons}
            totalLessons={lessons.length}
            isLoading={false}
            onPageChange={() => {}}
            onStatusChange={handleStatusChange}
            onViewLesson={handleViewLesson}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
