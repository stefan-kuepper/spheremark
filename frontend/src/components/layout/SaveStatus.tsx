import { useAnnotations } from '../../hooks';
import { cn } from '@/lib/utils';

export function SaveStatus() {
  const { saveStatus } = useAnnotations();

  if (saveStatus === 'idle') {
    return null;
  }

  const statusText = {
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error saving',
  }[saveStatus];

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 px-4 py-2 rounded-md text-sm text-white z-[60] transition-opacity',
        saveStatus === 'saving' && 'bg-warning/90',
        saveStatus === 'saved' && 'bg-success/90',
        saveStatus === 'error' && 'bg-destructive/90'
      )}
    >
      <span>{statusText}</span>
    </div>
  );
}
