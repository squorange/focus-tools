/**
 * Vitest Setup File
 *
 * This file runs before each test file.
 * Sets up global mocks and test utilities.
 */

import { beforeAll, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock IndexedDB using fake-indexeddb
import 'fake-indexeddb/auto';

// Reset IndexedDB between tests
import { IDBFactory } from 'fake-indexeddb';

beforeAll(() => {
  // Ensure IndexedDB is available globally
  if (typeof indexedDB === 'undefined') {
    global.indexedDB = new IDBFactory();
  }
});

afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks();

  // Reset IndexedDB by creating a new factory
  // This ensures tests don't leak state
  global.indexedDB = new IDBFactory();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.matchMedia (used by some UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestIdleCallback (not available in jsdom)
global.requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, 1) as unknown as number;
});

global.cancelIdleCallback = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock crypto.randomUUID (for generating IDs)
if (!global.crypto) {
  global.crypto = {} as Crypto;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}
