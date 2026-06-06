import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          secondary: "var(--color-brand-secondary)",
          accent: "var(--color-brand-accent)",
          ink: "var(--color-brand-ink)",
        },
        background: {
          main: "var(--color-bg-main)",
          soft: "var(--color-bg-soft)",
          muted: "var(--color-bg-muted)",
          elevated: "var(--color-bg-elevated)",
          inverse: "var(--color-bg-inverse)",
        },
        text: {
          main: "var(--color-text-main)",
          muted: "var(--color-text-muted)",
          soft: "var(--color-text-soft)",
          inverse: "var(--color-text-inverse)",
        },
        border: "var(--color-border)",
        accent: {
          sale: "var(--color-sale)",
          discount: "var(--color-discount)",
          rating: "var(--color-rating)",
        },
      },
      fontFamily: {
        primary: ["var(--font-primary)", "serif"],
        display: ["var(--font-display)", "serif"],
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
        "5xl": "var(--font-size-5xl)",
      },
      fontWeight: {
        regular: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      lineHeight: {
        tight: "var(--line-height-tight)",
        snug: "var(--line-height-snug)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
        loose: "var(--line-height-loose)",
      },
      letterSpacing: {
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
        "header": "var(--header-height)",
        "button": "var(--button-height-md)",
        "button-sm": "var(--button-height-sm)",
        "button-lg": "var(--button-height-lg)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        dropdown: "var(--shadow-dropdown)",
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)",
      },
      maxWidth: {
        container: "var(--container-max)",
        narrow: "var(--container-narrow)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        base: "var(--transition-base)",
        slow: "var(--transition-slow)",
      },
      zIndex: {
        header: "var(--z-header)",
        dropdown: "var(--z-dropdown)",
        drawer: "var(--z-drawer)",
        modal: "var(--z-modal)",
      },
    },
  },
  plugins: [],
};

export default config;
