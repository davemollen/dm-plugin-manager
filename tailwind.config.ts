/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: toRgba('--color-background'),
        foreground: toRgba('--color-foreground'),
        cta: toRgba('--color-cta'),
        ctaHover: toRgba('--color-cta-hover'),
        link: toRgba('--color-link'),
        navItemBackground: toRgba('--color-nav-item-background'),
        codebox: toRgba('--color-codebox'),
        panel: toRgba('--color-panel'),
      }
    },
  },
  plugins: [],
}

function toRgba(variableName: string) {
  return `color-mix(in srgb, var(${variableName}) calc(<alpha-value> * 100%), transparent)`
}