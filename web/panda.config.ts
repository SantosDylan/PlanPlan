import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          ink: { value: '#0f0d0b' },
          surface: { value: '#211c18' },
          surfaceRaised: { value: '#1a1613' },
          surfaceSheet: { value: '#1f1a16' },
          border: { value: 'rgba(246, 241, 231, 0.06)' },
          borderStrong: { value: 'rgba(246, 241, 231, 0.12)' },
          paper: { value: '#f6f1e7' },
          paperMuted: { value: 'rgba(246, 241, 231, 0.5)' },
          paperFaint: { value: 'rgba(246, 241, 231, 0.3)' },
          accent: { value: '#e8a33d' },
          accentSoft: { value: 'rgba(232, 163, 61, 0.12)' },
          accentBorder: { value: 'rgba(232, 163, 61, 0.4)' },
          accentText: { value: '#1a1310' },
          success: { value: '#5fb87a' },
        },
      },
    },
  },

  globalCss: {
    body: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      bg: 'ink',
      color: 'paper',
      minH: '100dvh',
    },
    '::-webkit-scrollbar': { height: '5px', width: '5px' },
    '::-webkit-scrollbar-thumb': { bg: 'rgba(246, 241, 231, 0.15)', rounded: '3px' },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
