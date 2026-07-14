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
      tokens: {
        radii: {
          poster: { value: '12px' },
          chip: { value: '11px' },
          button: { value: '13px' },
          sheet: { value: '26px' },
          thumb: { value: '6px' },
        },
        fonts: {
          body: { value: "'Schibsted Grotesk Variable', system-ui, -apple-system, 'Segoe UI', sans-serif" },
          mono: { value: "'Spline Sans Mono Variable', ui-monospace, monospace" },
        },
      },
      semanticTokens: {
        colors: {
          // Surfaces & chrome
          ink: { value: { base: '#efe8da', _dark: '#0f0d0b' } },
          surface: { value: { base: '#fffdf9', _dark: '#211c18' } },
          surfaceRaised: { value: { base: '#fbf6ec', _dark: '#1a1613' } },
          surfaceSheet: { value: { base: '#faf6ee', _dark: '#1f1a16' } },
          headerBg: { value: { base: 'rgba(247, 242, 232, 0.72)', _dark: 'rgba(15, 13, 11, 0.68)' } },
          navBg: { value: { base: 'rgba(255, 253, 249, 0.8)', _dark: 'rgba(26, 22, 19, 0.75)' } },
          scrollThumb: { value: { base: 'rgba(26, 19, 16, 0.15)', _dark: 'rgba(246, 241, 231, 0.15)' } },
          hairline: { value: { base: 'rgba(26, 19, 16, 0.05)', _dark: 'rgba(246, 241, 231, 0.06)' } },
          hairlineFaint: { value: { base: 'rgba(26, 19, 16, 0.02)', _dark: 'rgba(246, 241, 231, 0.02)' } },
          border: { value: { base: 'rgba(26, 19, 16, 0.1)', _dark: 'rgba(246, 241, 231, 0.06)' } },
          borderStrong: { value: { base: 'rgba(26, 19, 16, 0.18)', _dark: 'rgba(246, 241, 231, 0.12)' } },
          scrim: { value: { base: 'rgba(14, 13, 11, 0.42)', _dark: 'rgba(10, 8, 6, 0.62)' } },

          // Text
          paper: { value: { base: '#1b1a17', _dark: '#f6f1e7' } },
          paperMuted: { value: { base: 'rgba(26, 19, 16, 0.55)', _dark: 'rgba(246, 241, 231, 0.5)' } },
          paperFaint: { value: { base: 'rgba(26, 19, 16, 0.35)', _dark: 'rgba(246, 241, 231, 0.3)' } },
          paperBody: { value: { base: '#57503f', _dark: 'rgba(246, 241, 231, 0.68)' } },

          // Accent
          accent: { value: { base: '#a4192c', _dark: '#e8a33d' } },
          accentHover: { value: { base: '#7d1321', _dark: '#c98a30' } },
          accentSoft: { value: { base: 'rgba(164, 25, 44, 0.1)', _dark: 'rgba(232, 163, 61, 0.12)' } },
          accentBorder: { value: { base: 'rgba(164, 25, 44, 0.35)', _dark: 'rgba(232, 163, 61, 0.4)' } },
          accentText: { value: { base: '#fdf6ec', _dark: '#1a1310' } },

          // Heritage gold micro-accent
          gold: { value: { base: '#c8912f', _dark: '#e8a33d' } },

          // Poster overlays (same in both themes — sit on artwork, not chrome)
          posterTagBg: { value: { base: 'rgba(0, 0, 0, 0.42)', _dark: 'rgba(0, 0, 0, 0.42)' } },

          // Semantics
          success: { value: { base: '#2f9e5f', _dark: '#5fb87a' } },
          successSoft: { value: { base: 'rgba(47, 158, 95, 0.12)', _dark: 'rgba(95, 184, 122, 0.12)' } },
          successBorder: { value: { base: 'rgba(47, 158, 95, 0.4)', _dark: 'rgba(95, 184, 122, 0.4)' } },
          danger: { value: { base: '#d22b36', _dark: '#f0565b' } },
          dangerSoft: { value: { base: 'rgba(210, 43, 54, 0.1)', _dark: 'rgba(240, 86, 91, 0.14)' } },
        },
      },
    },
  },

  globalCss: {
    body: {
      fontFamily: 'body',
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
