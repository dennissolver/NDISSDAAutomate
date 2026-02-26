import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '../lib/trpc/provider';
import { AppShell } from '../components/layout/app-shell';

export const metadata: Metadata = {
  title: 'PF Platform — Property Friends',
  description: 'SDA claims, reconciliation, and property management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <TRPCProvider>
          <AppShell>{children}</AppShell>
        </TRPCProvider>
      </body>
    </html>
  );
}
