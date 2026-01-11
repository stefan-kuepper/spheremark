import { useAnnotations } from '../../hooks';

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
    <div id="save-status" className={saveStatus}>
      <span id="save-text">{statusText}</span>
    </div>
  );
}
