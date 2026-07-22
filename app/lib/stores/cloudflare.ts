import { atom } from 'nanostores';
import type { CloudflareConnection } from '~/types/cloudflare';
import { logStore } from './logs';
import { toast } from 'react-toastify';

// Auto-connect using environment variables
const envApiToken = import.meta.env?.VITE_CLOUDFLARE_API_TOKEN;
const envAccountId = import.meta.env?.VITE_CLOUDFLARE_ACCOUNT_ID;

// Initialize with stored connection or defaults
const storedConnection = typeof window !== 'undefined' ? localStorage.getItem('cloudflare_connection') : null;
let initialConnection: CloudflareConnection;

if (storedConnection) {
  try {
    const parsed = JSON.parse(storedConnection);

    if (!parsed.user && !parsed.apiToken && envApiToken && envAccountId) {
      console.log('Cloudflare store: Clearing incomplete saved connection, using env tokens');

      if (typeof window !== 'undefined') {
        localStorage.removeItem('cloudflare_connection');
      }

      initialConnection = {
        user: null,
        apiToken: envApiToken,
        accountId: envAccountId,
        stats: undefined,
      };
    } else {
      initialConnection = parsed;
    }
  } catch (error) {
    console.error('Error parsing saved Cloudflare connection:', error);
    initialConnection = {
      user: null,
      apiToken: envApiToken || '',
      accountId: envAccountId || '',
      stats: undefined,
    };
  }
} else {
  initialConnection = {
    user: null,
    apiToken: envApiToken || '',
    accountId: envAccountId || '',
    stats: undefined,
  };
}

export const cloudflareConnection = atom<CloudflareConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);

export const updateCloudflareConnection = (updates: Partial<CloudflareConnection>) => {
  const currentState = cloudflareConnection.get();
  const newState = { ...currentState, ...updates };
  cloudflareConnection.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('cloudflare_connection', JSON.stringify(newState));
  }
};

// Auto-connect using environment tokens
export async function autoConnectCloudflare() {
  console.log('autoConnectCloudflare called');

  if (!envApiToken || !envAccountId) {
    console.error('No Cloudflare API token or account ID found in environment');
    return {
      success: false,
      error: 'No Cloudflare credentials found in environment',
    };
  }

  try {
    console.log('Setting isConnecting to true');
    isConnecting.set(true);

    // Test the connection
    console.log('Making API call to Cloudflare');

    const response = await fetch('https://api.cloudflare.com/client/v4/user', {
      headers: {
        Authorization: `Bearer ${envApiToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Cloudflare API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    console.log('Cloudflare API response:', data);

    if (!data.success || !data.result) {
      throw new Error('Invalid Cloudflare API response');
    }

    const userData = data.result;

    // Update connection
    console.log('Updating Cloudflare connection');
    updateCloudflareConnection({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        account_id: envAccountId,
      },
      apiToken: envApiToken,
      accountId: envAccountId,
    });

    logStore.logInfo('Auto-connected to Cloudflare', {
      type: 'system',
      message: `Auto-connected to Cloudflare as ${userData.email}`,
    });

    // Fetch stats
    console.log('Fetching Cloudflare stats');
    await fetchCloudflareStats(envApiToken, envAccountId);

    console.log('Cloudflare auto-connection successful');

    return { success: true };
  } catch (error) {
    console.error('Failed to auto-connect to Cloudflare:', error);
    logStore.logError(
      `Cloudflare auto-connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        type: 'system',
        message: 'Cloudflare auto-connection failed',
      },
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    console.log('Setting isConnecting to false');
    isConnecting.set(false);
  }
}

export function initializeCloudflareConnection() {
  // Auto-connect using environment variables if available
  const token = import.meta.env?.VITE_CLOUDFLARE_API_TOKEN;
  const accountId = import.meta.env?.VITE_CLOUDFLARE_ACCOUNT_ID;

  if (token && accountId && !cloudflareConnection.get().apiToken) {
    updateCloudflareConnection({ apiToken: token, accountId });
    fetchCloudflareStats(token, accountId).catch(console.error);
  }
}

export const fetchCloudflareStatsViaAPI = fetchCloudflareStats;

export async function fetchCloudflareStats(token: string, accountId: string) {
  try {
    isFetchingStats.set(true);

    // Fetch pages projects
    const projectsResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projectsData = (await projectsResponse.json()) as any;

    if (!projectsData.success || !projectsData.result) {
      throw new Error('Invalid Cloudflare API response');
    }

    const projects = projectsData.result || [];

    // Fetch latest deployments for each project
    const projectsWithDeployments = await Promise.all(
      projects.map(async (project: any) => {
        try {
          const deploymentsResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project.name}/deployments?limit=1`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (deploymentsResponse.ok) {
            const deploymentsData = (await deploymentsResponse.json()) as any;
            return {
              ...project,
              latest_deployments: deploymentsData.result || [],
            };
          }

          return project;
        } catch (error) {
          console.error(`Error fetching deployments for project ${project.name}:`, error);
          return project;
        }
      }),
    );

    const currentState = cloudflareConnection.get();
    updateCloudflareConnection({
      ...currentState,
      stats: {
        projects: projectsWithDeployments,
        totalProjects: projectsWithDeployments.length,
      },
    });
  } catch (error) {
    console.error('Cloudflare API Error:', error);
    logStore.logError('Failed to fetch Cloudflare stats', { error });
    toast.error('Failed to fetch Cloudflare Pages projects');
  } finally {
    isFetchingStats.set(false);
  }
}
