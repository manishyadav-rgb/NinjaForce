/**
 * SHARED THEME DEFINITIONS
 * Used by both AdminPanel (theme editor) and QuirkyHome (theme provider).
 * Each preset contains ALL CSS variable values.
 */

export interface ThemeTokens {
  /* Brand */
  "--color-brand-primary": string;
  "--color-brand-secondary": string;
  "--color-brand-accent": string;
  "--color-brand-ink": string;
  /* Backgrounds */
  "--color-bg-main": string;
  "--color-bg-soft": string;
  "--color-bg-muted": string;
  "--color-bg-elevated": string;
  "--color-bg-inverse": string;
  /* Text */
  "--color-text-main": string;
  "--color-text-muted": string;
  "--color-text-soft": string;
  "--color-text-inverse": string;
  /* Borders & Accents */
  "--color-border": string;
  "--color-border-strong": string;
  "--color-sale": string;
  "--color-discount": string;
  "--color-rating": string;
  "--color-focus": string;
  /* Typography */
  "--font-primary": string;
  "--font-display": string;
  /* Border Radius */
  "--radius-sm": string;
  "--radius-md": string;
  "--radius-lg": string;
  "--radius-xl": string;
  "--radius-2xl": string;
  [key: string]: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  tokens: ThemeTokens;
}

export interface ThemeConfig {
  activePreset: string;
  customOverrides: Partial<ThemeTokens>;
}

export const FONT_OPTIONS = [
  { label: "System Default", value: "Arial, Helvetica, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "vibrant-sunshine",
    name: "Vibrant Sunshine",
    description: "Rich amber-gold paired with sleek charcoal. Bright, premium, and energetic.",
    icon: "Sparkles",
    tokens: {
      "--color-brand-primary": "#432F83",
      "--color-brand-secondary": "#5A31DD",
      "--color-brand-accent": "#FF9900",
      "--color-brand-ink": "#231F20",
      "--color-bg-main": "#FFFFFF",
      "--color-bg-soft": "#F7F5FD",
      "--color-bg-muted": "#F9FAFC",
      "--color-bg-elevated": "#FFFFFF",
      "--color-bg-inverse": "#231F20",
      "--color-text-main": "#231F20",
      "--color-text-muted": "#575757",
      "--color-text-soft": "#7D7E7F",
      "--color-text-inverse": "#FFFFFF",
      "--color-border": "#E6E7E8",
      "--color-border-strong": "#432F83",
      "--color-sale": "#DC2626",
      "--color-discount": "#129C80",
      "--color-rating": "#FBBF24",
      "--color-focus": "#432F83",
      "--font-primary": "Arial, Helvetica, sans-serif",
      "--font-display": "Arial, Helvetica, sans-serif",
      "--radius-sm": "0.35rem",
      "--radius-md": "0.5rem",
      "--radius-lg": "0.5rem",
      "--radius-xl": "0.5rem",
      "--radius-2xl": "0.75rem"
    }
  },
  {
    id: "ecommerce-pro",
    name: "E-Commerce Pro",
    description: "Trustworthy blue, crisp white, high contrast. Great for retail/electronics.",
    icon: "Store",
    tokens: {
      "--color-brand-primary": "#2563EB",
      "--color-brand-secondary": "#1D4ED8",
      "--color-brand-accent": "#F97316",
      "--color-brand-ink": "#0F172A",
      "--color-bg-main": "#FFFFFF",
      "--color-bg-soft": "#F8FAFC",
      "--color-bg-muted": "#F1F5F9",
      "--color-bg-elevated": "#FFFFFF",
      "--color-bg-inverse": "#0F172A",
      "--color-text-main": "#0F172A",
      "--color-text-muted": "#475569",
      "--color-text-soft": "#94A3B8",
      "--color-text-inverse": "#FFFFFF",
      "--color-border": "#E2E8F0",
      "--color-border-strong": "#2563EB",
      "--color-sale": "#EF4444",
      "--color-discount": "#10B981",
      "--color-rating": "#F59E0B",
      "--color-focus": "#3B82F6",
      "--font-primary": "Arial, Helvetica, sans-serif",
      "--font-display": "Arial, Helvetica, sans-serif",
      "--radius-sm": "0.25rem",
      "--radius-md": "0.375rem",
      "--radius-lg": "0.5rem",
      "--radius-xl": "0.75rem",
      "--radius-2xl": "1rem"
    }
  },
  {
    id: "beauty-blush",
    name: "Beauty Blush",
    description: "Soft pinks and rose tones. Ideal for cosmetics and lifestyle.",
    icon: "Heart",
    tokens: {
      "--color-brand-primary": "#F472B6",
      "--color-brand-secondary": "#DB2777",
      "--color-brand-accent": "#EAB308",
      "--color-brand-ink": "#3F3F46",
      "--color-bg-main": "#FFFAFA",
      "--color-bg-soft": "#FFF1F2",
      "--color-bg-muted": "#FFE4E6",
      "--color-bg-elevated": "#FFFFFF",
      "--color-bg-inverse": "#3F3F46",
      "--color-text-main": "#27272A",
      "--color-text-muted": "#52525B",
      "--color-text-soft": "#A1A1AA",
      "--color-text-inverse": "#FFFFFF",
      "--color-border": "#E4E4E7",
      "--color-border-strong": "#F472B6",
      "--color-sale": "#E11D48",
      "--color-discount": "#0D9488",
      "--color-rating": "#FBBF24",
      "--color-focus": "#F472B6",
      "--font-primary": "Arial, Helvetica, sans-serif",
      "--font-display": "Arial, Helvetica, sans-serif",
      "--radius-sm": "0.5rem",
      "--radius-md": "1rem",
      "--radius-lg": "1.5rem",
      "--radius-xl": "2rem",
      "--radius-2xl": "9999px"
    }
  },
  {
    id: "luxury-noir",
    name: "Luxury Noir",
    description: "Deep black background with elegant gold accents. Premium dark mode.",
    icon: "Gem",
    tokens: {
      "--color-brand-primary": "#D4AF37",
      "--color-brand-secondary": "#B5952F",
      "--color-brand-accent": "#F9F8F6",
      "--color-brand-ink": "#000000",
      "--color-bg-main": "#0A0A0A",
      "--color-bg-soft": "#121212",
      "--color-bg-muted": "#1A1A1A",
      "--color-bg-elevated": "#171717",
      "--color-bg-inverse": "#FFFFFF",
      "--color-text-main": "#F5F5F5",
      "--color-text-muted": "#A3A3A3",
      "--color-text-soft": "#737373",
      "--color-text-inverse": "#000000",
      "--color-border": "#262626",
      "--color-border-strong": "#D4AF37",
      "--color-sale": "#EF4444",
      "--color-discount": "#10B981",
      "--color-rating": "#D4AF37",
      "--color-focus": "#D4AF37",
      "--font-primary": "Arial, Helvetica, sans-serif",
      "--font-display": "Arial, Helvetica, sans-serif",
      "--radius-sm": "0",
      "--radius-md": "0",
      "--radius-lg": "0",
      "--radius-xl": "0",
      "--radius-2xl": "0"
    }
  },
  {
    id: "midnight-tech",
    name: "Midnight Tech",
    description: "Deep tech blue with electric cyan accents. Futuristic e-commerce dark mode.",
    icon: "Moon",
    tokens: {
      "--color-brand-primary": "#06B6D4",
      "--color-brand-secondary": "#0891B2",
      "--color-brand-accent": "#3B82F6",
      "--color-brand-ink": "#0F172A",
      "--color-bg-main": "#0B0F19",
      "--color-bg-soft": "#111827",
      "--color-bg-muted": "#1E293B",
      "--color-bg-elevated": "#1E293B",
      "--color-bg-inverse": "#F8FAFC",
      "--color-text-main": "#F8FAFC",
      "--color-text-muted": "#94A3B8",
      "--color-text-soft": "#64748B",
      "--color-text-inverse": "#0F172A",
      "--color-border": "#334155",
      "--color-border-strong": "#06B6D4",
      "--color-sale": "#F43F5E",
      "--color-discount": "#10B981",
      "--color-rating": "#FBBF24",
      "--color-focus": "#06B6D4",
      "--font-primary": "Arial, Helvetica, sans-serif",
      "--font-display": "Arial, Helvetica, sans-serif",
      "--radius-sm": "0.35rem",
      "--radius-md": "0.5rem",
      "--radius-lg": "0.75rem",
      "--radius-xl": "1rem",
      "--radius-2xl": "1.25rem"
    }
  }
];

/** Resolve final tokens: preset + custom overrides */
export function resolveThemeTokens(config: ThemeConfig): ThemeTokens {
  const preset = THEME_PRESETS.find((p) => p.id === config.activePreset) || THEME_PRESETS[0];
  const result: ThemeTokens = { ...preset.tokens };
  
  if (config.customOverrides) {
    for (const [key, value] of Object.entries(config.customOverrides)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  
  return result;
}
