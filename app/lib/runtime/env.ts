/**
 * Environment utilities - Unified environment variable access
 * Normalizes env access across Cloudflare Workers and Node.js
 */

import type { AppLoadContext } from '@remix-run/cloudflare';
import { getRuntimeAdapter } from './adapter';

/**
 * Get server environment variables
 * Implements 4-tier resolution chain (as per BaseProvider pattern):
 * 1. Cloudflare context env (CF Workers only)
 * 2. Node.js process.env
 * 3. Remix load context
 * 4. Fallback empty object
 */
export function getServerEnv(
  loadContext?: AppLoadContext,
  overrides?: Record<string, string>,
): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};

  // Tier 1: Runtime adapter (handles both CF and Node)
  const runtimeAdapter = getRuntimeAdapter();
  const runtimeEnv = runtimeAdapter.getEnv();
  Object.assign(env, runtimeEnv);

  // Tier 2: Remix load context (CF Workers specific)
  if (loadContext?.cloudflare?.env) {
    const cfEnv = loadContext.cloudflare.env;

    for (const [key, value] of Object.entries(cfEnv)) {
      if (typeof value === 'string') {
        env[key] = value;
      } else if (typeof value === 'undefined' || value === null) {
        env[key] = undefined;
      } else {
        env[key] = String(value);
      }
    }
  }

  // Tier 3: Explicit overrides
  if (overrides) {
    Object.assign(env, overrides);
  }

  return env;
}

/**
 * Get a specific environment variable with fallbacks
 */
export function getEnvVar(key: string, loadContext?: AppLoadContext, defaults?: string): string | undefined {
  // Try runtime adapter first
  const runtimeAdapter = getRuntimeAdapter();
  const value = runtimeAdapter.getEnvVar(key);

  if (value) {
    return value;
  }

  // Try Cloudflare context
  if (loadContext?.cloudflare?.env) {
    const cfValue = (loadContext.cloudflare.env as unknown as Record<string, unknown>)[key];

    if (cfValue) {
      return typeof cfValue === 'string' ? cfValue : String(cfValue);
    }
  }

  // Return default
  return defaults;
}

/**
 * Check if an environment variable exists
 */
export function hasEnvVar(key: string, loadContext?: AppLoadContext): boolean {
  const value = getEnvVar(key, loadContext);
  return Boolean(value);
}

/**
 * Require an environment variable (throw if missing)
 */
export function requireEnvVar(key: string, loadContext?: AppLoadContext): string {
  const value = getEnvVar(key, loadContext);

  if (!value) {
    throw new Error(`Required environment variable not found: ${key}`);
  }

  return value;
}
