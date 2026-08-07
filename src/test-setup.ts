// Global test setup for jsdom environment
// Polyfills and mocks needed across all tests go here.
import '@testing-library/jest-dom';

// Mock sessionStorage for RBAC tests
Object.defineProperty(window, 'sessionStorage', {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })(),
  writable: true,
});

// Mock localStorage for firebase.ts auth helpers
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })(),
  writable: true,
});
