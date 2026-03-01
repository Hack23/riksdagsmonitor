/**
 * Tests for theme-toggle button functionality
 * Tests the logic from js/theme-toggle.js:
 *   - localStorage precedence over system preference (resolveTheme)
 *   - applyTheme sets data-theme on <html> and persists to localStorage
 *   - updateButton keeps aria-pressed/aria-label/title/icon in sync
 *   - system prefers-color-scheme change handler respects explicit preference
 *   - invalid/legacy localStorage values are cleared before system fallback
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── In-memory localStorage for tests that need real persistence ────────────────

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem:    (k)    => store.has(k) ? store.get(k) : null,
    setItem:    (k, v) => { store.set(k, v); },
    removeItem: (k)    => { store.delete(k); },
    clear:      ()     => { store.clear(); },
  };
}

// ── Constants mirroring the IIFE ───────────────────────────────────────────────

const STORAGE_KEY = 'riksdagsmonitor-theme';
const DARK  = 'dark';
const LIGHT = 'light';

// ── Logic mirroring the IIFE's internal functions ─────────────────────────────

function prefersDark(matchMedia) {
  return !!(matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
}

function resolveTheme(matchMedia, storage) {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === DARK || saved === LIGHT) return saved;
  } catch (_) { /* private browsing */ }
  return prefersDark(matchMedia) ? DARK : LIGHT;
}

function applyTheme(theme, persist, storage) {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist !== false) {
    try { storage.setItem(STORAGE_KEY, theme); } catch (_) { /* storage unavailable */ }
  }
}

function updateButton(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark   = theme === DARK;
  const icon     = btn.querySelector('.theme-icon');
  const darkLbl  = btn.getAttribute('data-label-dark')  || 'Switch to light theme';
  const lightLbl = btn.getAttribute('data-label-light') || 'Switch to dark theme';
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label',   isDark ? darkLbl : lightLbl);
  btn.setAttribute('title',        isDark ? darkLbl : lightLbl);
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

function buildButton({ labelDark = 'Switch to light theme', labelLight = 'Switch to dark theme' } = {}) {
  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.setAttribute('aria-label', labelLight);
  btn.setAttribute('title', labelLight);
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('data-label-dark',  labelDark);
  btn.setAttribute('data-label-light', labelLight);
  const icon = document.createElement('span');
  icon.className = 'theme-icon';
  icon.textContent = '🌙';
  btn.appendChild(icon);
  document.body.appendChild(btn);
  return btn;
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('Theme Toggle', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = '';
  });

  // ── resolveTheme ────────────────────────────────────────────────────────────

  describe('resolveTheme()', () => {
    it('returns stored "dark" from localStorage (overrides light system pref)', () => {
      storage.setItem(STORAGE_KEY, 'dark');
      const mq = vi.fn().mockReturnValue({ matches: false });
      expect(resolveTheme(mq, storage)).toBe('dark');
    });

    it('returns stored "light" from localStorage (overrides dark system pref)', () => {
      storage.setItem(STORAGE_KEY, 'light');
      const mq = vi.fn().mockReturnValue({ matches: true });
      expect(resolveTheme(mq, storage)).toBe('light');
    });

    it('ignores an invalid stored value and uses system preference (dark)', () => {
      storage.setItem(STORAGE_KEY, 'invalid-value');
      const mq = vi.fn().mockReturnValue({ matches: true });
      expect(resolveTheme(mq, storage)).toBe('dark');
    });

    it('ignores an invalid stored value and uses system preference (light)', () => {
      storage.setItem(STORAGE_KEY, 'legacy-garbage');
      const mq = vi.fn().mockReturnValue({ matches: false });
      expect(resolveTheme(mq, storage)).toBe('light');
    });

    it('returns "dark" from system preference when localStorage is empty', () => {
      const mq = vi.fn().mockReturnValue({ matches: true });
      expect(resolveTheme(mq, storage)).toBe('dark');
    });

    it('returns "light" from system preference when localStorage is empty', () => {
      const mq = vi.fn().mockReturnValue({ matches: false });
      expect(resolveTheme(mq, storage)).toBe('light');
    });

    it('returns "light" when matchMedia is unavailable and no stored value', () => {
      expect(resolveTheme(null, storage)).toBe('light');
    });
  });

  // ── applyTheme ──────────────────────────────────────────────────────────────

  describe('applyTheme()', () => {
    it('sets data-theme="dark" on <html>', () => {
      applyTheme('dark', false, storage);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('sets data-theme="light" on <html>', () => {
      applyTheme('light', false, storage);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('persists to localStorage when persist flag is true', () => {
      applyTheme('dark', true, storage);
      expect(storage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('does not persist to localStorage when persist flag is false', () => {
      applyTheme('dark', false, storage);
      expect(storage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('persists by default when persist is omitted', () => {
      applyTheme('light', undefined, storage);
      expect(storage.getItem(STORAGE_KEY)).toBe('light');
    });
  });

  // ── updateButton ────────────────────────────────────────────────────────────

  describe('updateButton()', () => {
    it('sets aria-pressed="true" for dark theme', () => {
      buildButton();
      updateButton('dark');
      expect(document.getElementById('theme-toggle').getAttribute('aria-pressed')).toBe('true');
    });

    it('sets aria-pressed="false" for light theme', () => {
      buildButton();
      updateButton('light');
      expect(document.getElementById('theme-toggle').getAttribute('aria-pressed')).toBe('false');
    });

    it('sets aria-label to data-label-dark value when theme is dark', () => {
      buildButton({ labelDark: 'Switch to light theme' });
      updateButton('dark');
      expect(document.getElementById('theme-toggle').getAttribute('aria-label')).toBe('Switch to light theme');
    });

    it('sets aria-label to data-label-light value when theme is light', () => {
      buildButton({ labelLight: 'Switch to dark theme' });
      updateButton('light');
      expect(document.getElementById('theme-toggle').getAttribute('aria-label')).toBe('Switch to dark theme');
    });

    it('sets title to match aria-label', () => {
      buildButton({ labelDark: 'Switch to light theme' });
      updateButton('dark');
      const btn = document.getElementById('theme-toggle');
      expect(btn.getAttribute('title')).toBe(btn.getAttribute('aria-label'));
    });

    it('sets icon to ☀️ for dark theme', () => {
      buildButton();
      updateButton('dark');
      expect(document.querySelector('.theme-icon').textContent).toBe('☀️');
    });

    it('sets icon to 🌙 for light theme', () => {
      buildButton();
      updateButton('light');
      expect(document.querySelector('.theme-icon').textContent).toBe('🌙');
    });

    it('does nothing gracefully when button is absent', () => {
      expect(() => updateButton('dark')).not.toThrow();
    });

    it('falls back to default label strings when data-label-* attrs are absent', () => {
      const btn = document.createElement('button');
      btn.id = 'theme-toggle';
      const icon = document.createElement('span');
      icon.className = 'theme-icon';
      btn.appendChild(icon);
      document.body.appendChild(btn);

      updateButton('dark');
      expect(btn.getAttribute('aria-label')).toBe('Switch to light theme');
      updateButton('light');
      expect(btn.getAttribute('aria-label')).toBe('Switch to dark theme');
    });
  });

  // ── toggle (via applyTheme + updateButton) ──────────────────────────────────

  describe('toggle logic', () => {
    function toggle(stor) {
      const current = document.documentElement.getAttribute('data-theme') || LIGHT;
      const next    = current === DARK ? LIGHT : DARK;
      applyTheme(next, undefined, stor);
      updateButton(next);
    }

    it('switches from dark to light', () => {
      buildButton();
      applyTheme('dark', false, storage);
      toggle(storage);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('switches from light to dark', () => {
      buildButton();
      applyTheme('light', false, storage);
      toggle(storage);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('persists the new theme to localStorage', () => {
      buildButton();
      applyTheme('light', false, storage);
      toggle(storage);
      expect(storage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('updates button aria-pressed after toggle', () => {
      const btn = buildButton();
      applyTheme('light', false, storage);
      toggle(storage);
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });

    it('treats absent data-theme as "light" and switches to dark', () => {
      buildButton();
      document.documentElement.removeAttribute('data-theme');
      toggle(storage);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  // ── system theme-change handler ─────────────────────────────────────────────

  describe('system prefers-color-scheme change handler logic', () => {
    it('does not apply new theme when valid "dark" is stored (explicit choice wins)', () => {
      storage.setItem(STORAGE_KEY, 'dark');
      applyTheme('dark', false, storage);
      buildButton();

      // Simulate the handler
      const storedTheme = storage.getItem(STORAGE_KEY);
      let handledByStorage = false;
      if (storedTheme === DARK || storedTheme === LIGHT) {
        handledByStorage = true; // explicit valid choice wins — return early
      }
      expect(handledByStorage).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('does not apply new theme when valid "light" is stored', () => {
      storage.setItem(STORAGE_KEY, 'light');
      buildButton();

      const storedTheme = storage.getItem(STORAGE_KEY);
      let handledByStorage = false;
      if (storedTheme === DARK || storedTheme === LIGHT) {
        handledByStorage = true;
      }
      expect(handledByStorage).toBe(true);
    });

    it('clears invalid stored value and follows system preference', () => {
      storage.setItem(STORAGE_KEY, 'legacy-garbage');
      buildButton();

      // Simulate the handler
      const storedTheme = storage.getItem(STORAGE_KEY);
      if (storedTheme !== DARK && storedTheme !== LIGHT) {
        if (storedTheme !== null) {
          storage.removeItem(STORAGE_KEY);
        }
        const sysTheme = DARK; // simulated e.matches = true
        applyTheme(sysTheme, false, storage);
        updateButton(sysTheme);
      }

      expect(storage.getItem(STORAGE_KEY)).toBeNull();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('follows system preference when localStorage is empty', () => {
      buildButton();

      const storedTheme = storage.getItem(STORAGE_KEY); // null
      if (storedTheme !== DARK && storedTheme !== LIGHT) {
        if (storedTheme !== null) {
          storage.removeItem(STORAGE_KEY);
        }
        const sysTheme = LIGHT; // simulated e.matches = false
        applyTheme(sysTheme, false, storage);
        updateButton(sysTheme);
      }

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.getElementById('theme-toggle').getAttribute('aria-pressed')).toBe('false');
    });
  });

  // ── anti-flash snippet localStorage validation ──────────────────────────────

  describe('anti-flash snippet localStorage validation logic', () => {
    it('uses stored "dark" without clearing or overriding', () => {
      storage.setItem(STORAGE_KEY, 'dark');
      // Mirrors the anti-flash IIFE: read then validate/normalize
      let t = (() => { try { return storage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
      if (t !== 'dark' && t !== 'light') {
        if (t !== null) { try { storage.removeItem(STORAGE_KEY); } catch (_) { /* storage unavailable */ } }
        t = 'light';
      }
      expect(t).toBe('dark');
      expect(storage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('uses stored "light" without clearing', () => {
      storage.setItem(STORAGE_KEY, 'light');
      let t = (() => { try { return storage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
      if (t !== 'dark' && t !== 'light') {
        if (t !== null) { try { storage.removeItem(STORAGE_KEY); } catch (_) { /* storage unavailable */ } }
        t = 'light';
      }
      expect(t).toBe('light');
      expect(storage.getItem(STORAGE_KEY)).toBe('light');
    });

    it('clears invalid stored value and falls back', () => {
      storage.setItem(STORAGE_KEY, 'invalid');
      let t = (() => { try { return storage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
      if (t !== 'dark' && t !== 'light') {
        if (t !== null) { try { storage.removeItem(STORAGE_KEY); } catch (_) { /* storage unavailable */ } }
        t = 'light'; // fallback
      }
      expect(t).toBe('light');
      expect(storage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('falls back to "light" when localStorage throws', () => {
      const throwingStorage = {
        getItem: () => { throw new Error('storage unavailable'); },
        setItem: () => { throw new Error('storage unavailable'); },
        removeItem: () => { throw new Error('storage unavailable'); },
      };
      let t = (() => { try { return throwingStorage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
      if (t !== 'dark' && t !== 'light') {
        if (t !== null) { try { throwingStorage.removeItem(STORAGE_KEY); } catch (_) { /* storage unavailable */ } }
        t = 'light';
      }
      expect(t).toBe('light');
    });
  });
});
