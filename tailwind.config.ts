/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--colors-background)",
        foreground: "var(--colors-foreground)",
        cta: "var(--colors-cta)",
        ctaHover: "var(--colors-cta-hover)",
        link: "var(--colors-link)",
        navItemBackground: "var(--colors-nav-item-background)",
        panel: "var(--colors-panel)"
      }
    },
  },
  plugins: [],
}