import type { Metadata } from 'next';
import { Barlow_Condensed, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const displayFont = Barlow_Condensed({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['700'],
});

const bodyFont = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'AI Agents for Resilient Supply Chain | Autonomous Manufacturing Recovery',
  description:
    'Planner-facing decision support platform orchestrating multi-agent intelligence, deterministic validation, and mathematical optimization to recover from critical supplier disruptions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e5e5e5] text-[#000000] selection:bg-[#d1ffca] selection:text-[#000000]">
        {children}
      </body>
    </html>
  );
}
