# Auth Middleware for oRPC

This package provides authentication utilities for oRPC procedures using Better Auth.

## Usage

### 1. Create Auth Session Helper

```typescript
import { auth } from "@pi-cast/db"
import { createGetAuthSession, createGetOptionalAuthSession } from "@pi-cast/orpc-handlers"

// Required authentication
const getAuthSession = createGetAuthSession(auth)

// Optional authentication (returns null if not authenticated)
const getOptionalAuthSession = createGetOptionalAuthSession(auth)
```

### 2. Use in oRPC Procedures

```typescript
import { base } from "@pi-cast/orpc-handlers"

// Protected procedure - requires authentication
export const getProfile = base
  .route({ method: "GET", path: "/profile" })
  .handler(async ({ context }) => {
    const session = await getAuthSession(context.headers)
    return {
      user: session.user,
      session: session.session,
    }
  })

// Optional auth procedure
export const getPublicData = base
  .route({ method: "GET", path: "/public" })
  .handler(async ({ context }) => {
    const session = await getOptionalAuthSession(context.headers)
    return {
      isAuthenticated: !!session,
      user: session?.user ?? null,
    }
  })
```

### 3. Advanced Options

```typescript
// Require email verification
const getAuthSessionWithVerifiedEmail = createGetAuthSession(auth, {
  requireEmailVerified: true,
})

// Require specific roles
const getAuthSessionWithAdminRole = createGetAuthSession(auth, {
  requiredRoles: ["admin"],
})

// Custom error code
const getAuthSessionCustomError = createGetAuthSession(auth, {
  unauthorizedErrorCode: "INVALID_TOKEN",
})
```

### 4. Server Setup (Hono)

```typescript
import { Hono } from "hono"
import { RPCHandler } from "@orpc/server/fetch"
import { getProfile, getPublicData } from "./routes"

const app = new Hono()

// Create oRPC handler
const rpcHandler = new RPCHandler({
  getProfile,
  getPublicData,
})

// Mount oRPC routes with headers in context
app.use("/api/trpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/api/trpc",
    context: {
      headers: c.req.raw.headers,
    },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }
})
```

### 5. Client Usage

```typescript
// The client should send the session token via Authorization header
const response = await fetch("http://localhost:3001/api/trpc/getProfile", {
  headers: {
    // Better Auth session cookie will be sent automatically if credentials: 'include'
    // Or send token manually:
    "Authorization": "Bearer <session-token>"
  },
  credentials: "include", // Important for cookies
})
```

## API Reference

### `createGetAuthSession(auth, options?)`

Creates a function that fetches and validates the user session.

**Options:**
- `requireEmailVerified?: boolean` - Require email verification (default: false)
- `requiredRoles?: string[]` - Required roles (user must have at least one)
- `unauthorizedErrorCode?: ErrorCode` - Custom error code (default: "UNAUTHORIZED")

**Returns:** `async (headers: Headers) => Promise<AuthSession>`

**Throws:** `ORPCError` if authentication fails

### `createGetOptionalAuthSession(auth)`

Creates a function that fetches the user session if available, returns `null` otherwise.

**Returns:** `async (headers: Headers) => Promise<AuthSession | null>`

### `AuthSession` Interface

```typescript
interface AuthSession {
  session: {
    id: string
    userId: string
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    ipAddress?: string | null
    userAgent?: string | null
    activeOrganizationId?: string | null
    impersonatedBy?: string | null
  }
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    role?: string | null
    banned?: boolean | null
    banReason?: string | null
    banExpires?: Date | null
  }
}
```
