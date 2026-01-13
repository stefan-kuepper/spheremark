import { useAnnotations } from '@/hooks';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export function SaveStatus() {
  const { saveStatus } = useAnnotations();

  if (saveStatus === 'idle') {
    return null;
  }

  const config = {
    saving: {
      text: 'Saving...',
      icon: Loader2,
      className: 'text-muted-foreground',
      iconClassName: 'animate-spin',
    },
    saved: {
      text: 'Saved',
      icon: Check,
      className: 'text-green-600',
      iconClassName: '',
    },
    error: {
      text: 'Error saving',
      icon: AlertCircle,
      className: 'text-destructive',
      iconClassName: '',
    },
  }[saveStatus];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-md bg-card border shadow-sm',
        config.className
      )}
    >
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}
