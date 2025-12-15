// Tailwind CSS 4: Konfiguration wird hauptsächlich in CSS gemacht (@theme in globals.css)
// Diese Datei wird nur noch für Plugins benötigt
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [require('tailwindcss-animate')],
};

export default config;

