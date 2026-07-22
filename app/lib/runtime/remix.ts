/**
 * Remix imports abstraction layer
 * Re-exports common Remix utilities to ease migration across runtimes
 *
 * Usage:
 * - Replace: import { json } from '@remix-run/node'
 * - With:    import { json } from '~/lib/runtime/remix'
 *
 * At build time, this module can be aliased to @remix-run/node or @remix-run/cloudflare
 * or dynamically resolved based on build target.
 */

/*
 * Re-export common utilities from @remix-run/cloudflare as default
 * These are runtime-agnostic and work on both CF and Node.js
 */
export { json, redirect, redirectDocument } from '@remix-run/node';

// Re-export types
export type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
  LinksFunction,
} from '@remix-run/node';

// Re-export request/response utilities
export { isRouteErrorResponse } from '@remix-run/react';

/*
 * Future: Can add build-time conditional exports in package.json
 * "exports": {
 *   "./remix": {
 *     "cloudflare": "./app/lib/runtime/remix-cloudflare.ts",
 *     "node": "./app/lib/runtime/remix-node.ts"
 *   }
 * }
 */
