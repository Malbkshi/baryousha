"use client";

import { useSyncExternalStore } from "react";

export type LocalStore<T> = {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
  getServer(): T;
};

/**
 * A value kept in localStorage and shared by every component that reads it.
 * Unreadable or wrongly shaped data is treated as absent, and a browser that
 * refuses storage (private mode, blocked site data) just keeps it in memory.
 */
export function createLocalStore<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): LocalStore<T> {
  let cached = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return;
    cached = read();
    listeners.forEach((listener) => listener());
  };

  return {
    get() {
      if (!loaded) {
        cached = read();
        loaded = true;
      }
      return cached;
    },
    set(value) {
      cached = value;
      loaded = true;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage unavailable: the value still lives for this page view.
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
    getServer: () => fallback,
  };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}
