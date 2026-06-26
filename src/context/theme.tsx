import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ── Color presets ──────────────────────────────
interface ColorPreset {
  name: string;
  label: string;
  primary: string;
  accent: string;
  error: string;
}

const PRESETS: ColorPreset[] = [
  { name: 'blue',   label: 'Google Blue',   primary: '#1A73E8', accent: '#1E8E3E', error: '#D93025' },
  { name: 'teal',   label: 'Teal',          primary: '#00897B', accent: '#00ACC1', error: '#E53935' },
  { name: 'purple', label: 'Purple',        primary: '#7C4DFF', accent: '#448AFF', error: '#FF5252' },
  { name: 'green',  label: 'Forest',        primary: '#2E7D32', accent: '#0277BD', error: '#C62828' },
  { name: 'orange', label: 'Sunset',        primary: '#E65100', accent: '#AD1457', error: '#B71C1C' },
  { name: 'indigo', label: 'Indigo',        primary: '#3949AB', accent: '#00897B', error: '#D32F2F' },
];

// ── Helpers ───────────────────────────────────
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function derivePrimaryColors(primary: string) {
  const { h, s, l } = hexToHSL(primary);
  return {
    '--color-primary': primary,
    '--color-primary-hover': hslToHex(h, s, Math.max(l - 12, 10)),
    '--color-primary-light': `hsla(${h}, ${s}%, ${l}%, 0.08)`,
    '--color-primary-container': hslToHex(h, Math.min(s + 10, 100), Math.min(l + 40, 92)),
    '--color-primary-glow': `hsla(${h}, ${s}%, ${l}%, 0.2)`,
    '--bg-sidebar-active': hslToHex(h, Math.min(s + 10, 100), Math.min(l + 40, 92)),
    '--text-sidebar-active': primary,
    '--border-focus': `hsla(${h}, ${s}%, ${l}%, 0.4)`,
  };
}

function deriveAccentColors(accent: string) {
  const { h, s, l } = hexToHSL(accent);
  return {
    '--color-success': accent,
    '--color-success-light': hslToHex(h, Math.min(s + 10, 100), Math.min(l + 40, 92)),
  };
}

function deriveErrorColors(error: string) {
  const { h, s, l } = hexToHSL(error);
  return {
    '--color-error': error,
    '--color-error-light': hslToHex(h, Math.min(s + 10, 100), Math.min(l + 40, 92)),
  };
}

// ── Types ──────────────────────────────────────
interface ThemeColors {
  primary: string;
  accent: string;
  error: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  activePreset: string | null;
  presets: ColorPreset[];
  applyPreset: (name: string) => void;
  setColor: (which: 'primary' | 'accent' | 'error', value: string) => void;
  resetColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ── Provider ──────────────────────────────────
const THEME_KEY = 'btge-theme-colors';
const DEFAULT_COLORS: ThemeColors = { primary: '#1A73E8', accent: '#1E8E3E', error: '#D93025' };

function applyToDOM(colors: ThemeColors) {
  const root = document.documentElement;
  const vars = {
    ...derivePrimaryColors(colors.primary),
    ...deriveAccentColors(colors.accent),
    ...deriveErrorColors(colors.error),
  };
  Object.entries(vars).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_COLORS;
    } catch {
      return DEFAULT_COLORS;
    }
  });

  const [activePreset, setActivePreset] = useState<string | null>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (!saved) return 'blue';
    try {
      const c = JSON.parse(saved) as ThemeColors;
      const match = PRESETS.find(p => p.primary === c.primary && p.accent === c.accent && p.error === c.error);
      return match?.name ?? null;
    } catch {
      return 'blue';
    }
  });

  // Apply on mount and whenever colors change
  useEffect(() => {
    applyToDOM(colors);
    localStorage.setItem(THEME_KEY, JSON.stringify(colors));
  }, [colors]);

  const applyPreset = useCallback((name: string) => {
    const preset = PRESETS.find(p => p.name === name);
    if (!preset) return;
    setColors({ primary: preset.primary, accent: preset.accent, error: preset.error });
    setActivePreset(name);
  }, []);

  const setColor = useCallback((which: 'primary' | 'accent' | 'error', value: string) => {
    setColors(prev => {
      const next = { ...prev, [which]: value };
      return next;
    });
    setActivePreset(null);
  }, []);

  const resetColors = useCallback(() => {
    setColors(DEFAULT_COLORS);
    setActivePreset('blue');
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, activePreset, presets: PRESETS, applyPreset, setColor, resetColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
