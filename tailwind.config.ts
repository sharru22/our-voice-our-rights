import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f8ff',
          100: '#e1f0ff',
          500: '#1d4ed8',
          600: '#1e40af'
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
