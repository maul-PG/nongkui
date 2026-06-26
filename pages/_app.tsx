import type { AppProps } from 'next/app';
import { Inter, Outfit } from 'next/font/google';
import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.variable} ${outfit.variable} font-sans`}>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </main>
  );
}
