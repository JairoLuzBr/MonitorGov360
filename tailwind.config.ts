import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do design system MonitorGov360
        primary: {
          DEFAULT: "#1E3A5F",
          50: "#EEF2F7",
          100: "#D5E1EE",
          200: "#AAC3DD",
          300: "#7FA5CC",
          400: "#5487BB",
          500: "#1E3A5F",
          600: "#1A3254",
          700: "#162A47",
          800: "#12223A",
          900: "#0E1A2D",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#C8941A",
          50: "#FDF6E3",
          100: "#FAEABB",
          200: "#F5D477",
          300: "#F0BE33",
          400: "#D9A31B",
          500: "#C8941A",
          600: "#B07F16",
          700: "#8C6512",
          800: "#684B0E",
          900: "#44310A",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16a34a",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#d97706",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#dc2626",
          foreground: "#FFFFFF",
        },
        // Cores shadcn/ui compatíveis
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
