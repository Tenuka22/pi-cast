# 🏗️ Architecture Overview

System architecture and design documentation for pi-cast.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)

---

## System Overview

pi-cast is a monorepo-based web application built with modern TypeScript technologies. The platform consists of:

- **Web Application**: Next.js frontend for user interaction
- **API Server**: Hono backend for API endpoints
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Better Auth with multiple providers

### Key Design Principles

1. **Type Safety**: End-to-end TypeScript with oRPC
2. **Modularity**: Package-based monorepo structure
3. **Performance**: Event-driven architecture for recording/playback
4. **Scalability**: Stateless design for horizontal scaling
5. **Security**: Defense in depth with multiple layers

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Students  │  │  Teachers   │  │      Administrators     │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────────┐
│                    Load Balancer / CDN                           │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     Application Layer                            │
│  ┌───────────────────────┴────────────────────────────────┐     │
│  │                   Next.js Web App                       │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │     │
│  │  │   Pages     │  │ Components  │  │     Hooks       │ │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │     │
│  └──────────────────────────────────────────────────────────┘     │
│                              │                                     │
│  ┌───────────────────────────┴────────────────────────────────┐   │
│  │                   Hono API Server                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │   │
│  │  │  oRPC       │  │  REST       │  │   Middleware    │    │   │
│  │  │  Handlers   │  │  Endpoints  │  │   (Auth, CORS)  │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                     Data Layer                                    │
│  ┌───────────────────────┴──────────────────────────────────┐    │
│  │                   Drizzle ORM                             │    │
│  └───────────────────────────────────────────────────────────┘    │
│                              │                                     │
│  ┌───────────────────────────┴────────────────────────────────┐   │
│  │                    SQLite Database                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │  Users   │ │ Lessons  │ │ Orgs     │ │  Analytics   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework | 16.1.6 |
| React | UI library | 19.x |
| TypeScript | Type safety | 5.9+ |
| Tailwind CSS | Styling | 4.x |
| shadcn/ui | Component library | base-mira |
| next-themes | Dark/light mode | 0.4.x |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Hono | Web framework | 4.x |
| oRPC | Type-safe RPC | 1.7.x |
| Better Auth | Authentication | 1.5.x |
| Drizzle ORM | Database ORM | 0.45.x |
| valibot | Schema validation | 1.x |

### Infrastructure

| Technology | Purpose | Version |
|------------|---------|---------|
| Bun | Runtime & package manager | 1.3.10+ |
| Turborepo | Monorepo tooling | 2.x |
| SQLite | Database | libsql |
| GitHub Actions | CI/CD | - |

---

## Component Architecture

### Monorepo Structure

```
pi-cast/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages
│       ├── components/         # React components
│       ├── lib/                # Utilities & hooks
│       └── hooks/              # Custom React hooks
│
├── packages/
│   ├── db/                     # Database package
│   │   ├── src/
│   │   │   ├── auth/           # Better Auth config
│   │   │   └── auth.schema.ts  # Database schema
│   │   └── drizzle/            # Migrations
│   │
│   ├── hono-server/            # API server
│   │   ├── src/
│   │   │   ├── app.ts          # Hono app
│   │   │   └── middleware.ts   # Middleware
│   │   └── tests/              # API tests
│   │
│   ├── orpc-handlers/          # oRPC procedures
│   │   ├── src/
│   │   │   ├── routes/         # RPC routes
│   │   │   └── schemas/        # Validation schemas
│   │   └── AUTH.md             # Auth documentation
│   │
│   └── ui/                     # Shared UI components
│       └── src/
│           ├── components/     # shadcn components
│           └── lib/            # Utilities
│
└── docs/                       # Documentation
```

### Key Packages

#### `@pi-cast/db`
- Database schema definitions
- Drizzle ORM configuration
- Better Auth integration
- Database connection utilities

#### `@pi-cast/hono-server`
- Hono application setup
- Middleware (logging, error handling, CORS)
- REST endpoints
- oRPC handler integration

#### `@pi-cast/orpc-handlers`
- oRPC procedure definitions
- Input validation schemas
- Authentication middleware
- Business logic

#### `@workspace/ui`
- Shared UI components
- shadcn/ui base
- Theme support
- Utility functions

---

## Data Flow

### Recording Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teacher   │────▶│  Browser    │────▶│  Audio      │
│   Actions   │     │  Events     │     │  Recorder   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Event     │     │   Audio     │
                    │   Queue     │     │  Segments   │
                    └─────────────┘     └─────────────┘
                           │                   │
                           └────────┬──────────┘
                                    │
                                    ▼
                           ┌─────────────┐
                           │   Sync &    │
                           │  Serialize  │
                           └─────────────┘
                                    │
                                    ▼
                           ┌─────────────┐
                           │  Database   │
                           │  Storage    │
                           └─────────────┘
```

### Playback Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │────▶│  Player     │────▶│   Event     │
│   Request   │     │  Controls   │     │  Replayer   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Audio     │     │   Block     │
                    │  Playback   │     │  Renderer   │
                    └─────────────┘     └─────────────┘
                           │                   │
                           └────────┬──────────┘
                                    │
                                    ▼
                           ┌─────────────┐
                           │   Sync &    │
                           │   Render    │
                           └─────────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│  Better     │────▶│   Session   │
│   Request   │     │   Auth      │     │   Store     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   OAuth     │
                    │  Providers  │
                    │ (GitHub,    │
                    │   Email)    │
                    └─────────────┘
```

### Security Layers

1. **Transport Layer**
   - HTTPS/TLS 1.3 for all connections
   - HSTS headers

2. **Application Layer**
   - CSRF protection (Better Auth)
   - CORS configuration
   - Input validation (valibot)
   - Rate limiting

3. **Data Layer**
   - Parameterized queries (Drizzle)
   - Input sanitization
   - Access control

4. **Session Layer**
   - Secure HTTP-only cookies
   - Session expiration
   - Multi-device support

---

## Deployment Architecture

### Development

```
┌─────────────────────────────────────────┐
│          Local Development              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Next.js │  │  Hono   │  │ Drizzle │ │
│  │  :3000  │  │  :3001  │  │  :5555  │ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘
```

### Production

```
┌─────────────────────────────────────────────────────────┐
│                    Production Environment                │
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Vercel    │    │   Docker    │    │   Traditional│  │
│  │   (Web)     │    │   (API)     │    │   (PM2)     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                   ┌────────┴────────┐                   │
│                   │   SQLite DB     │                   │
│                   │   (libsql)      │                   │
│                   └─────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Push     │────▶│    Build    │────▶│    Test     │
│   to Git    │     │   & Type    │     │   Suite     │
└─────────────┘     └─────────────┘     └─────────────┘
                                                 │
                                                 ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Deploy    │◀────│   Review    │◀────│   Lint      │
│   to Prod   │     │   & Merge   │     │   Check     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Route-based splitting with Next.js
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js Image component
- **Caching**: React Query for data caching

### Backend Optimization

- **Connection Pooling**: SQLite connection management
- **Query Optimization**: Indexed queries with Drizzle
- **Response Caching**: Redis for frequently accessed data (future)
- **Compression**: Gzip/Brotli for responses

### Recording/Playback

- **Event-driven**: Efficient storage vs video
- **Audio Segmentation**: Silence removal reduces storage
- **Lazy Loading**: Blocks loaded as needed
- **Canvas Optimization**: Hardware-accelerated rendering

---

## Monitoring & Observability

### Logging

- Request/response logging (Hono middleware)
- Error logging with stack traces
- Performance metrics

### Metrics (Future)

- API response times
- Database query performance
- Frontend load times
- User engagement metrics

### Alerting (Future)

- Error rate thresholds
- Performance degradation
- Service availability
- Database health

---

*Last Updated: March 2026*
*Version: 1.0.0*
