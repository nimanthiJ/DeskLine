import { useEffect, useId, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Any',
  searchPlaceholder = 'Search…',
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find((option) => option.value === selected[0])?.label ?? `${selected.length} selected`
        : `${selected.length} selected`;

  return (
    <div className="multi-select" ref={rootRef}>
      <span className="multi-select-label">{label}</span>
      <button
        type="button"
        className="multi-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected.length === 0 ? 'muted' : undefined}>{summary}</span>
        <span className="multi-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="multi-select-panel" id={listId} role="listbox" aria-multiselectable="true">
          <input
            ref={searchRef}
            type="search"
            className="multi-select-search"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={`Search ${label}`}
          />
          <div className="multi-select-options">
            {filtered.length === 0 ? (
              <p className="multi-select-empty muted">No matches</p>
            ) : (
              filtered.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <label key={option.value} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onChange(toggleValue(selected, option.value))}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
