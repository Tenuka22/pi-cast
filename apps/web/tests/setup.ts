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
  Button: ({ children, onClick, type = 'button', variant = 'default', size = 'default' }: {
    children?: React.ReactNode;
    onClick?: () => void;
    type?: string;
    variant?: string;
    size?: string;
  }) => {
    const button = document.createElement('button');
    if (type) {
      const validTypes = ['button', 'submit', 'reset'] as const;
      const typeValue = validTypes.find(t => t === type)
      if (typeValue) {
        button.type = typeValue
      }
    }
    button.setAttribute('data-variant', variant);
    button.setAttribute('data-size', size);
    if (onClick) button.onclick = onClick;
    button.textContent = typeof children === 'string' ? children : '';
    return button;
  },
}));

// Global test utilities
interface TestIdFunction {
  (id: string): Element | null;
}

// Declare global types first
declare global {
  var testId: TestIdFunction;
  var getByTestId: TestIdFunction;
}

// Define the functions
const testIdFunction: TestIdFunction = (id: string) => {
  return document.querySelector(`[data-testid="${id}"]`);
};

const getByTestIdFunction: TestIdFunction = (id: string) => {
  return document.querySelector(`[data-testid="${id}"]`);
};

// Assign to globalThis
Object.defineProperty(globalThis, 'testId', {
  value: testIdFunction,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'getByTestId', {
  value: getByTestIdFunction,
  writable: true,
  configurable: true,
});
