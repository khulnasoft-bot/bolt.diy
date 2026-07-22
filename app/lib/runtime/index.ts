/**
 * Runtime abstraction layer
 * Provides unified interface for runtime-specific functionality
 */

export { createRuntimeAdapter, detectRuntime, getRuntimeAdapter, setRuntimeAdapter } from './adapter';
export type { RuntimeAdapter, RuntimeContext } from './adapter';

export { getServerEnv, getEnvVar, hasEnvVar, requireEnvVar } from './env';

export * from './remix';
