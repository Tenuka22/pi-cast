# pi-cast

**Interactive Mathematics Learning Platform**

pi-cast is a next-generation educational platform that transforms how mathematics is taught and learned. Built for middle school students and beyond, pi-cast combines interactive block-based lesson creation with event-driven playback to create an immersive learning experience.

## 🎯 What Makes pi-cast Different

Unlike traditional video lectures or static problem sets, pi-cast offers:

- **Interactive Block System** - Teachers create lessons using draggable equation blocks (y = mx + c, etc.) that students can manipulate
- **Dynamic Visualization** - Equations automatically generate interactive charts with sliders for each variable
- **Event-Driven Playback** - Students can pause any lecture, experiment with parameters, and resume without losing context
- **Infinite Grid Canvas** - A 32x32 grid-based workspace where blocks auto-arrange and snap into place
- **Smart Audio Segmentation** - Audio is automatically split by silence and synchronized with teaching events

## 🚀 Features

### For Teachers (Creators)
- Create custom equation blocks before recording
- Design description blocks for lesson structure
- Record lessons on an infinite grid canvas
- Auto-arrangement of neighboring blocks
- Event-driven recording system

### For Students (Learners)
- Full player controls (play, pause, rewind, forward)
- Manipulate equation parameters in real-time
- Interactive sliders for variables (-∞ to +∞)
- Bookmark important moments in lessons
- Experiment without breaking the lecture flow

### Core Technology
- **Tokenizer** - Syntax-highlighted equation display
- **Chart Generator** - Automatic graph visualization for equations
- **Block Grouping** - Organize related equations together
- **Event Synchronization** - Audio and visual events perfectly aligned

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (React 19, App Router)
- **Language**: TypeScript 5.9+
- **UI Components**: shadcn/ui (base-mira style)
- **Icons**: Hugeicons
- **Styling**: Tailwind CSS 4.x
- **Theme**: next-themes (dark/light mode)
- **Auth Client**: better-auth/react with plugins

### Backend
- **API Server**: Hono (lightweight web framework)
- **RPC Layer**: oRPC (type-safe RPC)
- **Authentication**: Better Auth
- **Database ORM**: Drizzle ORM
- **Database**: SQLite (libsql)

### Infrastructure
- **Package Manager**: Bun 1.3.10+
- **Monorepo Tool**: Turborepo 2.x
- **Environment**: varlock (type-safe env validation)
- **Linting**: ESLint 9.x (workspace config)
- **Formatting**: Prettier 3.x

## 📦 Project Structure

```
pi-cast/
├── apps/
│   └── web/                          # Main Next.js application
│       ├── app/                      # App Router pages
│       │   ├── (auth)/               # Auth pages (login, magic-link)
│       │   ├── dashboard/            # Protected dashboard routes
│       │   │   ├── organizations/    # Organization management
│       │   │   ├── security/         # Security settings
│       │   │   └── settings/         # User settings
│       │   ├── layout.tsx            # Root layout
│       │   └── page.tsx              # Landing page
│       ├── components/               # Web-specific components
│       │   ├── auth/                 # Auth components (AuthGuard, UserNav)
│       │   ├── ui/                   # UI components (loading-spinner)
│       │   └── theme-provider.tsx    # Theme provider
│       ├── hooks/                    # React hooks (use-session)
│       ├── lib/                      # Utilities (auth-client, errors)
│       ├── .env.schema               # Environment schema
│       └── package.json
│
├── packages/
│   ├── db/                           # Database package
│   │   ├── src/
│   │   │   ├── auth/                 # Better Auth configuration
│   │   │   ├── auth.schema.ts        # Database schema (users, sessions, orgs)
│   │   │   └── index.ts              # Database exports
│   │   ├── drizzle/                  # Migrations
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── hono-server/                  # Hono API server
│   │   ├── src/
│   │   │   ├── app.ts                # Hono app with routes
│   │   │   ├── index.ts              # Server entry point
│   │   │   └── middleware.ts         # Logging, error handling
│   │   ├── .env.schema
│   │   └── package.json
│   │
│   ├── orpc-handlers/                # oRPC procedure handlers
│   │   ├── src/
│   │   │   ├── auth/                 # Auth utilities
│   │   │   ├── routes/               # RPC routes (protected, public)
│   │   │   ├── schemas/              # Validation schemas (valibot)
│   │   │   ├── auth-middleware.ts    # Auth session helpers
│   │   │   ├── errors.ts             # Error codes and types
│   │   │   └── index.ts              # Exports
│   │   ├── AUTH.md                   # Auth documentation
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # shadcn components
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   └── separator.tsx
│   │   │   ├── hooks/                # Shared hooks
│   │   │   ├── lib/                  # Utilities (cn)
│   │   │   └── styles/               # Global CSS
│   │   ├── components.json           # shadcn config
│   │   └── package.json
│   │
│   ├── eslint-config/                # Shared ESLint config
│   └── typescript-config/            # Shared TypeScript config
│
├── .github/workflows/                # CI/CD pipelines
├── package.json                      # Root package.json
├── tsconfig.json                     # Root TypeScript config
├── turbo.json                        # Turborepo config
├── .env.schema                       # Root env schema
├── README.md
├── LAUNCH.md
└── PRODUCT.md
```

## 🛠️ Development

### Prerequisites
- Node.js 20+
- Bun 1.3.10+

### Getting Started

```bash
# Install dependencies
bun install

# Copy environment files
cp apps/web/.env.example apps/web/.env
cp packages/hono-server/.env.example packages/hono-server/.env
cp packages/db/.env.example packages/db/.env

# Generate database schema
bun run db:generate

# Run database migrations
bun run db:push

# Run development servers (web + hono)
bun run dev
```

### Available Scripts

```bash
# Development
bun run dev              # Start all dev servers
bun run db:studio        # Open Drizzle Studio

# Build & Typecheck
bun run build            # Build all packages
bun run typecheck        # Type check all packages

# Code Quality
bun run lint             # Lint all packages
bun run format           # Format all packages
```

## 🔐 Authentication System

pi-cast uses **Better Auth** with the following features:

- **Email OTP** - Magic link / verification code authentication
- **OAuth** - GitHub sign-in support
- **Organizations** - Multi-tenant organization management
- **Admin** - Role-based admin capabilities
- **Sessions** - Multi-device session management

### User Roles
- **Student** - Default role for learners
- **Teacher/Creator** - Can create and publish lessons
- **Admin** - Full platform access

## 🎨 Block System Architecture

### Block Types
1. **Equation Blocks** - Mathematical expressions (y = mx + c)
2. **Chart Blocks** - Auto-generated graphs from equations
3. **Description Blocks** - Teacher-created text/content blocks
4. **Control Blocks** - Sliders and number inputs for variables

### Grid System
- Base unit: 32x32 pixels
- Infinite canvas with auto-scrolling
- Blocks snap to grid on drop
- Auto-width based on content
- Neighboring blocks auto-arrange

### Event System
Events captured during recording:
- Block placement/movement
- Parameter adjustments
- Audio segments (split by silence)
- Timeline bookmarks

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

pi-cast is under active development. Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the **Functional Source License (FSL-1.1-Apache-2.0)** - a source-available license that allows:

✅ **Personal Use** - Use for learning, experimentation, and personal projects
✅ **Educational Use** - Use in schools, universities, and educational settings
✅ **Contributions** - Contribute bug fixes, improvements, and features
✅ **Private Deployment** - Deploy for internal organizational use

❌ **Commercial Use** - Cannot be used for commercial purposes without explicit permission

See the [LICENSE](./LICENSE) file for full terms.

## 🗺️ Roadmap

See [PRODUCT.md](./PRODUCT.md) for detailed product roadmap and upcoming features:
- Question & Answer system
- Collaborative editing
- Live classes
- Assessments & progress tracking

## 📞 Contact

[Contact information to be added]

---

**pi-cast** - Where mathematics comes alive through interaction.
