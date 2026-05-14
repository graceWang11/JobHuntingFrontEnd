import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  label?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
}

export function TagInput({ label, values, onChange, placeholder, hint }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="w-full">
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-2">
          {label}
        </span>
      )}
      <div className="input-neu flex flex-wrap items-center gap-2 min-h-[3rem] py-2">
        {values.map((v) => (
          <span
            key={v}
            className="chip-active inline-flex items-center gap-1.5 !text-[11px]"
          >
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="opacity-80 hover:opacity-100">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ''}
          className="bg-transparent flex-1 min-w-[140px] outline-none text-ink placeholder:text-ink-mute"
        />
      </div>
      {hint && <span className="block mt-1.5 text-xs text-ink-mute">{hint}</span>}
    </div>
  );
}
