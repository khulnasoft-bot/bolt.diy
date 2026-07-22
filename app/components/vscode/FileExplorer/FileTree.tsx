import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdFolder, MdFolderOpen, MdInsertDriveFile, MdChevronRight } from 'react-icons/md';
import { classNames } from '~/utils/classNames';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  icon?: React.ReactNode;
}

interface FileTreeProps {
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  selectedNodeId?: string;
  expandedNodeIds?: Set<string>;
}

export function FileTree({
  nodes,
  onSelect,
  onContextMenu,
  selectedNodeId,
  expandedNodeIds: initialExpandedNodeIds = new Set(),
}: FileTreeProps) {
  const [expandedNodeIds, setExpandedNodeIds] = useState(initialExpandedNodeIds);

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodeIds);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodeIds(newExpanded);
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return expandedNodeIds.has(node.id) ? (
        <MdFolderOpen className="size-4 text-yellow-500" />
      ) : (
        <MdFolder className="size-4 text-yellow-500" />
      );
    }

    // File icons based on extension
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return <span className="text-blue-400">TS</span>;
      case 'jsx':
      case 'js':
        return <span className="text-yellow-400">JS</span>;
      case 'css':
      case 'scss':
        return <span className="text-pink-400">CSS</span>;
      case 'json':
        return <span className="text-orange-400">JSON</span>;
      case 'md':
        return <span className="text-blue-300">MD</span>;
      default:
        return <MdInsertDriveFile className="size-4 text-gray-500" />;
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={classNames(
            'flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-bolt-elements-background-depth-2 rounded transition-colors',
            selectedNodeId === node.id && 'bg-bolt-elements-background-depth-2 border-l-2 border-blue-500',
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder' && hasChildren) {
              toggleExpanded(node.id);
            }
            onSelect(node);
          }}
          onContextMenu={(e) => onContextMenu?.(e, node)}
        >
          {node.type === 'folder' && hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <MdChevronRight className="size-4 text-gray-600" />
            </motion.div>
          )}

          {node.type === 'folder' && (!hasChildren) && <div className="size-4" />}

          <div className="flex items-center gap-2 flex-1">
            {getFileIcon(node)}
            <span className="text-sm text-bolt-elements-textPrimary truncate">{node.name}</span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children!.map((child) => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto modern-scrollbar">
      {nodes.map((node) => renderNode(node))}
    </div>
  );
}
