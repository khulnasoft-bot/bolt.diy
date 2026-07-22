import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu } from './Menu.client';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';

export function MenuToggle() {
  const [open, setOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen(true);
    setOpen(false);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  useEffect(() => {
    if (!open || isSettingsOpen) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, isSettingsOpen]);

  return (
    <>
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-bolt-elements-item-backgroundActive transition-colors text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      >
        <div className={open ? 'i-ph:x text-lg' : 'i-ph:sidebar-simple-duotone text-lg'} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}

      <div
        ref={menuRef}
        className={`
          fixed top-0 left-0 h-full w-[var(--sidebar-width)] z-50
          transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Menu onSettingsClick={handleSettingsClick} onClose={() => setOpen(false)} />
      </div>

      <ControlPanel open={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
}
