import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-gradient-primary text-primary-foreground',
  secondary: 'bg-gradient-secondary text-secondary-foreground',
  accent: 'bg-gradient-accent text-accent-foreground',
};

export function StatCard({ title, value, icon, trend, variant = 'default', className }: StatCardProps) {
  const isColored = variant !== 'default';

  return (
    <div className={cn('stat-card', variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            isColored ? 'opacity-80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-2 flex items-center gap-1',
              isColored ? 'opacity-80' : (trend.isPositive ? 'text-success' : 'text-destructive')
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last month</span>
            </p>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          isColored ? 'bg-white/20' : 'bg-primary/10'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
