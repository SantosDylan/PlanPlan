import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Override the built-in `dark` condition so `_dark` token values resolve
  // against our own `data-theme` attribute on <html>, not Panda's default
  // color-mode selector. `base` = the light "Velours & tapis rouge" theme;
  // `_dark` = the preserved "doré" theme.
  conditions: {
    extend: {
      dark: '[data-theme=dark] &',
    },
  },

  // Useful for theme customization
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          // Surfaces & chrome
          ink: { value: { base: '#f7f2e8', _dark: '#0f0d0b' } },
          surface: { value: { base: '#fffdf9', _dark: '#211c18' } },
          surfaceRaised: { value: { base: '#fbf6ec', _dark: '#1a1613' } },
          surfaceSheet: { value: { base: '#f1e8d8', _dark: '#1f1a16' } },
          headerBg: { value: { base: 'rgba(247, 242, 232, 0.72)', _dark: 'rgba(15, 13, 11, 0.68)' } },
          navBg: { value: { base: 'rgba(255, 253, 249, 0.8)', _dark: 'rgba(26, 22, 19, 0.75)' } },
          scrollThumb: { value: { base: 'rgba(26, 19, 16, 0.15)', _dark: 'rgba(246, 241, 231, 0.15)' } },
          hairline: { value: { base: 'rgba(26, 19, 16, 0.05)', _dark: 'rgba(246, 241, 231, 0.06)' } },
          hairlineFaint: { value: { base: 'rgba(26, 19, 16, 0.02)', _dark: 'rgba(246, 241, 231, 0.02)' } },
          border: { value: { base: 'rgba(26, 19, 16, 0.1)', _dark: 'rgba(246, 241, 231, 0.06)' } },
          borderStrong: { value: { base: 'rgba(26, 19, 16, 0.18)', _dark: 'rgba(246, 241, 231, 0.12)' } },

          // Text
          paper: { value: { base: '#1a1310', _dark: '#f6f1e7' } },
          paperMuted: { value: { base: 'rgba(26, 19, 16, 0.55)', _dark: 'rgba(246, 241, 231, 0.5)' } },
          paperFaint: { value: { base: 'rgba(26, 19, 16, 0.35)', _dark: 'rgba(246, 241, 231, 0.3)' } },

          // Accent
          accent: { value: { base: '#a11220', _dark: '#e8a33d' } },
          accentSoft: { value: { base: 'rgba(161, 18, 32, 0.1)', _dark: 'rgba(232, 163, 61, 0.12)' } },
          accentBorder: { value: { base: 'rgba(161, 18, 32, 0.35)', _dark: 'rgba(232, 163, 61, 0.4)' } },
          accentText: { value: { base: '#fdf6ec', _dark: '#1a1310' } },

          // Heritage gold micro-accent
          gold: { value: { base: '#c8912f', _dark: '#e8a33d' } },

          // Semantics
          success: { value: { base: '#3f9d5c', _dark: '#5fb87a' } },
          successSoft: { value: { base: 'rgba(63, 157, 92, 0.12)', _dark: 'rgba(95, 184, 122, 0.12)' } },
          successBorder: { value: { base: 'rgba(63, 157, 92, 0.4)', _dark: 'rgba(95, 184, 122, 0.4)' } },
          danger: { value: { base: '#d22b36', _dark: '#f0565b' } },
          dangerSoft: { value: { base: 'rgba(210, 43, 54, 0.1)', _dark: 'rgba(240, 86, 91, 0.14)' } },
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
    '::-webkit-scrollbar-thumb': { bg: 'scrollThumb', rounded: '3px' },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
