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
  Button: ({ children, onClick, type = 'button', variant = 'default', size = 'default' }: any) => {
    const button = document.createElement('button');
    button.type = type;
    button.setAttribute('data-variant', variant);
    button.setAttribute('data-size', size);
    if (onClick) button.onclick = onClick;
    button.textContent = typeof children === 'string' ? children : '';
    return button;
  },
}));

// Global test utilities
(Object as any).defineProperty(globalThis, 'testId', {
  value: (id: string) => document.querySelector(`[data-testid="${id}"]`),
  writable: true,
});

(Object as any).defineProperty(globalThis, 'getByTestId', {
  value: (id: string) => document.querySelector(`[data-testid="${id}"]`),
  writable: true,
});
