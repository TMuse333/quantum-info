/**
 * Production Deployment Filter - WHITELIST APPROACH
 *
 * Philosophy: ONLY explicitly allowed files are deployed to production.
 * Everything else is automatically excluded by default.
 *
 * This prevents accidental deployment of editor/admin/dashboard code.
 */

export interface FilterResult {
  include: boolean;
  reason?: string;
}

/**
 * WHITELIST: Paths that ARE allowed in production
 * Only these files/folders will be deployed
 */
const PRODUCTION_WHITELIST = [
  // ===== PRODUCTION COMPONENTS =====
  /^frontend\/src\/components\/designs\//,           // Production component library
  /^frontend\/src\/components\/pageComponents\//,    // Page rendering components

  // ===== PRODUCTION APP ROUTES =====
  /^frontend\/src\/app\/\[slug\]\//,                 // Dynamic page routes
  /^frontend\/src\/app\/page\.tsx$/,                 // Homepage
  /^frontend\/src\/app\/layout\.tsx$/,               // Root layout
  /^frontend\/src\/app\/not-found\.tsx$/,            // 404 page
  /^frontend\/src\/app\/error\.tsx$/,                // Error page
  /^frontend\/src\/app\/global\.css$/,               // Global styles
  /^frontend\/src\/app\/globals\.css$/,              // Global styles (alternative name)

  // ===== LIBRARIES & UTILITIES =====
  /^frontend\/src\/lib\/colorUtils/,                 // Color utilities
  /^frontend\/src\/lib\/hooks\/isMobile\.ts$/,       // Mobile detection hook

  // ===== TYPES (PRODUCTION ONLY) =====
  /^frontend\/src\/types\/colors\.ts$/,
  /^frontend\/src\/types\/componentTypes\.ts$/,
  /^frontend\/src\/types\/forms\.ts$/,
  /^frontend\/src\/types\/navbar\.ts$/,
  /^frontend\/src\/types\/index\.ts$/,               // Production-safe types index

  // ===== CONFIG FILES =====
  /^frontend\/package\.json$/,
  /^frontend\/package-lock\.json$/,
  /^frontend\/next\.config\.(ts|js|mjs)$/,
  /^frontend\/tsconfig\.json$/,
  /^frontend\/tailwind\.config\.(ts|js)$/,
  /^frontend\/postcss\.config\.(js|mjs)$/,
  /^frontend\/\.nvmrc$/,
  /^frontend\/vercel\.json$/,

  // ===== PUBLIC ASSETS =====
  /^frontend\/public\//,

  // ===== Alternative paths (in case frontend/ prefix is missing) =====
  /^src\/components\/designs\//,
  /^src\/components\/pageComponents\//,
  /^src\/app\/\[slug\]\//,
  /^src\/app\/page\.tsx$/,
  /^src\/app\/layout\.tsx$/,
  /^src\/lib\/colorUtils/,
  /^src\/lib\/hooks\/isMobile\.ts$/,
];

/**
 * BLACKLIST: Paths that are NEVER allowed (extra safety)
 * Even if they match whitelist, they'll be excluded
 */
const PRODUCTION_BLACKLIST = [
  // ===== EDITOR & ADMIN =====
  /\/editor\//,
  /\/admin\//,
  /\/dashboard\//,                    // Client dashboard (editor-only)

  // ===== API ROUTES (ALL) =====
  /\/api\//,

  // ===== DATABASE & MODELS =====
  /\/models\//,                       // Database models
  /\/db\//,                           // Database utilities

  // ===== DEPLOYMENT & BUILD =====
  /\/deploy\//,
  /\/vercel\//,
  /\/production\//,
  /\/deployment\//,

  // ===== STORES & STATE MANAGEMENT =====
  /\/stores\//,                       // Zustand stores (editor-only)

  // ===== ANALYTICS & TRACKING =====
  /\/analytics\//,                    // Analytics system
  /\/tracking\//,                     // Tracking utilities

  // ===== TYPES (EDITOR-ONLY) =====
  /websiteDataTypes\.ts$/,
  /templateTypes\.ts$/,
  /llmOutputs\.ts$/,
  /user\.ts$/,
  /website\.ts$/,
  /helperBot\.ts$/,
  /usage\.ts$/,
  /\/registry\//,

  // ===== DOCS & SCRIPTS =====
  /^docs\//,
  /^scripts\//,
  /README\.md$/,
  /\.md$/,                            // All markdown files

  // ===== TESTS =====
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__\//,
  /test-.*\.ts$/,

  // ===== BUILD ARTIFACTS =====
  /\.next\//,
  /node_modules\//,
  /\.git\//,
  /\.vercel\//,

  // ===== ENV & SECRETS =====
  /\.env/,

  // ===== EDITOR COMPONENTS (Edit versions) =====
  /Edit\.tsx$/,                       // All *Edit.tsx files
  /\.edit\.tsx$/,                     // All *.edit.tsx files
];

/**
 * Check if a file should be included in production
 *
 * Logic:
 * 1. Check blacklist first (explicit exclusions)
 * 2. Check whitelist (only these are allowed)
 * 3. Default: EXCLUDE (safest approach)
 */
export function shouldIncludeInProduction(filePath: string): FilterResult {
  const normalizedPath = filePath.replace(/^\.\//, '');

  // STEP 1: Check blacklist (never include these)
  for (const pattern of PRODUCTION_BLACKLIST) {
    if (pattern.test(normalizedPath)) {
      return {
        include: false,
        reason: `Blacklisted: ${pattern.toString()}`,
      };
    }
  }

  // STEP 2: Check whitelist (only these are allowed)
  for (const pattern of PRODUCTION_WHITELIST) {
    if (pattern.test(normalizedPath)) {
      return {
        include: true,
        reason: `Whitelisted for production`,
      };
    }
  }

  // STEP 3: Default - EXCLUDE
  // If a file isn't explicitly whitelisted, don't deploy it
  return {
    include: false,
    reason: 'Not in production whitelist (safe by default)',
  };
}

/**
 * Filter files for production deployment
 */
export function filterFilesForProduction<T extends { path: string }>(
  files: T[]
): {
  included: T[];
  excluded: T[];
  stats: {
    total: number;
    included: number;
    excluded: number;
  };
} {
  const included: T[] = [];
  const excluded: T[] = [];

  for (const file of files) {
    const result = shouldIncludeInProduction(file.path);

    if (result.include) {
      included.push(file);
    } else {
      excluded.push(file);
    }
  }

  return {
    included,
    excluded,
    stats: {
      total: files.length,
      included: included.length,
      excluded: excluded.length,
    },
  };
}

/**
 * Log filtering results
 */
export function logFilterResults(stats: {
  total: number;
  included: number;
  excluded: number;
}): void {
  console.log('\n📊 [PRODUCTION FILTER] Results:');
  console.log(`   Total files: ${stats.total}`);
  console.log(`   ✅ Included: ${stats.included}`);
  console.log(`   ⊗ Excluded: ${stats.excluded}`);
  console.log(`   📦 Deployment size: ${((stats.included / stats.total) * 100).toFixed(1)}% of original\n`);
}
