/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        cta: "var(--color-cta)",
        ctaHover: "var(--color-cta-hover)",
        link: "var(--color-link)",
        navItemBackground: "var(--color-nav-item-background)",
        codebox: "var(--color-codebox)",
        panel: "var(--color-panel)"
      }
    },
  },
  plugins: [],
}