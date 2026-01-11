import { useState, useRef, useEffect } from 'react';

interface LabelEditorProps {
  value: string;
  onSave: (label: string) => void;
  onCancel: () => void;
  suggestions: string[];
}

export function LabelEditor({ value, onSave, onCancel, suggestions }: LabelEditorProps) {
  const [label, setLabel] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(label);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(label);
  };

  return (
    <div className="label-editor">
      <input
        ref={inputRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        list="label-suggestions"
        placeholder="Enter label..."
      />
      <datalist id="label-suggestions">
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </div>
  );
}
