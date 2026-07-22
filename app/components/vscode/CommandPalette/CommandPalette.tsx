import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdClose } from 'react-icons/md';
import { classNames } from '~/utils/classNames';

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: string;
  keybinding?: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const fuzzyMatch = (query: string, text: string): boolean => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let queryIndex = 0;
  for (let i = 0; i < textLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
    if (queryIndex === queryLower.length) {
      return true;
    }
  }
  return false;
};

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    return commands
      .filter((cmd) => fuzzyMatch(query, cmd.title) || fuzzyMatch(query, cmd.description || ''))
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.title.toLowerCase() === query.toLowerCase();
        const bExact = b.title.toLowerCase() === query.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then by position of match
        const aIndex = a.title.toLowerCase().indexOf(query.toLowerCase());
        const bIndex = b.title.toLowerCase().indexOf(query.toLowerCase());
        return aIndex - bIndex;
      });
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return Object.entries(groups);
  }, [filteredCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  let commandIndex = 0;
  const getCommandIndex = () => commandIndex++;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-bolt-elements-background-depth-1 rounded-lg shadow-2xl border border-bolt-elements-borderColor overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
              <MdSearch className="size-5 text-gray-500" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-bolt-elements-textPrimary text-lg focus:outline-none placeholder-gray-600"
              />
              <button onClick={onClose} className="text-gray-500 hover:text-gray-400">
                <MdClose className="size-5" />
              </button>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto modern-scrollbar">
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No commands found</div>
              ) : (
                groupedCommands.map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-bolt-elements-background-depth-2 sticky top-0">
                      {category}
                    </div>
                    {cmds.map((cmd) => {
                      const index = getCommandIndex() - 1;
                      const isSelected = index === selectedIndex;
                      return (
                        <motion.button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                          className={classNames(
                            'w-full px-4 py-2 text-left hover:bg-bolt-elements-background-depth-2 transition-colors flex items-center justify-between',
                            isSelected && 'bg-blue-500/20 border-l-2 border-blue-500',
                          )}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {cmd.icon && <div className="size-4 text-gray-500">{cmd.icon}</div>}
                            <div className="flex-1">
                              <div className="text-sm text-bolt-elements-textPrimary">{cmd.title}</div>
                              {cmd.description && (
                                <div className="text-xs text-gray-600">{cmd.description}</div>
                              )}
                            </div>
                          </div>
                          {cmd.keybinding && (
                            <div className="text-xs text-gray-600 bg-bolt-elements-background-depth-3 px-2 py-1 rounded">
                              {cmd.keybinding}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-xs text-gray-600 flex justify-between">
              <span>{filteredCommands.length} commands available</span>
              <span>↑↓ to navigate • ↵ to select • ESC to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
