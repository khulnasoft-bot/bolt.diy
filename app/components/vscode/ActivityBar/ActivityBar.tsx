import { motion } from 'framer-motion';
import {
  MdExplore,
  MdSearch,
  MdSourceControl,
  MdBugReport,
  MdExtension,
  MdSettings,
} from 'react-icons/md';
import { classNames } from '~/utils/classNames';

export type ActivityBarItem = 'explorer' | 'search' | 'source-control' | 'debug' | 'extensions' | 'settings';

interface ActivityBarProps {
  activeItem?: ActivityBarItem;
  onItemClick: (item: ActivityBarItem) => void;
  unreadCounts?: Record<string, number>;
}

const ACTIVITY_ITEMS: Array<{
  id: ActivityBarItem;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
}> = [
  {
    id: 'explorer',
    icon: <MdExplore className="size-6" />,
    label: 'Explorer',
    tooltip: 'Explorer (Ctrl+Shift+E)',
  },
  {
    id: 'search',
    icon: <MdSearch className="size-6" />,
    label: 'Search',
    tooltip: 'Search (Ctrl+Shift+F)',
  },
  {
    id: 'source-control',
    icon: <MdSourceControl className="size-6" />,
    label: 'Source Control',
    tooltip: 'Source Control (Ctrl+Shift+G)',
  },
  {
    id: 'debug',
    icon: <MdBugReport className="size-6" />,
    label: 'Run & Debug',
    tooltip: 'Run & Debug (Ctrl+Shift+D)',
  },
  {
    id: 'extensions',
    icon: <MdExtension className="size-6" />,
    label: 'Extensions',
    tooltip: 'Extensions (Ctrl+Shift+X)',
  },
];

export function ActivityBar({ activeItem, onItemClick, unreadCounts = {} }: ActivityBarProps) {
  return (
    <div className="flex flex-col items-center gap-2 h-full w-16 bg-bolt-elements-background-depth-1 border-r border-bolt-elements-borderColor py-4">
      {/* Activity Items */}
      {ACTIVITY_ITEMS.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={classNames(
            'relative flex items-center justify-center w-12 h-12 rounded transition-colors group',
            activeItem === item.id
              ? 'text-blue-500 bg-bolt-elements-background-depth-2'
              : 'text-gray-600 hover:text-gray-400 hover:bg-bolt-elements-background-depth-2',
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={item.tooltip}
        >
          {item.icon}

          {/* Unread Count Badge */}
          {unreadCounts[item.id] && unreadCounts[item.id] > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
            </motion.span>
          )}

          {/* Active Indicator */}
          {activeItem === item.id && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
          )}

          {/* Hover Label */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {item.label}
          </div>
        </motion.button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings Button */}
      <motion.button
        onClick={() => onItemClick('settings')}
        className={classNames(
          'flex items-center justify-center w-12 h-12 rounded transition-colors group',
          activeItem === 'settings'
            ? 'text-blue-500 bg-bolt-elements-background-depth-2'
            : 'text-gray-600 hover:text-gray-400 hover:bg-bolt-elements-background-depth-2',
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Settings (Ctrl+,)"
      >
        <MdSettings className="size-6" />

        {/* Active Indicator */}
        {activeItem === 'settings' && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        )}

        {/* Hover Label */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Settings
        </div>
      </motion.button>
    </div>
  );
}
