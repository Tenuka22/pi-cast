# 📝 Code Style Guide

Coding standards and conventions for pi-cast.

---

## 📋 Table of Contents

1. [TypeScript](#typescript)
2. [React](#react)
3. [CSS & Styling](#css--styling)
4. [File Organization](#file-organization)
5. [Naming Conventions](#naming-conventions)
6. [Comments & Documentation](#comments--documentation)
7. [Git & Commits](#git--commits)

---

## TypeScript

### Strict Mode

Always use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Type Definitions

Prefer interfaces over type aliases for objects:

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Acceptable for unions
type Status = 'draft' | 'published' | 'archived';
```

### Avoid `any`

Never use `any`. Use `unknown` if type is truly unknown:

```typescript
// Bad
function process(data: any) {}

// Good
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}
```

### Explicit Return Types

Always specify return types for functions:

```typescript
// Good
function getUser(id: string): User | null {
  return users.find(u => u.id === id) ?? null;
}

// Bad
function getUser(id: string) {
  return users.find(u => u.id === id) ?? null;
}
```

### Null Handling

Use optional chaining and nullish coalescing:

```typescript
// Good
const userName = user?.name ?? 'Anonymous';
const email = user?.email ?? getDefaultEmail();

// Bad
const userName = user && user.name ? user.name : 'Anonymous';
```

---

## React

### Component Structure

Use functional components with hooks:

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ 
  label, 
  onClick, 
  variant = 'primary' 
}: ButtonProps) {
  return (
    <button className={variant} onClick={onClick}>
      {label}
    </button>
  );
}
```

### Props Destructuring

Always destructure props:

```typescript
// Good
function Component({ title, children }: ComponentProps) {}

// Bad
function Component(props: ComponentProps) {
  return <div>{props.title}</div>;
}
```

### Hook Order

Follow consistent hook order:
1. State hooks
2. Effect hooks
3. Context hooks
4. Custom hooks
5. Callbacks

```typescript
function Component() {
  // 1. State
  const [value, setValue] = useState('');
  
  // 2. Effects
  useEffect(() => {}, []);
  
  // 3. Context
  const theme = useTheme();
  
  // 4. Custom hooks
  const { data } = useQuery();
  
  // 5. Callbacks
  const handleClick = useCallback(() => {}, []);
  
  return null;
}
```

### Event Handlers

Name handlers descriptively:

```typescript
// Good
const handleSubmit = useCallback(() => {}, []);
const handleInputChange = useCallback(() => {}, []);

// Bad
const submit = useCallback(() => {}, []);
const change = useCallback(() => {}, []);
```

---

## CSS & Styling

### Tailwind CSS

Use Tailwind utility classes:

```typescript
// Good
<div className="flex items-center gap-4 p-6 bg-card rounded-lg shadow">
  Content
</div>

// Bad
<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  Content
</div>
```

### Class Ordering

Follow logical order:
1. Layout (flex, grid)
2. Spacing (margin, padding, gap)
3. Sizing (width, height)
4. Typography (font, text)
5. Visuals (bg, border, shadow)
6. Interactive (hover, focus)

```typescript
<div className="
  flex items-center
  gap-4 p-6
  w-full h-32
  text-lg font-bold
  bg-card rounded-lg shadow-md
  hover:bg-accent focus:ring-2
">
```

### shadcn/ui Components

Use shadcn/ui components consistently:

```typescript
import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';

function Component() {
  return (
    <Card>
      <Button variant="primary">Click Me</Button>
    </Card>
  );
}
```

### Responsive Design

Use responsive prefixes:

```typescript
<div className="
  w-full
  md:w-1/2
  lg:w-1/3
  p-4
  md:p-6
  lg:p-8
">
```

---

## File Organization

### Directory Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Dashboard routes
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # Base UI components
│   └── feature/           # Feature components
├── lib/                    # Utilities
├── hooks/                  # Custom hooks
└── types/                  # Type definitions
```

### File Naming

- Components: PascalCase (`UserProfile.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase (`User.types.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

### Exports

Use named exports:

```typescript
// Good
export function Button() {}
export type ButtonProps = {};

// Bad
export default function Button() {}
```

### Index Files

Use index.ts for clean imports:

```typescript
// components/button/index.ts
export { Button } from './button';
export type { ButtonProps } from './button';
```

---

## Naming Conventions

### Variables and Functions

Use camelCase:

```typescript
const userName = 'John';
function getUserById() {}
```

### Components and Types

Use PascalCase:

```typescript
function UserProfile() {}
interface UserData {}
type UserRole = 'admin' | 'user';
```

### Constants

Use UPPER_SNAKE_CASE:

```typescript
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
```

### Boolean Variables

Prefix with is, has, can, should:

```typescript
const isLoading = true;
const hasPermission = false;
const canEdit = true;
const shouldRefresh = false;
```

### Event Handlers

Prefix with handle:

```typescript
const handleClick = () => {};
const handleSubmit = () => {};
const handleInputChange = () => {};
```

---

## Comments & Documentation

### JSDoc

Use JSDoc for public APIs:

```typescript
/**
 * Fetches user data from the API.
 * @param userId - The user ID to fetch
 * @returns User data or null if not found
 * @throws {Error} If the API request fails
 */
async function fetchUser(userId: string): Promise<User | null> {
  // Implementation
}
```

### Inline Comments

Explain why, not what:

```typescript
// Good
// Retry with exponential backoff to handle rate limiting
await delay(Math.pow(2, retryCount) * 1000);

// Bad
// Wait before retrying
await delay(1000);
```

### TODO Comments

Use TODO format with context:

```typescript
// TODO(user-mgmt): Add pagination for large user lists
// TODO(perf): Optimize this O(n²) algorithm
// FIXME(auth): Handle token expiration gracefully
```

---

## Git & Commits

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### Examples

```bash
feat(auth): add GitHub OAuth integration

- Add GitHub OAuth provider
- Implement callback handler
- Add user linking logic

Closes #123
```

```bash
fix(recording): resolve audio sync issue

Audio segments were misaligned by 100ms due to
incorrect timestamp calculation.

Fixes #456
```

### Branch Naming

```
feat/feature-name
fix/bug-description
docs/documentation-update
refactor/module-refactor
test/test-coverage
```

---

## Code Review Checklist

Before submitting code:

- [ ] TypeScript strict mode passes
- [ ] No `any` types used
- [ ] Components follow conventions
- [ ] Tailwind classes ordered logically
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commit message follows format
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Accessibility considered

---

## Tools

### Required Extensions

- ESLint
- Prettier
- TypeScript

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Pre-commit Hooks

Husky runs before each commit:
- ESLint
- Prettier
- TypeScript check
- Tests

---

*Last Updated: March 2026*
*Version: 1.0.0*
