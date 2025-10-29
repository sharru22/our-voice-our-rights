import '../styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Our Voice, Our Rights – MGNREGA UP',
  description: 'Understand MGNREGA performance in your district.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1e40af" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}
