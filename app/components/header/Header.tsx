import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { MenuToggle } from '~/components/sidebar/MenuToggle';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center px-4 h-[var(--header-height)] backdrop-blur-xl',
        'bg-bolt-elements-bg-depth-1/80 sticky top-0 z-50',
        {
          'border-b border-bolt-elements-borderColor': chat.started,
          'border-b border-transparent': !chat.started,
        },
      )}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <MenuToggle />
        <a href="/" className="flex items-center">
          <img src="/logo-light-styled.png" alt="logo" className="h-6 inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="h-6 inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-6 truncate text-center text-bolt-elements-textSecondary text-sm">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-1">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
