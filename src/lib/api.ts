/**
 * @deprecated
 * This file is a backward-compatibility barrel.
 * The implementation has been split into focused modules under lib/api/.
 *
 * New code should import directly from '@/lib/api' (resolved to lib/api/index.ts).
 * This file exists so that relative imports like `from "./api"` (e.g. in api.test.ts)
 * continue to resolve correctly alongside the lib/api/ directory.
 *
 * DO NOT add new exports here. Add them to lib/api/index.ts instead.
 */

export * from "./api/index";
