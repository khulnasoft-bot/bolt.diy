import { atom } from 'nanostores';
import type { GCloudConnection } from '~/types/gcloud';
import { logStore } from './logs';
import { toast } from 'react-toastify';

// Auto-connect using environment variables
const envApiKey = import.meta.env?.VITE_GCLOUD_API_KEY;
const envProjectId = import.meta.env?.VITE_GCLOUD_PROJECT_ID;

// Initialize with stored connection or defaults
const storedConnection = typeof window !== 'undefined' ? localStorage.getItem('gcloud_connection') : null;
let initialConnection: GCloudConnection;

if (storedConnection) {
  try {
    const parsed = JSON.parse(storedConnection);

    if (!parsed.user && !parsed.apiKey && envApiKey && envProjectId) {
      console.log('Google Cloud store: Clearing incomplete saved connection, using env credentials');

      if (typeof window !== 'undefined') {
        localStorage.removeItem('gcloud_connection');
      }

      initialConnection = {
        user: null,
        apiKey: envApiKey,
        projectId: envProjectId,
        stats: undefined,
      };
    } else {
      initialConnection = parsed;
    }
  } catch (error) {
    console.error('Error parsing saved Google Cloud connection:', error);
    initialConnection = {
      user: null,
      projectId: envProjectId || '',
      stats: undefined,
    };
  }
} else {
  initialConnection = {
    user: null,
    projectId: envProjectId || '',
    stats: undefined,
  };
}

export const gcloudConnection = atom<GCloudConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);

export const updateGCloudConnection = (updates: Partial<GCloudConnection>) => {
  const currentState = gcloudConnection.get();
  const newState = { ...currentState, ...updates };
  gcloudConnection.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('gcloud_connection', JSON.stringify(newState));
  }
};

// Auto-connect using environment credentials
export async function autoConnectGCloud() {
  console.log('autoConnectGCloud called');

  if (!envApiKey || !envProjectId) {
    console.error('No Google Cloud API key or project ID found in environment');
    return {
      success: false,
      error: 'No Google Cloud credentials found in environment',
    };
  }

  try {
    console.log('Setting isConnecting to true');
    isConnecting.set(true);

    // Test the connection by fetching projects
    console.log('Making API call to Google Cloud');

    const response = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects?key=${envApiKey}`);

    console.log('Google Cloud API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Google Cloud API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    console.log('Google Cloud API response:', data);

    if (!data.projects || data.projects.length === 0) {
      throw new Error('No projects found in Google Cloud');
    }

    // Find the target project or use the first one
    const targetProject = data.projects.find((p: any) => p.projectId === envProjectId) || data.projects[0];

    // Update connection
    console.log('Updating Google Cloud connection');
    updateGCloudConnection({
      user: {
        id: 'gcloud-user',
        email: 'unknown@google.com',
        project_id: targetProject.projectId,
      },
      apiKey: envApiKey,
      projectId: targetProject.projectId,
    });

    logStore.logInfo('Auto-connected to Google Cloud', {
      type: 'system',
      message: `Auto-connected to Google Cloud project: ${targetProject.projectId}`,
    });

    // Fetch stats
    console.log('Fetching Google Cloud stats');
    await fetchGCloudStats(envApiKey, targetProject.projectId);

    console.log('Google Cloud auto-connection successful');

    return { success: true };
  } catch (error) {
    console.error('Failed to auto-connect to Google Cloud:', error);
    logStore.logError(
      `Google Cloud auto-connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        type: 'system',
        message: 'Google Cloud auto-connection failed',
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

export function initializeGCloudConnection() {
  // Auto-connect using environment variables if available
  const apiKey = import.meta.env?.VITE_GCLOUD_API_KEY;
  const projectId = import.meta.env?.VITE_GCLOUD_PROJECT_ID;

  if (apiKey && projectId && !gcloudConnection.get().apiKey) {
    updateGCloudConnection({ apiKey, projectId });
    fetchGCloudStats(apiKey, projectId).catch(console.error);
  }
}

export const fetchGCloudStatsViaAPI = fetchGCloudStats;

export async function fetchGCloudStats(apiKey: string, projectId: string) {
  try {
    isFetchingStats.set(true);

    // Fetch Cloud Run services
    const runResponse = await fetch(
      `https://run.googleapis.com/v1/projects/${projectId}/locations/us-central1/services?key=${apiKey}`,
    );

    let services = [];

    if (runResponse.ok) {
      const runData = (await runResponse.json()) as any;
      services = runData.services || [];
    }

    // Fetch Storage buckets
    const storageResponse = await fetch(
      `https://storage.googleapis.com/storage/v1/b?project=${projectId}&key=${apiKey}`,
    );

    let buckets = [];

    if (storageResponse.ok) {
      const storageData = (await storageResponse.json()) as any;
      buckets = storageData.items || [];
    }

    const currentState = gcloudConnection.get();
    updateGCloudConnection({
      ...currentState,
      stats: {
        projects: [
          {
            name: projectId,
            project_id: projectId,
            project_number: '0', // Placeholder
          },
        ],
        deployments: [
          ...services.map((service: any) => ({
            type: 'cloud-run' as const,
            service_name: service.metadata?.name || 'Unknown',
            region: 'us-central1',
            container_image: service.spec?.template?.spec?.containers?.[0]?.image || 'Unknown',
            traffic_percent: 100,
            service_url: service.status?.url || '',
            deployment_time: service.metadata?.creationTimestamp || new Date().toISOString(),
            status: (service.status?.conditions?.[0]?.status === 'True' ? 'READY' : 'DEPLOYING') as any,
          })),
          ...buckets.map((bucket: any) => ({
            type: 'storage' as const,
            bucket_name: bucket.name,
            bucket_location: bucket.location || 'Unknown',
            deployed_files: bucket.metageneration || 0,
            deployment_time: bucket.timeCreated || new Date().toISOString(),
            public_url: `https://storage.googleapis.com/${bucket.name}`,
          })),
        ],
        totalDeployments: services.length + buckets.length,
      },
    });
  } catch (error) {
    console.error('Google Cloud API Error:', error);
    logStore.logError('Failed to fetch Google Cloud stats', { error });
    toast.error('Failed to fetch Google Cloud resources');
  } finally {
    isFetchingStats.set(false);
  }
}
