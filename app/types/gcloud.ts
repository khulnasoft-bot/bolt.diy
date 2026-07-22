/**
 * Google Cloud Deploy type definitions
 * Supports both Cloud Storage (static hosting) and Cloud Run (containerized) deployments
 */

export interface GCloudUser {
  id: string;
  email: string;
  display_name?: string;
  project_id: string;
}

export interface GCloudProject {
  name: string;
  project_id: string;
  project_number: string;
}

export interface GCloudStorageDeploy {
  type: 'storage';
  bucket_name: string;
  bucket_location: string;
  deployed_files: number;
  deployment_time: string;
  public_url: string;
}

export interface GCloudRunDeploy {
  type: 'cloud-run';
  service_name: string;
  region: string;
  container_image: string;
  traffic_percent: number;
  service_url: string;
  deployment_time: string;
  status: 'READY' | 'DEPLOYING' | 'ERROR';
}

export type GCloudDeploy = GCloudStorageDeploy | GCloudRunDeploy;

export interface GCloudStats {
  projects: GCloudProject[];
  deployments: GCloudDeploy[];
  totalDeployments: number;
}

export interface GCloudConnection {
  user: GCloudUser | null;
  serviceAccountKey?: Record<string, unknown>;
  apiKey?: string;
  projectId: string;
  stats?: GCloudStats;
}

export interface GCloudProjectInfo {
  projectId: string;
  projectName: string;
  url: string;
  chatId: string;
  deploymentType: 'storage' | 'cloud-run';
}
