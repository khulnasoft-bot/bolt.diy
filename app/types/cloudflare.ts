/**
 * Cloudflare Pages type definitions
 * Follows the pattern established by Vercel and Netlify types
 */

export interface CloudflareUser {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  account_id: string;
}

export interface CloudflareDeployment {
  id: string;
  project_name: string;
  environment: 'production' | 'preview';
  status: 'success' | 'failure' | 'queued' | 'active';
  created_on: string;
  deployment_trigger?: {
    type: string;
    metadata?: Record<string, unknown>;
  };
  latest_stage?: {
    name: string;
    status: string;
    start_time: string;
    end_time: string;
    duration: number;
  };
  url?: string;
}

export interface CloudflareProject {
  id: string;
  name: string;
  created_on: string;
  production_branch: string;
  domains?: {
    name: string;
    zone_name_servers?: string[];
  }[];
  latest_deployments?: CloudflareDeployment[];
}

export interface CloudflareStats {
  projects: CloudflareProject[];
  totalProjects: number;
}

export interface CloudflareConnection {
  user: CloudflareUser | null;
  apiToken: string;
  accountId: string;
  stats?: CloudflareStats;
}

export interface CloudflareProjectInfo {
  id: string;
  name: string;
  url: string;
  chatId: string;
}
