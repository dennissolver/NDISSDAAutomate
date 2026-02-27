'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-60">
        <Header />
        <main className="px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
