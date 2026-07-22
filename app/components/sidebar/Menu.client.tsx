import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { Button } from '~/components/ui/Button';
import { db, deleteById, getAll, chatId, type ChatHistoryItem, useChatHistory } from '~/lib/persistence';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';

interface MenuProps {
  onSettingsClick: () => void;
  onClose: () => void;
}

type DialogContent =
  | { type: 'delete'; item: ChatHistoryItem }
  | { type: 'bulkDelete'; items: ChatHistoryItem[] }
  | null;

export function Menu({ onSettingsClick, onClose: _onClose }: MenuProps) {
  const { duplicateCurrentChat, exportChat } = useChatHistory();
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteChat = useCallback(
    async (id: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not available');
      }

      try {
        const snapshotKey = `snapshot:${id}`;
        localStorage.removeItem(snapshotKey);
      } catch (snapshotError) {
        console.error(`Error deleting snapshot for chat ${id}:`, snapshotError);
      }

      await deleteById(db, id);
    },
    [db],
  );

  const deleteItem = useCallback(
    (event: React.UIEvent, item: ChatHistoryItem) => {
      event.preventDefault();
      event.stopPropagation();

      deleteChat(item.id)
        .then(() => {
          toast.success('Chat deleted successfully');
          loadEntries();

          if (chatId.get() === item.id) {
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          console.error('Failed to delete chat:', error);
          toast.error('Failed to delete conversation');
          loadEntries();
        });
    },
    [loadEntries, deleteChat],
  );

  const deleteSelectedItems = useCallback(
    async (itemsToDeleteIds: string[]) => {
      if (!db || itemsToDeleteIds.length === 0) {
        return;
      }

      let deletedCount = 0;
      const errors: string[] = [];
      const currentChatId = chatId.get();
      let shouldNavigate = false;

      for (const id of itemsToDeleteIds) {
        try {
          await deleteChat(id);
          deletedCount++;

          if (id === currentChatId) {
            shouldNavigate = true;
          }
        } catch (error) {
          console.error(`Error deleting chat ${id}:`, error);
          errors.push(id);
        }
      }

      if (errors.length === 0) {
        toast.success(`${deletedCount} chat${deletedCount === 1 ? '' : 's'} deleted successfully`);
      } else {
        toast.warning(`Deleted ${deletedCount} of ${itemsToDeleteIds.length} chats. ${errors.length} failed.`);
      }

      await loadEntries();
      setSelectedItems([]);
      setSelectionMode(false);

      if (shouldNavigate) {
        window.location.pathname = '/';
      }
    },
    [deleteChat, loadEntries, db],
  );

  const closeDialog = () => {
    setDialogContent(null);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);

    if (selectionMode) {
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.info('Select at least one chat to delete');
      return;
    }

    const selectedChats = list.filter((item) => selectedItems.includes(item.id));

    if (selectedChats.length === 0) {
      toast.error('Could not find selected chats');
      return;
    }

    setDialogContent({ type: 'bulkDelete', items: selectedChats });
  }, [selectedItems, list]);

  const selectAll = useCallback(() => {
    const allFilteredIds = filteredList.map((item) => item.id);
    setSelectedItems((prev) => {
      const allFilteredAreSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => prev.includes(id));

      if (allFilteredAreSelected) {
        return prev.filter((id) => !allFilteredIds.includes(id));
      } else {
        return [...new Set([...prev, ...allFilteredIds])];
      }
    });
  }, [filteredList]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDuplicate = async (id: string) => {
    await duplicateCurrentChat(id);
    loadEntries();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-bolt-elements-borderColor shadow-lg text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2/50">
        <span className="text-sm font-semibold text-bolt-elements-textPrimary">Conversations</span>
        <div className="flex items-center gap-1">
          <ThemeSwitch />
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <a
          href="/"
          className="flex gap-2 items-center justify-center bg-accent-500 text-white hover:bg-accent-600 rounded-lg px-4 py-2.5 transition-colors font-medium text-sm"
        >
          <span className="i-ph:plus-circle text-lg" />
          <span>New chat</span>
        </a>
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <span className="i-ph:magnifying-glass h-4 w-4 text-bolt-elements-textTertiary" />
          </div>
          <input
            className="w-full bg-bolt-elements-bg-depth-2 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30 text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary border border-bolt-elements-borderColor"
            type="search"
            placeholder="Search conversations..."
            onChange={handleSearchChange}
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Selection toolbar */}
      {selectionMode && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2/30">
          <div className="text-xs text-bolt-elements-textSecondary">{selectedItems.length} selected</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedItems.length === filteredList.length ? 'Deselect all' : 'Select all'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={selectedItems.length === 0}
            >
              Delete
            </Button>
            <button
              onClick={toggleSelectionMode}
              className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              <span className="i-ph:x h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-auto px-2 pb-2">
        {!selectionMode && (
          <div className="flex items-center justify-between px-2 py-2">
            <div className="text-xs font-medium text-bolt-elements-textTertiary uppercase tracking-wider">History</div>
            <button
              onClick={toggleSelectionMode}
              className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
              title="Select conversations"
            >
              <span className="i-ph:check-square h-4 w-4" />
            </button>
          </div>
        )}

        {filteredList.length === 0 && (
          <div className="px-4 py-8 text-center text-bolt-elements-textTertiary text-sm">
            {list.length === 0 ? 'No conversations yet' : 'No matches found'}
          </div>
        )}

        <DialogRoot open={dialogContent !== null}>
          {binDates(filteredList).map(({ category, items }) => (
            <div key={category} className="mt-1 first:mt-0">
              <div className="text-xs font-medium text-bolt-elements-textTertiary px-2 py-1.5 sticky top-0 z-1 bg-white dark:bg-gray-950">
                {category}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    exportChat={exportChat}
                    onDelete={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDialogContent({ type: 'delete', item });
                    }}
                    onDuplicate={() => handleDuplicate(item.id)}
                    selectionMode={selectionMode}
                    isSelected={selectedItems.includes(item.id)}
                    onToggleSelection={toggleItemSelection}
                  />
                ))}
              </div>
            </div>
          ))}
          <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
            {dialogContent?.type === 'delete' && (
              <>
                <div className="p-6">
                  <DialogTitle>Delete Chat?</DialogTitle>
                  <DialogDescription className="mt-2">
                    <p>
                      You are about to delete <span className="font-medium">{dialogContent.item.description}</span>
                    </p>
                    <p className="mt-2">Are you sure you want to delete this chat?</p>
                  </DialogDescription>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-bolt-elements-borderColor">
                  <DialogButton type="secondary" onClick={closeDialog}>
                    Cancel
                  </DialogButton>
                  <DialogButton
                    type="danger"
                    onClick={(event) => {
                      deleteItem(event, dialogContent.item);
                      closeDialog();
                    }}
                  >
                    Delete
                  </DialogButton>
                </div>
              </>
            )}
            {dialogContent?.type === 'bulkDelete' && (
              <>
                <div className="p-6">
                  <DialogTitle>Delete Selected Chats?</DialogTitle>
                  <DialogDescription className="mt-2">
                    <p>
                      You are about to delete {dialogContent.items.length}{' '}
                      {dialogContent.items.length === 1 ? 'chat' : 'chats'}:
                    </p>
                    <div className="mt-2 max-h-32 overflow-auto border border-bolt-elements-borderColor rounded-md p-2">
                      <ul className="list-disc pl-5 space-y-1">
                        {dialogContent.items.map((item) => (
                          <li key={item.id} className="text-sm">
                            <span className="font-medium">{item.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="mt-3">Are you sure you want to delete these chats?</p>
                  </DialogDescription>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-bolt-elements-borderColor">
                  <DialogButton type="secondary" onClick={closeDialog}>
                    Cancel
                  </DialogButton>
                  <DialogButton
                    type="danger"
                    onClick={() => {
                      const itemsToDeleteNow = [...selectedItems];
                      deleteSelectedItems(itemsToDeleteNow);
                      closeDialog();
                    }}
                  >
                    Delete
                  </DialogButton>
                </div>
              </>
            )}
          </Dialog>
        </DialogRoot>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-bolt-elements-borderColor px-4 py-3">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors text-sm"
        >
          <span className="i-ph:gear-six h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
