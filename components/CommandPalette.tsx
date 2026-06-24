import React, { useState, useEffect, useRef, useCallback } from 'react';


interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CommandItem[];
}

const DEFAULT_ITEMS: CommandItem[] = [
  { id: 'home', label: 'Home', description: 'Go to home page', category: 'Pages', action: () => window.location.hash = '/' },
  { id: 'courses', label: 'Courses', description: 'Browse courses', category: 'Pages', action: () => window.location.hash = '/courses' },
  { id: 'dashboard', label: 'Dashboard', description: 'Student dashboard', category: 'Pages', action: () => window.location.hash = '/dashboard' },
  { id: 'practice', label: 'Practice', description: 'Practice labs', category: 'Pages', action: () => window.location.hash = '/practice' },
  { id: 'profile', label: 'Profile', description: 'Your profile', category: 'Pages', action: () => window.location.hash = '/profile' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, items = DEFAULT_ITEMS }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? items.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && filtered[activeIndex]) { filtered[activeIndex].action(); onClose(); return; }
  }, [filtered, activeIndex, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [...new Set(filtered.map(i => i.category).filter(Boolean))] as string[];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh', background: 'var(--overlay-bg)',
      }}
      onClick={onClose}
    >
      <div
        className="bento-card"
        style={{
          width: '100%', maxWidth: '600px', padding: 0, overflow: 'hidden',
          borderWidth: '3px', boxShadow: '6px 6px 0 0 var(--ink)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '2px solid var(--ink)', gap: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'var(--ink-mute)', flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            className="input"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tools, commands..."
            autoComplete="off"
            spellCheck={false}
            style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: '1rem' }}
          />
          <button className="btn btn-sm" onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}>
            ×
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <p>No results for <em style={{ fontWeight: 600, color: 'var(--ink)' }}>{query}</em></p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: '8px' }}>
            {categories.length > 0 ? (
              categories.map(cat => (
                <li key={cat}>
                  <div className="flabel" style={{ padding: '8px 12px 4px' }}>{cat}</div>
                  {filtered.filter(i => i.category === cat).map((item, idx) => {
                    const globalIdx = filtered.indexOf(item);
                    const isActive = globalIdx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        className="btn btn-sm"
                        onClick={() => { item.action(); onClose(); }}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        role="option"
                        aria-selected={isActive}
                        style={{
                          width: '100%', justifyContent: 'space-between', padding: '10px 12px',
                          background: isActive ? 'var(--accent-soft)' : 'transparent',
                          borderColor: isActive ? 'var(--accent)' : 'transparent',
                          borderRadius: 0,
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-mute)' }}>{item.description}</div>
                          )}
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'var(--ink-mute)', flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </button>
                    );
                  })}
                </li>
              ))
            ) : (
              filtered.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    className="btn btn-sm"
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    role="option"
                    aria-selected={isActive}
                    style={{
                      width: '100%', justifyContent: 'space-between', padding: '10px 12px',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      borderColor: isActive ? 'var(--accent)' : 'transparent',
                      borderRadius: 0,
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</div>
                      {item.description && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-mute)' }}>{item.description}</div>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'var(--ink-mute)', flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </button>
                );
              })
            )}
          </ul>
        )}

        <div style={{ display: 'flex', gap: '16px', padding: '12px 20px', borderTop: '2px solid var(--ink)', fontSize: '0.72rem', color: 'var(--ink-mute)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ border: '1px solid var(--ink)', padding: '1px 5px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>↑</kbd>
            <kbd style={{ border: '1px solid var(--ink)', padding: '1px 5px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>↓</kbd>
            <span>Navigate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ border: '1px solid var(--ink)', padding: '1px 5px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>↵</kbd>
            <span>Open</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ border: '1px solid var(--ink)', padding: '1px 5px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>Esc</kbd>
            <span>Close</span>
          </div>
          <span style={{ marginLeft: 'auto' }}>
            <kbd style={{ border: '1px solid var(--ink)', padding: '1px 5px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            {' + '}
            <kbd style={{ border: '1px solid var(--ink)', padding: '1px 5px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
