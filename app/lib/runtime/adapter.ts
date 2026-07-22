/**
 * RuntimeAdapter - Abstract layer for runtime-specific functionality
 * Normalizes environment access and request handling across Cloudflare Workers and Node.js
 */

export interface RuntimeContext {
  /**
   * Environment variables for the current runtime
   */
  env: Record<string, string | undefined>;

  /**
   * Runtime type identifier
   */
  type: 'cloudflare' | 'node';

  /**
   * Raw Cloudflare context (only available on Cloudflare Workers)
   */
  cloudflare?: {
    env: Record<string, unknown>;
  };
}

/**
 * RuntimeAdapter interface - Normalize runtime-specific operations
 */
export interface RuntimeAdapter {
  /**
   * Get the current runtime type
   */
  getType(): 'cloudflare' | 'node';

  /**
   * Get environment variables from the current runtime
   */
  getEnv(): Record<string, string | undefined>;

  /**
   * Get a specific environment variable
   */
  getEnvVar(key: string): string | undefined;
}

/**
 * Cloudflare Workers adapter implementation
 */
export class CloudflareAdapter implements RuntimeAdapter {
  constructor(private _context: RuntimeContext) {}

  getType() {
    return 'cloudflare' as const;
  }

  getEnv(): Record<string, string | undefined> {
    // Normalize Cloudflare env to string map
    const env: Record<string, string | undefined> = {};
    const cfEnv = this._context.cloudflare?.env || this._context.env;

    for (const [key, value] of Object.entries(cfEnv)) {
      if (typeof value === 'string') {
        env[key] = value;
      } else if (typeof value === 'undefined' || value === null) {
        env[key] = undefined;
      } else {
        env[key] = String(value);
      }
    }

    return env;
  }

  getEnvVar(key: string): string | undefined {
    const cfEnv = this._context.cloudflare?.env || this._context.env;
    const value = (cfEnv as Record<string, unknown>)[key];

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'undefined' || value === null) {
      return undefined;
    }

    return String(value);
  }
}

/**
 * Node.js adapter implementation
 */
export class NodeAdapter implements RuntimeAdapter {
  constructor(private _context: RuntimeContext) {}

  getType() {
    return 'node' as const;
  }

  getEnv(): Record<string, string | undefined> {
    return this._context.env;
  }

  getEnvVar(key: string): string | undefined {
    return this._context.env[key];
  }
}

/**
 * Detect current runtime and create appropriate adapter
 */
export function createRuntimeAdapter(context?: RuntimeContext): RuntimeAdapter {
  // If no context provided, detect from environment
  if (!context) {
    context = detectRuntime();
  }

  if (context.type === 'cloudflare') {
    return new CloudflareAdapter(context);
  } else {
    return new NodeAdapter(context);
  }
}

/**
 * Detect runtime from global scope
 */
export function detectRuntime(): RuntimeContext {
  const _global = globalThis as any;

  // Check if running in Node.js
  if (typeof _global.process !== 'undefined' && _global.process?.versions?.node) {
    return {
      type: 'node',
      env: process.env as Record<string, string | undefined>,
    };
  }

  // Check if running in Cloudflare Workers
  if (typeof _global.ENVIRONMENT !== 'undefined') {
    return {
      type: 'cloudflare',
      env: process.env as Record<string, string | undefined>,
      cloudflare: {
        env: _global.ENVIRONMENT as Record<string, unknown>,
      },
    };
  }

  // Default to Node.js
  return {
    type: 'node',
    env: typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {},
  };
}

/**
 * Global runtime adapter singleton
 */
let globalAdapter: RuntimeAdapter | null = null;

/**
 * Get or create the global runtime adapter
 */
export function getRuntimeAdapter(): RuntimeAdapter {
  if (!globalAdapter) {
    globalAdapter = createRuntimeAdapter();
  }

  return globalAdapter;
}

/**
 * Set the global runtime adapter (useful for testing)
 */
export function setRuntimeAdapter(adapter: RuntimeAdapter): void {
  globalAdapter = adapter;
}
