/**
 * Test Setup File
 * 
 * Configures testing environment with necessary globals and matchers.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  }),
}));

// Mock @workspace/ui components if needed
vi.mock('@workspace/ui/components/button', () => ({
  Button: ({ children, onClick, type = 'button', variant = 'default', size = 'default' }: any) => (
    <button type={type} onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

// Global test utilities
global.testId = (id: string) => document.querySelector(`[data-testid="${id}"]`);
global.getByTestId = (id: string) => document.querySelector(`[data-testid="${id}"]`);
