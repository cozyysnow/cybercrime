import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CyberCast — AI-Driven Predictive Cybercrime Defense Platform',
  description: "An AI-powered predictive analytics platform transforming cybercrime response from reactive to proactive — forecasting likely cash withdrawal locations in real-time to enable timely intervention by law enforcement and financial institutions.",
  icons: {
    icon: '/CyberCast.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 antialiased font-sans">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
