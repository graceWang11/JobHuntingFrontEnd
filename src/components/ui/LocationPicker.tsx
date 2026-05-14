import { useMemo, useState, type KeyboardEvent } from 'react';
import { MapPin, Plus, Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface LocationPickerProps {
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  label?: string;
  hint?: string;
  placeholder?: string;
  maxSuggestions?: number;
}

export function LocationPicker({
  values,
  onChange,
  suggestions,
  label,
  hint,
  placeholder = 'Search a city, region, or "Remote"',
  maxSuggestions = 8,
}: LocationPickerProps) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const pool = suggestions.filter((s) => !values.includes(s));
    if (!q) return pool.slice(0, maxSuggestions);
    return pool
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, maxSuggestions);
  }, [q, suggestions, values, maxSuggestions]);

  const exactMatch = useMemo(() => {
    if (!q) return false;
    return [...suggestions, ...values].some((s) => s.toLowerCase() === q);
  }, [q, suggestions, values]);

  const add = (loc: string) => {
    const v = loc.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setQuery('');
  };

  const remove = (loc: string) => onChange(values.filter((x) => x !== loc));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[0]) add(filtered[0]);
      else if (query.trim()) add(query.trim());
    } else if (e.key === 'Backspace' && !query && values.length) {
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

      {/* Selected chips */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {values.map((v) => (
            <span
              key={v}
              className="chip-active inline-flex items-center gap-1.5 !text-xs"
            >
              <MapPin size={12} />
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="opacity-80 hover:opacity-100"
                aria-label={`Remove ${v}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative flex items-center">
        <span className="absolute left-4 text-ink-mute pointer-events-none">
          <Search size={16} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="input-neu pl-12 pr-28"
        />
        {query.trim() && !exactMatch && (
          <button
            type="button"
            onClick={() => add(query.trim())}
            className="absolute right-2 chip-active inline-flex items-center gap-1 !text-[11px] !py-1.5 !px-3 cursor-pointer"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {/* Suggestions */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn(
                'chip inline-flex items-center gap-1.5 !text-xs cursor-pointer hover:-translate-y-[1px] transition'
              )}
            >
              <MapPin size={12} />
              {s}
            </button>
          ))}
        </div>
      )}

      {hint && <span className="block mt-2 text-xs text-ink-mute">{hint}</span>}
    </div>
  );
}
