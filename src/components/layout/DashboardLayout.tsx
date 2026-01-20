import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 min-h-screen">
        <header className="bg-card border-b border-border px-8 py-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
