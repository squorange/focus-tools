import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import OfflineIndicator from './components/OfflineIndicator';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Orbital Zen - AI Task Manager',
  description: 'Manage your tasks with orbital visualization and AI assistance',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <OfflineIndicator />
        {children}
      </body>
    </html>
  );
}
