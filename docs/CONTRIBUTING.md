# 🤝 Contributing to pi-cast

Thank you for your interest in contributing to pi-cast! This guide will help you get started.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Pull Request Guidelines](#pull-request-guidelines)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in pi-cast a harassment-free experience for everyone.

### Expected Behavior

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unethical conduct

### Reporting

Report violations to conduct@pi-cast.com

---

## Getting Started

### Prerequisites

- Node.js 20+
- Bun 1.3.10+
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pi-cast.git
   cd pi-cast
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/pi-cast/pi-cast.git
   ```

### Install Dependencies

```bash
bun install
```

### Set Up Environment

```bash
# Copy environment files
cp apps/web/.env.example apps/web/.env
cp packages/hono-server/.env.example packages/hono-server/.env
cp packages/db/.env.example packages/db/.env

# Generate database schema
bun run db:generate

# Push database schema
bun run db:push
```

### Start Development

```bash
# Start all development servers
bun run dev
```

This starts:
- Next.js dev server on http://localhost:3000
- Hono API server on http://localhost:3001
- Drizzle Studio on http://localhost:5555

---

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/code-refactor` - Refactoring
- `test/test-addition` - Tests

### Making Changes

1. Create a branch:
   ```bash
   git checkout -b feat/your-feature
   ```

2. Make your changes

3. Run type checking:
   ```bash
   bun run typecheck
   ```

4. Run linting:
   ```bash
   bun run lint
   ```

5. Run tests:
   ```bash
   bun run test
   ```

6. Format code:
   ```bash
   bun run format
   ```

7. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

8. Push to your fork:
   ```bash
   git push origin feat/your-feature
   ```

---

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Type checking passes

### PR Title Format

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug description`
- `docs: update documentation`
- `refactor: improve code structure`
- `test: add test coverage`
- `chore: update dependencies`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Code follows guidelines
- [ ] Tests pass
- [ ] Type checking passes
- [ ] Documentation updated
```

### Review Process

1. Maintainer reviews code
2. Automated checks must pass
3. Address review feedback
4. Maintainer merges PR

---

## Coding Standards

### TypeScript

- Use strict mode
- Define explicit types
- Avoid `any` type
- Use interfaces for objects
- Use enums for fixed values

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Bad
const user: any = {};
```

### React Components

- Use functional components
- Use hooks for state
- Destructure props
- Use meaningful names

```typescript
// Good
function UserProfile({ user, onUpdate }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// Bad
const Component = (props) => {
  return <div>{props.user.name}</div>;
};
```

### Styling

- Use Tailwind CSS
- Use shadcn/ui components
- Follow design system
- Use CSS variables for theming

```typescript
// Good
<div className="flex items-center gap-2 p-4 bg-card rounded-lg">
  <Button variant="primary">Click Me</Button>
</div>
```

### File Organization

- One component per file
- Co-locate tests with source
- Group by feature
- Use index.ts for exports

```
components/
├── button/
│   ├── button.tsx
│   ├── button.test.tsx
│   └── index.ts
```

---

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run specific test file
bun test lib/block-system/types.test.ts
```

### Writing Tests

- Test public APIs
- Test edge cases
- Test error conditions
- Use descriptive test names

```typescript
describe('Block System', () => {
  it('should convert grid coordinates to pixels', () => {
    const result = gridToPixels({ x: 4, y: 2 });
    expect(result.x).toBe(128);
    expect(result.y).toBe(64);
  });
});
```

### Test Coverage

Aim for:
- 80%+ overall coverage
- 100% critical path coverage
- All public APIs tested

---

## Documentation

### Code Comments

- Comment why, not what
- Document complex logic
- Add JSDoc for public APIs

```typescript
/**
 * Convert grid coordinates to pixel coordinates.
 * @param position - Grid position
 * @returns Pixel position
 */
function gridToPixels(position: GridPosition): PixelPosition {
  // Implementation
}
```

### Documentation Files

Update relevant docs:
- `README.md` - Project overview
- `docs/` - User and developer guides
- `LAUNCH.md` - Feature checklists
- `PRODUCT.md` - Product specifications

### API Documentation

Document new endpoints:
- Request/response format
- Authentication requirements
- Error responses
- Example usage

---

## Areas Needing Contribution

### High Priority

- [ ] Unit tests for recording/playback
- [ ] E2E tests for user flows
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Performance optimizations

### Medium Priority

- [ ] Additional lesson types
- [ ] Advanced analytics
- [ ] Collaborative features
- [ ] Integration with LMS
- [ ] Mobile applications

### Good First Issues

Look for issues labeled:
- `good first issue`
- `help wanted`
- `documentation`

---

## Getting Help

- **Discord**: Join our community server
- **GitHub Issues**: Ask questions in issues
- **Email**: contributors@pi-cast.com

---

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor report

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

*Last Updated: March 2026*
*Version: 1.0.0*
