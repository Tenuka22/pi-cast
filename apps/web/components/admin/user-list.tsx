/**
 * Admin User Management Component
 * 
 * Displays list of all users with filtering and management capabilities.
 * Admins can view, search, filter, update roles, and ban users.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
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
} from '@workspace/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: 'student' | 'teacher' | 'admin' | null;
  banned: boolean;
  banReason?: string | null;
  banExpires?: number | null;
  createdAt: number;
  updatedAt: number;
}

interface UserListProps {
  users: AdminUser[];
  totalUsers: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRoleChange: (userId: string, role: 'student' | 'teacher' | 'admin') => void;
  onBanUser: (userId: string, banned: boolean, reason?: string) => void;
  onViewUser: (userId: string) => void;
}

type SortField = 'name' | 'email' | 'createdAt' | 'lastActive';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'banned';
type RoleFilter = 'all' | 'student' | 'teacher' | 'admin';

export function AdminUserList({
  users,
  totalUsers,
  isLoading,
  onPageChange,
  onRoleChange,
  onBanUser,
  onViewUser,
}: UserListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value as StatusFilter);
    setCurrentPage(1);
  }, []);

  const handleRoleFilter = useCallback((value: string) => {
    setRoleFilter(value as RoleFilter);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortField(field);
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleBanClick = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDialogOpen(true);
  }, []);

  const handleConfirmBan = useCallback(() => {
    if (selectedUser) {
      onBanUser(selectedUser.id, !selectedUser.banned, banReason || undefined);
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
    }
  }, [selectedUser, banReason, onBanUser]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeVariant = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search users..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={handleRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalUsers} users total
        </div>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort(sortField === 'createdAt' ? 'name' : 'createdAt')}
            >
              Sort by {sortField} {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onView={() => onViewUser(user.id)}
                  onRoleChange={onRoleChange}
                  onBan={() => handleBanClick(user)}
                  getRoleBadgeVariant={getRoleBadgeVariant}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.banned ? 'Unban User' : 'Ban User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.banned
                ? `Unban ${selectedUser.name}? They will be able to access the platform again.`
                : `Ban ${selectedUser?.name}? They will not be able to access the platform.`}
            </DialogDescription>
          </DialogHeader>
          {!selectedUser?.banned && (
            <div className="py-4">
              <Input
                placeholder="Ban reason (optional)"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.banned ? 'default' : 'destructive'}
              onClick={handleConfirmBan}
            >
              {selectedUser?.banned ? 'Unban' : 'Ban'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserRowProps {
  user: AdminUser;
  onView: () => void;
  onRoleChange: (userId: string, role: 'student' | 'teacher' | 'admin') => void;
  onBan: () => void;
  getRoleBadgeVariant: (role?: string | null) => 'default' | 'secondary' | 'destructive';
  formatDate: (timestamp: number) => string;
}

function UserRow({ user, onView, onRoleChange, onBan, getRoleBadgeVariant, formatDate }: UserRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback>
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{user.name}</p>
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {user.role || 'student'}
            </Badge>
            {user.banned && (
              <Badge variant="destructive">Banned</Badge>
            )}
            {!user.emailVerified && (
              <Badge variant="outline">Unverified</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            Joined {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger onClick={(e: any) => e.stopPropagation()}>
          <Button variant="ghost" size="sm">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onRoleChange(user.id, 'student')}>
            Set as Student
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange(user.id, 'teacher')}>
            Set as Teacher
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange(user.id, 'admin')}>
            Set as Admin
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onBan} className="text-destructive">
            {user.banned ? 'Unban User' : 'Ban User'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
