import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#e5e5e5] text-[#000000] selection:bg-[#d1ffca] selection:text-[#000000]">
        {children}
      </body>
    </html>
  );
}
