/**
 * Editorial/Editor Types
 *
 * This file exports ALL types used in the editor/editorial environment.
 * It includes both production types and editor-only types.
 *
 * Use this for editor components:
 *   import { SomeType } from '@/types/editorial'
 *
 * Production code should use:
 *   import { SomeType } from '@/types'
 */

// Production types (re-exported from index)
export * from './index'

// Editor-only types
export * from './helperBot'
export * from './llmOutputs'
export * from './templateTypes'
export * from './usage'
export * from './user'
export * from './website'

