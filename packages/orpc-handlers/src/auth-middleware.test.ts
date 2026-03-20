/**
 * Auth Middleware Unit Tests
 * 
 * Tests for authentication and authorization logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGetAuthSession, createGetOptionalAuthSession } from '../../src/auth-middleware';
import { ERROR_CODES } from '../../src/errors';
import { ORPCError } from '@orpc/server';

// Mock auth object
const mockAuth = {
  api: {
    getSession: vi.fn(),
  },
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGetAuthSession', () => {
    describe('Basic Authentication', () => {
      it('should return session when valid', async () => {
        const mockSession = {
          session: {
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            token: 'token-123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            image: null,
            role: 'student',
            banned: false,
          },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

        const getAuthSession = createGetAuthSession(mockAuth as any);
        const headers = new Headers();
        const session = await getAuthSession(headers);

        expect(session.user.id).toBe('user-1');
        expect(session.user.email).toBe('test@example.com');
      });

      it('should throw UNAUTHORIZED when no session', async () => {
        mockAuth.api.getSession.mockResolvedValueOnce(null);

        const getAuthSession = createGetAuthSession(mockAuth as any);
        const headers = new Headers();

        await expect(getAuthSession(headers)).rejects.toThrow(ORPCError);
        await expect(getAuthSession(headers)).rejects.toThrow(ERROR_CODES.UNAUTHORIZED);
      });

      it('should throw UNAUTHORIZED when session is expired', async () => {
        const mockSession = {
          session: {
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 1000), // Expired
            token: 'token-123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            image: null,
            role: 'student',
            banned: false,
          },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(null); // Better Auth handles expiration

        const getAuthSession = createGetAuthSession(mockAuth as any);
        const headers = new Headers();

        await expect(getAuthSession(headers)).rejects.toThrow(ORPCError);
      });
    });

    describe('Email Verification', () => {
      it('should allow verified user', async () => {
        const mockSession = {
          session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000), token: 'token', createdAt: new Date(), updatedAt: new Date() },
          user: { id: 'user-1', name: 'Test', email: 'test@example.com', emailVerified: true, image: null, role: 'student', banned: false },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

        const getAuthSession = createGetAuthSession(mockAuth as any, { requireEmailVerified: true });
        const session = await getAuthSession(new Headers());

        expect(session.user.emailVerified).toBe(true);
      });

      it('should throw EMAIL_NOT_VERIFIED for unverified user', async () => {
        const mockSession = {
          session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000), token: 'token', createdAt: new Date(), updatedAt: new Date() },
          user: { id: 'user-1', name: 'Test', email: 'test@example.com', emailVerified: false, image: null, role: 'student', banned: false },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

        const getAuthSession = createGetAuthSession(mockAuth as any, { requireEmailVerified: true });

        await expect(getAuthSession(new Headers())).rejects.toThrow(ERROR_CODES.EMAIL_NOT_VERIFIED);
      });
    });

    describe('Role Requirements', () => {
      it('should allow user with required role', async () => {
        const mockSession = {
          session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000), token: 'token', createdAt: new Date(), updatedAt: new Date() },
          user: { id: 'user-1', name: 'Admin', email: 'admin@example.com', emailVerified: true, image: null, role: 'admin', banned: false },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

        const getAuthSession = createGetAuthSession(mockAuth as any, { requiredRoles: ['admin'] });
        const session = await getAuthSession(new Headers());

        expect(session.user.role).toBe('admin');
      });

      it('should allow user with any of multiple required roles', async () => {
        const mockSession = {
          session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000), token: 'token', createdAt: new Date(), updatedAt: new Date() },
          user: { id: 'user-1', name: 'Teacher', email: 'teacher@example.com', emailVerified: true, image: null, role: 'teacher', banned: false },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

        const getAuthSession = createGetAuthSession(mockAuth as any, { requiredRoles: ['admin', 'teacher'] });
        const session = await getAuthSession(new Headers());

        expect(session.user.role).toBe('teacher');
      });

      it('should throw INSUFFICIENT_PERMISSIONS for wrong role', async () => {
        const mockSession = {
          session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000), token: 'token', createdAt: new Date(), updatedAt: new Date() },
          user: { id: 'user-1', name: 'Student', email: 'student@example.com', emailVerified: true, image: null, role: 'student', banned: false },
        };

        mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

        const getAuthSession = createGetAuthSession(mockAuth as any, { requiredRoles: ['admin'] });

        await expect(getAuthSession(new Headers())).rejects.toThrow(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      });
    });

    describe('Missing Headers', () => {
      it('should throw UNAUTHORIZED when headers missing', async () => {
        const getAuthSession = createGetAuthSession(mockAuth as any);

        await expect(getAuthSession(null as any)).rejects.toThrow('Missing headers');
      });
    });
  });

  describe('createGetOptionalAuthSession', () => {
    it('should return session when authenticated', async () => {
      const mockSession = {
        session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000), token: 'token', createdAt: new Date(), updatedAt: new Date() },
        user: { id: 'user-1', name: 'Test', email: 'test@example.com', emailVerified: true, image: null, role: 'student', banned: false },
      };

      mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

      const getOptionalAuthSession = createGetOptionalAuthSession(mockAuth as any);
      const session = await getOptionalAuthSession(new Headers());

      expect(session).not.toBeNull();
      expect(session?.user.id).toBe('user-1');
    });

    it('should return null when not authenticated', async () => {
      mockAuth.api.getSession.mockResolvedValueOnce(null);

      const getOptionalAuthSession = createGetOptionalAuthSession(mockAuth as any);
      const session = await getOptionalAuthSession(new Headers());

      expect(session).toBeNull();
    });

    it('should return null when headers missing', async () => {
      const getOptionalAuthSession = createGetOptionalAuthSession(mockAuth as any);
      const session = await getOptionalAuthSession(null as any);

      expect(session).toBeNull();
    });
  });
});
