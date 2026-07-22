import { MdCheckCircle, MdWarning, MdError, MdDataSaverOn } from 'react-icons/md';
import { classNames } from '~/utils/classNames';

export interface StatusBarItem {
  id: string;
  label: string;
  tooltip?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  status?: 'info' | 'warning' | 'error' | 'success';
}

interface StatusBarProps {
  file?: {
    name: string;
    lines: number;
    columns: number;
    language: string;
    encoding: string;
    eol: 'LF' | 'CRLF';
    isDirty?: boolean;
  };
  problems?: {
    errors: number;
    warnings: number;
    info: number;
  };
  items?: StatusBarItem[];
  onItemClick?: (itemId: string) => void;
}

export function StatusBar({ file, problems = { errors: 0, warnings: 0, info: 0 }, items = [] }: StatusBarProps) {
  const hasProblems = problems.errors > 0 || problems.warnings > 0;
  const problemColor = problems.errors > 0 ? 'text-red-500' : problems.warnings > 0 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="flex items-center justify-between h-8 bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor px-3 text-xs text-gray-500 select-none">
      {/* Left Section - File Info */}
      <div className="flex items-center gap-4">
        {/* File Status */}
        {file && (
          <>
            {file.isDirty && (
              <div className="flex items-center gap-1" title="File has unsaved changes">
                <MdDataSaverOn className="size-4 text-yellow-500" />
              </div>
            )}

            {/* Language */}
            <button
              onClick={() => onItemClick?.('language')}
              className="hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Change language mode"
            >
              {file.language}
            </button>

            {/* Line/Column */}
            <button
              onClick={() => onItemClick?.('goto-line')}
              className="hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Go to Line"
            >
              Ln {file.columns}, Col {file.lines}
            </button>

            {/* Indentation */}
            <button
              onClick={() => onItemClick?.('indentation')}
              className="hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Change indentation"
            >
              Spaces: 2
            </button>

            {/* EOL */}
            <button
              onClick={() => onItemClick?.('eol')}
              className="hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Change end of line"
            >
              {file.eol}
            </button>

            {/* Encoding */}
            <button
              onClick={() => onItemClick?.('encoding')}
              className="hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Change encoding"
            >
              {file.encoding}
            </button>
          </>
        )}
      </div>

      {/* Right Section - Problems & Custom Items */}
      <div className="flex items-center gap-4">
        {/* Problems */}
        {hasProblems && (
          <button
            onClick={() => onItemClick?.('problems')}
            className={classNames(
              'flex items-center gap-1 hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors cursor-pointer',
              problemColor,
            )}
            title={`${problems.errors} errors, ${problems.warnings} warnings`}
          >
            {problems.errors > 0 && (
              <>
                <MdError className="size-4" />
                <span>{problems.errors}</span>
              </>
            )}
            {problems.warnings > 0 && (
              <>
                <MdWarning className="size-4" />
                <span>{problems.warnings}</span>
              </>
            )}
          </button>
        )}

        {/* Custom Items */}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className={classNames(
              'flex items-center gap-1 hover:bg-bolt-elements-background-depth-3 px-2 py-1 rounded transition-colors',
              item.status === 'error' && 'text-red-500',
              item.status === 'warning' && 'text-yellow-500',
              item.status === 'success' && 'text-green-500',
              item.status === 'info' && 'text-blue-500',
              !item.onClick && 'cursor-default',
              item.onClick && 'cursor-pointer',
            )}
            title={item.tooltip}
            disabled={!item.onClick}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
