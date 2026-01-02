/**
 * Quick test for production filter
 * Run with: npx ts-node src/lib/deploy/__test-filter.ts
 */

import { shouldIncludeInProduction, filterFilesForProduction } from './production-filter';

// Test files
const testFiles = [
  // Should be EXCLUDED
  { path: 'src/app/api/assistant/chat/route.ts', expected: false },
  { path: 'src/app/api/knowledge/search/route.ts', expected: false },
  { path: 'src/app/api/production/deploy/route.ts', expected: false },
  { path: 'src/app/editor/page.tsx', expected: false },
  { path: 'src/components/editor/Dashboard.tsx', expected: false },
  { path: 'src/lib/deploy/git-operations.ts', expected: false },
  { path: 'src/lib/vercel/vercel-client.ts', expected: false },
  { path: 'src/stores/deploymentHistoryStore.ts', expected: false },
  { path: 'docs/README.md', expected: false },
  { path: 'scripts/deploy.sh', expected: false },

  // Should be INCLUDED
  { path: 'src/app/page.tsx', expected: true },
  { path: 'src/app/about/page.tsx', expected: true },
  { path: 'src/components/Navbar.tsx', expected: true },
  { path: 'src/lib/utils.ts', expected: true },
  { path: 'package.json', expected: true },
  { path: 'next.config.ts', expected: true },
  { path: 'tailwind.config.ts', expected: true },
  { path: 'public/logo.png', expected: true },
];

console.log('\n🧪 Testing Production Filter\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

for (const test of testFiles) {
  const result = shouldIncludeInProduction(test.path);
  const status = result.include === test.expected ? '✅ PASS' : '❌ FAIL';

  if (result.include === test.expected) {
    passed++;
  } else {
    failed++;
    console.log(`${status} | ${test.path}`);
    console.log(`  Expected: ${test.expected ? 'INCLUDE' : 'EXCLUDE'}`);
    console.log(`  Got: ${result.include ? 'INCLUDE' : 'EXCLUDE'}`);
    console.log(`  Reason: ${result.reason}\n`);
  }
}

console.log('=' .repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All tests passed!\n');
} else {
  console.log(`❌ ${failed} test(s) failed\n`);
  process.exit(1);
}

// Test batch filtering
console.log('\n🔍 Testing Batch Filter\n');
const mockFiles = [
  { path: 'src/app/page.tsx', content: '' },
  { path: 'src/app/api/assistant/route.ts', content: '' },
  { path: 'src/components/Button.tsx', content: '' },
  { path: 'src/lib/deploy/utils.ts', content: '' },
];

const filtered = filterFilesForProduction(mockFiles);
console.log(`Input: ${filtered.stats.total} files`);
console.log(`Included: ${filtered.stats.included} files`);
console.log(`Excluded: ${filtered.stats.excluded} files`);
console.log(`\nIncluded files:`);
filtered.included.forEach(f => console.log(`  ✅ ${f.path}`));
console.log(`\nExcluded files:`);
filtered.excluded.forEach(f => console.log(`  ⊗ ${f.path}`));
console.log();
