# 📡 pi-cast API Documentation

Complete API reference for pi-cast platform.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [oRPC Procedures](#orpc-procedures)
- [REST Endpoints](#rest-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## 🌐 Overview

### Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://api.pi-cast.com` (example)

### API Architecture

pi-cast uses a hybrid API approach:
- **oRPC** for type-safe RPC calls (primary API)
- **REST** for specific endpoints (health, auth callbacks)
- **Better Auth** for authentication flows

### Content Types
- Request: `application/json`
- Response: `application/json`

---

## 🔐 Authentication

### Authentication Methods

pi-cast supports multiple authentication methods via **Better Auth**:

1. **Email OTP** - Magic link / verification code
2. **GitHub OAuth** - OAuth 2.0 flow

### Session Management

Sessions are managed via secure HTTP-only cookies:
- Cookie Name: `better-auth.session_token`
- Secure: Production only
- SameSite: `lax`
- Expiry: Configurable (default: 30 days)

### Authenticated Requests

All protected endpoints require a valid session token. The token is automatically included via cookies from the web client.

**oRPC Context:**
```typescript
interface AuthenticatedContext {
  session: {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'student' | 'teacher' | 'admin';
    };
    expiresAt: number;
  };
  headers: Headers;
}
```

---

## 🔌 oRPC Procedures

oRPC provides type-safe RPC calls with automatic validation.

### Base Endpoint
```
POST /api/trpc/{procedureName}
```

### Available Procedures

#### 1. `getProfile`
Get current user's profile information.

**Access:** Protected (requires authentication)

**Request:**
```typescript
{} // No parameters
```

**Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: number;
}
```

**Example:**
```typescript
import { createORPCClient } from '@orpc/client';

const client = createORPCClient({
  url: '/api/trpc',
});

const profile = await client.getProfile();
```

---

#### 2. `getVerifiedProfile`
Get verified profile with additional validation.

**Access:** Protected

**Request:**
```typescript
{} // No parameters
```

**Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  // Additional verified fields...
}
```

---

#### 3. `getAdminData`
Get admin-specific data and metrics.

**Access:** Admin only

**Request:**
```typescript
{} // No parameters
```

**Response:**
```typescript
{
  totalUsers: number;
  totalLessons: number;
  totalOrganizations: number;
  recentActivity: Activity[];
  // Additional admin metrics...
}
```

**Errors:**
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User not admin

---

#### 4. `getPublicData`
Get public platform data.

**Access:** Public

**Request:**
```typescript
{} // No parameters
```

**Response:**
```typescript
{
  featuredLessons: Lesson[];
  totalUsers: number;
  totalLessons: number;
  // Additional public data...
}
```

---

## 🌍 REST Endpoints

### Health Check

#### `GET /health`
Check API health status.

**Access:** Public

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-20T12:00:00.000Z",
  "uptime": 12345.67
}
```

**Example:**
```bash
curl http://localhost:3001/health
```

---

### Authentication Endpoints

All authentication endpoints are handled by Better Auth.

#### `POST /api/auth/*`
Email OTP, OAuth callbacks, session management.

**Examples:**
```bash
# Sign in with email
POST /api/auth/sign-in/email

# GitHub OAuth callback
GET /api/auth/callback/github

# Session management
POST /api/auth/session
```

---

## ❌ Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  path?: string;
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Examples

**Validation Error:**
```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  },
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

**Unauthorized:**
```json
{
  "status": 401,
  "code": "UNAUTHORIZED",
  "message": "Authentication required",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

---

## 🚦 Rate Limiting

### Configuration

Rate limiting is configurable via environment variables:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000      # 1 minute
RATE_LIMIT_MAX_REQUESTS=10       # 10 requests per window
```

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1679313600
```

### Exceeded Limit

When rate limit is exceeded:

```json
{
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## 📚 Examples

### TypeScript Client Setup

```typescript
import { createORPCClient } from '@orpc/client';
import type { AppRouter } from '@pi-cast/orpc-handlers';

// Create typed client
const client = createORPCClient<AppRouter>({
  url: 'http://localhost:3001/api/trpc',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get user profile
try {
  const profile = await client.getProfile();
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  }
}
```

### Fetch API Example

```typescript
// Health check
const healthResponse = await fetch('http://localhost:3001/health');
const health = await healthResponse.json();
console.log('API Status:', health.status);

// oRPC call
const profileResponse = await fetch('http://localhost:3001/api/trpc/getProfile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies
});

if (profileResponse.ok) {
  const profile = await profileResponse.json();
} else {
  const error = await profileResponse.json();
  console.error('Error:', error.message);
}
```

### cURL Examples

```bash
# Health check
curl http://localhost:3001/health

# Get profile (with cookies)
curl -b "better-auth.session_token=your_token" \
  -X POST http://localhost:3001/api/trpc/getProfile \
  -H "Content-Type: application/json"

# Get admin data (admin only)
curl -b "better-auth.session_token=admin_token" \
  -X POST http://localhost:3001/api/trpc/getAdminData \
  -H "Content-Type: application/json"
```

---

## 🔧 Environment Variables

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | No |
| `DATABASE_URL` | SQLite connection string | - | Yes |
| `BETTER_AUTH_SECRET` | Auth secret key (min 32 chars) | - | Yes |
| `BETTER_AUTH_URL` | Auth base URL | - | Yes |
| `WEB_CLIENT_URL` | Web client URL | - | Yes |
| `TRUSTED_ORIGINS` | Comma-separated trusted origins | - | Yes |

### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `10` | No |

### OAuth

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | For GitHub auth |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | For GitHub auth |

---

## 📊 Monitoring

### Request Logging

All requests are logged with:
- Timestamp
- Method and path
- Response status
- Response time
- User agent

### Metrics

Track these key metrics:
- Requests per second
- Average response time
- Error rate
- Rate limit hits
- Authentication failures

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Keep secrets secure** - Never commit `.env` files
3. **Validate all input** - oRPC uses valibot for validation
4. **Implement rate limiting** - Prevent abuse
5. **Use secure cookies** - httpOnly, secure, sameSite
6. **Regular security audits** - Check for vulnerabilities

---

## 📝 Changelog

### Version 1.0.0 (March 2026)
- Initial API release
- oRPC integration
- Better Auth implementation
- Rate limiting support
- Health check endpoint

---

**Last Updated**: March 2026
**Version**: 1.0.0
