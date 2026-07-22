import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { useFeatures } from '~/lib/hooks/useFeatures';
import { useNotifications } from '~/lib/hooks/useNotifications';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { tabConfigurationStore, resetTabConfiguration } from '~/lib/stores/settings';
import { profileStore } from '~/lib/stores/profile';
import type { TabType, Profile } from './types';
import { DEFAULT_TAB_CONFIG } from './constants';
import { DialogTitle } from '~/components/ui/Dialog';
import { AvatarDropdown } from './AvatarDropdown';

// Import all tab components
import ProfileTab from '~/components/@settings/tabs/profile/ProfileTab';
import SettingsTab from '~/components/@settings/tabs/settings/SettingsTab';
import NotificationsTab from '~/components/@settings/tabs/notifications/NotificationsTab';
import FeaturesTab from '~/components/@settings/tabs/features/FeaturesTab';
import { DataTab } from '~/components/@settings/tabs/data/DataTab';
import { EventLogsTab } from '~/components/@settings/tabs/event-logs/EventLogsTab';
import GitHubTab from '~/components/@settings/tabs/github/GitHubTab';
import GitLabTab from '~/components/@settings/tabs/gitlab/GitLabTab';
import SupabaseTab from '~/components/@settings/tabs/supabase/SupabaseTab';
import VercelTab from '~/components/@settings/tabs/vercel/VercelTab';
import NetlifyTab from '~/components/@settings/tabs/netlify/NetlifyTab';
import CloudProvidersTab from '~/components/@settings/tabs/providers/cloud/CloudProvidersTab';
import LocalProvidersTab from '~/components/@settings/tabs/providers/local/LocalProvidersTab';
import McpTab from '~/components/@settings/tabs/mcp/McpTab';

interface ControlPanelProps {
  open: boolean;
  onClose: () => void;
}

type CategoryId = 'general' | 'providers' | 'connections' | 'deploy' | 'data' | 'about';

interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  tabs: { id: TabType; label: string }[];
}

const CATEGORIES: Category[] = [
  {
    id: 'general',
    label: 'General',
    icon: 'i-ph:gear-six',
    tabs: [
      { id: 'settings', label: 'Settings' },
      { id: 'profile', label: 'Profile' },
    ],
  },
  {
    id: 'providers',
    label: 'Providers',
    icon: 'i-ph:cloud',
    tabs: [
      { id: 'cloud-providers', label: 'Cloud Providers' },
      { id: 'local-providers', label: 'Local Providers' },
      { id: 'mcp', label: 'MCP Servers' },
    ],
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: 'i-ph:link',
    tabs: [
      { id: 'github', label: 'GitHub' },
      { id: 'gitlab', label: 'GitLab' },
      { id: 'supabase', label: 'Supabase' },
    ],
  },
  {
    id: 'deploy',
    label: 'Deploy',
    icon: 'i-ph:rocket-launch',
    tabs: [
      { id: 'vercel', label: 'Vercel' },
      { id: 'netlify', label: 'Netlify' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'i-ph:database',
    tabs: [
      { id: 'data', label: 'Data Management' },
      { id: 'event-logs', label: 'Event Logs' },
      { id: 'features', label: 'Features' },
      { id: 'notifications', label: 'Notifications' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    icon: 'i-ph:info',
    tabs: [],
  },
];

export const ControlPanel = ({ open, onClose }: ControlPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);

  const tabConfiguration = useStore(tabConfigurationStore);
  const profile = useStore(profileStore) as Profile;

  const { hasNewFeatures, unviewedFeatures, acknowledgeAllFeatures } = useFeatures();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { acknowledgeIssue } = useConnectionStatus();

  const baseTabConfig = useMemo(() => {
    return new Map(DEFAULT_TAB_CONFIG.map((tab) => [tab.id, tab]));
  }, []);

  const visibleTabs = useMemo(() => {
    if (!tabConfiguration?.userTabs || !Array.isArray(tabConfiguration.userTabs)) {
      resetTabConfiguration();
      return [];
    }

    const notificationsDisabled = profile?.preferences?.notifications === false;

    return tabConfiguration.userTabs
      .filter((tab) => {
        if (!tab?.id) {
          return false;
        }

        if (tab.id === 'notifications' && notificationsDisabled) {
          return false;
        }

        return tab.visible && tab.window === 'user';
      })
      .sort((a, b) => a.order - b.order);
  }, [tabConfiguration, profile?.preferences?.notifications, baseTabConfig]);

  const visibleTabIds = useMemo(() => new Set(visibleTabs.map((t) => t.id)), [visibleTabs]);

  useEffect(() => {
    if (!open) {
      setActiveTab(null);
      setActiveCategory(null);
    }
  }, [open]);

  const handleClose = () => {
    setActiveTab(null);
    setActiveCategory(null);
    onClose();
  };

  const handleCategoryClick = (categoryId: CategoryId) => {
    if (categoryId === 'about') {
      setActiveCategory(categoryId);
      setActiveTab(null);

      return;
    }

    const category = CATEGORIES.find((c) => c.id === categoryId);

    if (!category) {
      return;
    }

    const firstVisibleTab = category.tabs.find((t) => visibleTabIds.has(t.id));

    setActiveCategory(categoryId);
    setActiveTab(firstVisibleTab?.id || null);
  };

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);

    switch (tabId) {
      case 'features':
        acknowledgeAllFeatures();
        break;
      case 'notifications':
        markAllAsRead();
        break;
      case 'github':
      case 'gitlab':
      case 'supabase':
      case 'vercel':
      case 'netlify':
        acknowledgeIssue();
        break;
    }
  };

  const getTabComponent = (tabId: TabType) => {
    switch (tabId) {
      case 'profile':
        return <ProfileTab />;
      case 'settings':
        return <SettingsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'features':
        return <FeaturesTab />;
      case 'data':
        return <DataTab />;
      case 'cloud-providers':
        return <CloudProvidersTab />;
      case 'local-providers':
        return <LocalProvidersTab />;
      case 'github':
        return <GitHubTab />;
      case 'gitlab':
        return <GitLabTab />;
      case 'supabase':
        return <SupabaseTab />;
      case 'vercel':
        return <VercelTab />;
      case 'netlify':
        return <NetlifyTab />;
      case 'event-logs':
        return <EventLogsTab />;
      case 'mcp':
        return <McpTab />;
      default:
        return null;
    }
  };

  const getTabBadge = (tabId: TabType): string | null => {
    switch (tabId) {
      case 'features':
        return hasNewFeatures ? `${unviewedFeatures.length}` : null;
      case 'notifications':
        return hasUnreadNotifications ? `${unreadNotifications.length}` : null;
      default:
        return null;
    }
  };

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory);
  const currentTab = activeTab ? getTabComponent(activeTab) : null;

  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <RadixDialog.Overlay className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" />

          <RadixDialog.Content
            aria-describedby={undefined}
            onEscapeKeyDown={handleClose}
            onPointerDownOutside={handleClose}
            className="relative z-[101]"
          >
            <div
              className={classNames(
                'w-[960px] h-[640px]',
                'bg-bolt-elements-bg-depth-1',
                'rounded-xl shadow-2xl',
                'border border-bolt-elements-borderColor',
                'flex overflow-hidden',
                'transform transition-all duration-200 ease-out',
                open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4',
              )}
            >
              {/* Sidebar */}
              <div className="w-[200px] shrink-0 border-r border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2 flex flex-col">
                <div className="px-4 py-3 border-b border-bolt-elements-borderColor">
                  <DialogTitle className="text-sm font-semibold text-bolt-elements-textPrimary">Settings</DialogTitle>
                </div>

                <nav className="flex-1 py-2 overflow-y-auto">
                  {CATEGORIES.map((category) => {
                    const hasVisibleTabs =
                      category.id === 'about' || category.tabs.some((t) => visibleTabIds.has(t.id));

                    if (!hasVisibleTabs) {
                      return null;
                    }

                    const isActive = activeCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={classNames(
                          'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400 font-medium'
                            : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive hover:text-bolt-elements-textPrimary',
                        )}
                      >
                        <div className={classNames(category.icon, 'w-4 h-4')} />
                        {category.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="p-3 border-t border-bolt-elements-borderColor">
                  <div className="flex items-center gap-2">
                    <AvatarDropdown onSelectTab={handleTabClick} />
                    <button
                      onClick={handleClose}
                      className="ml-auto flex items-center justify-center w-7 h-7 rounded-md text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors"
                    >
                      <div className="i-ph:x text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Sub-tabs header */}
                {currentCategory && currentCategory.tabs.length > 0 && (
                  <div className="flex items-center gap-1 px-4 py-2 border-b border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1">
                    {currentCategory.tabs.map((tab) => {
                      if (!visibleTabIds.has(tab.id)) {
                        return null;
                      }

                      const isActive = activeTab === tab.id;
                      const badge = getTabBadge(tab.id);

                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={classNames(
                            'relative px-3 py-1.5 text-sm rounded-md transition-colors',
                            isActive
                              ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400 font-medium'
                              : 'text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive',
                          )}
                        >
                          {tab.label}
                          {badge && (
                            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium rounded-full bg-accent-500 text-white">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {currentTab ||
                    (activeCategory === 'about' ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="i-ph:info w-12 h-12 text-bolt-elements-textTertiary" />
                        <div>
                          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-1">OctoTask</h3>
                          <p className="text-sm text-bolt-elements-textTertiary">AI-powered development platform</p>
                          <p className="text-xs text-bolt-elements-textTertiary mt-2">Version 1.0.0</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <div className="i-ph:sidebar-simple w-12 h-12 text-bolt-elements-textTertiary" />
                        <p className="text-sm text-bolt-elements-textTertiary">Select a category from the sidebar</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
