import { useState, useCallback } from 'react';
import { MdSearch, MdAdd, MdMoreVert, MdRefresh } from 'react-icons/md';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FileTree, type FileNode } from './FileTree';
import { classNames } from '~/utils/classNames';

interface FileExplorerProps {
  files: FileNode[];
  onSelectFile: (file: FileNode) => void;
  onCreateFile?: (path: string, name: string) => void;
  onDeleteFile?: (path: string) => void;
  onRefresh?: () => void;
  selectedFileId?: string;
}

export function FileExplorer({
  files,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRefresh,
  selectedFileId,
}: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);

  const filteredFiles = useCallback(() => {
    if (!searchQuery) return files;

    const query = searchQuery.toLowerCase();
    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((node) => node.name.toLowerCase().includes(query))
        .map((node) => ({
          ...node,
          children: node.children ? filterNodes(node.children) : undefined,
        }));
    };
    return filterNodes(files);
  }, [files, searchQuery]);

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleCreateFile = () => {
    if (contextMenu?.node) {
      const name = prompt('Enter file name:');
      if (name) {
        onCreateFile?.(contextMenu.node.path, name);
        setContextMenu(null);
      }
    }
  };

  const handleDeleteFile = () => {
    if (contextMenu?.node) {
      if (confirm(`Delete ${contextMenu.node.name}?`)) {
        onDeleteFile?.(contextMenu.node.path);
        setContextMenu(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-bolt-elements-background-depth-1 border-r border-bolt-elements-borderColor">
      {/* Header */}
      <div className="p-4 border-b border-bolt-elements-borderColor">
        <h2 className="text-sm font-semibold text-bolt-elements-textPrimary mb-3">Explorer</h2>

        {/* Search */}
        <div className="relative">
          <MdSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 size-4" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={classNames(
              'w-full pl-8 pr-3 py-2 bg-bolt-elements-background-depth-2 text-sm text-bolt-elements-textPrimary',
              'border border-bolt-elements-borderColor rounded hover:border-blue-500 focus:border-blue-500 focus:outline-none',
              'placeholder-gray-600 transition-colors',
            )}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-bolt-elements-borderColor">
        <h3 className="text-xs font-semibold text-gray-500">OPEN EDITORS</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-bolt-elements-background-depth-2 rounded transition-colors"
            title="Refresh"
          >
            <MdRefresh className="size-4 text-gray-500" />
          </button>
          <button
            onClick={handleCreateFile}
            className="p-1 hover:bg-bolt-elements-background-depth-2 rounded transition-colors"
            title="New File"
          >
            <MdAdd className="size-4 text-gray-500" />
          </button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-1 hover:bg-bolt-elements-background-depth-2 rounded transition-colors">
                <MdMoreVert className="size-4 text-gray-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded shadow-lg">
              <DropdownMenu.Item
                onClick={handleCreateFile}
                className="px-3 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 cursor-pointer"
              >
                New File
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={handleDeleteFile}
                className="px-3 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 cursor-pointer"
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto modern-scrollbar">
        {filteredFiles().length > 0 ? (
          <FileTree
            nodes={filteredFiles()}
            onSelect={onSelectFile}
            onContextMenu={handleContextMenu}
            selectedNodeId={selectedFileId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            {searchQuery ? 'No files found' : 'No files'}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded shadow-lg z-50"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={handleCreateFile}
            className="w-full text-left px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
          >
            New File
          </button>
          <button
            onClick={handleDeleteFile}
            className="w-full text-left px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
