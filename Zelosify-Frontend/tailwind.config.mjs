import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Colors are stored as space-separated RGB channels in globals.css so that
 * Tailwind opacity modifiers (e.g. `bg-card/60`) work for every token.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "Menlo",
          "Monaco",
          "Courier",
          "monospace",
        ],
      },
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        tertiary: token("tertiary"),
        border: token("border"),
        ring: token("ring"),
        focus: token("focus"),
        chartLine: token("chart-line"),
        tableHeader: token("table-header"),
        scrollBar: token("scroll-bar"),
        coral: {
          DEFAULT: token("coral"),
          ember: token("ember"),
        },
        success: token("success"),
        info: token("info"),
        warning: token("warning"),
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        input: token("input"),
        chart1: token("chart-1"),
        chart2: token("chart-2"),
        chart3: token("chart-3"),
        chart4: token("chart-4"),
        chart5: token("chart-5"),
        sidebar: {
          DEFAULT: token("sidebar-background"),
          foreground: token("sidebar-foreground"),
          primary: token("sidebar-primary"),
          "primary-foreground": token("sidebar-primary-foreground"),
          accent: token("sidebar-accent"),
          "accent-foreground": token("sidebar-accent-foreground"),
          border: token("sidebar-border"),
          ring: token("sidebar-ring"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "16px",
        "card-lg": "20px",
      },
      boxShadow: {
        // Raycast "keyboard key" treatment: inset top highlight + hairline ring
        key: "inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 -1px 0 0 rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
        "key-hover":
          "inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 -1px 0 0 rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)",
        float:
          "0 4px 40px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        glow: "0 0 40px 0 rgba(255,99,99,0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
