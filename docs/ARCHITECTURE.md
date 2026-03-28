# pi-cast Architecture

## Overview

pi-cast is a monorepo-based web application built with modern TypeScript technologies. The platform consists of:

- **Web Application**: Next.js frontend for user interaction
- **API Server**: Hono backend for API endpoints
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Better Auth with multiple providers

See [README.md](../README.md) for project overview and [NODE_CALCULATION_SYSTEM.md](../NODE_CALCULATION_SYSTEM.md) for the block calculation architecture.

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
| Better Auth | Authentication | latest |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Hono | API server | 4.x |
| oRPC | RPC framework | latest |
| Drizzle ORM | Database ORM | latest |
| SQLite (libsql) | Database | latest |
| Better Auth | Authentication server | latest |

### Infrastructure

| Technology | Purpose | Version |
|------------|---------|---------|
| Bun | Package manager & runtime | 1.3.10+ |
| Turborepo | Monorepo tool | 2.x |
| varlock | Environment validation | latest |
| ESLint | Linting | 9.x |
| Prettier | Formatting | 3.x |

## Project Structure

```
pi-cast/
├── apps/
│   └── web/                          # Main Next.js application
│       ├── app/                      # App Router pages
│       ├── components/               # React components
│       │   ├── blocks/               # Block system components
│       │   ├── block-system/         # Node-based calculation UI
│       │   ├── recording/            # Recording system components
│       │   └── playback/             # Playback components
│       ├── lib/                      # Utilities
│       │   ├── block-system/         # Calculation engine
│       │   └── recording-system/     # Recording/playback logic
│       └── hooks/                    # React hooks
│
├── packages/
│   ├── db/                           # Database package
│   ├── hono-server/                  # Hono API server
│   ├── orpc-handlers/                # oRPC handlers
│   ├── ui/                           # Shared UI components
│   ├── eslint-config/                # Shared ESLint config
│   └── typescript-config/            # Shared TypeScript config
│
├── docs/                             # Documentation
├── NODE_CALCULATION_SYSTEM.md        # Calculation architecture
├── NODE_TREE_ARCHITECTURE.md         # Node tree design
├── PRODUCT.md                        # Product specification
└── README.md                         # Project overview
```

## System Architecture

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

## Block System Architecture

The block system uses a **node-based calculation architecture**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Variable   │ ──→ │  Equation   │ ──→ │ Constraint  │ ──→ │    Chart    │
│  (m slider) │     │  y = mx + c │     │   (x > 0)   │     │  (renders)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

Key features:
- **Per-Equation Constraints**: Each equation has independent constraints
- **Memoization**: Cached results prevent unnecessary recalculations
- **Topological Sort**: Correct calculation order
- **< 5ms Latency**: Fast recalculation for variable changes

See [NODE_CALCULATION_SYSTEM.md](./NODE_CALCULATION_SYSTEM.md) for detailed documentation.

## Recording System Architecture

Event-driven recording system:

1. **Audio Recording**: Web Audio API with silence detection
2. **Event Capture**: Discrete teaching actions with timestamps
3. **Synchronization**: Events aligned with audio segments
4. **Playback**: Event replay synchronized with audio

See [RECORDING.md](./RECORDING.md) for detailed documentation.

## Security

- **Authentication**: Better Auth with Email OTP and GitHub OAuth
- **Session Management**: Secure cookies with httpOnly
- **CSRF Protection**: Built-in via Better Auth
- **Input Validation**: valibot schemas
- **Type Safety**: oRPC for type-safe API calls

## Deployment

Deployment documentation is being updated. For now, see:
- [LAUNCH.md](./LAUNCH.md) - Launch checklist
- [GETTING_STARTED_STUDENTS.md](./GETTING_STARTED_STUDENTS.md) - Setup guide

## Documentation Index

- [README.md](../README.md) - Project overview
- [PRODUCT.md](../PRODUCT.md) - Product specification
- [NODE_CALCULATION_SYSTEM.md](../NODE_CALCULATION_SYSTEM.md) - Calculation architecture
- [NODE_TREE_ARCHITECTURE.md](../NODE_TREE_ARCHITECTURE.md) - Node tree design
- [RECORDING.md](./RECORDING.md) - Recording system
- [LAUNCH.md](../LAUNCH.md) - Launch checklist
- [GETTING_STARTED_STUDENTS.md](./GETTING_STARTED_STUDENTS.md) - Student setup
- [GETTING_STARTED_TEACHERS.md](./GETTING_STARTED_TEACHERS.md) - Teacher setup
- [FAQ.md](./FAQ.md) - Frequently asked questions
