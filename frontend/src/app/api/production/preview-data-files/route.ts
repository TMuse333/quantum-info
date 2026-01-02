/**
 * Preview Data Files API
 *
 * Generates .data.ts files from websiteData without deploying
 * Returns the file contents for debugging purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAllPageFiles } from '@/lib/deploy/generators/generatePageFiles';

interface PreviewRequest {
  websiteData: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: PreviewRequest = await request.json();
    const { websiteData } = body;

    if (!websiteData) {
      return NextResponse.json(
        { error: 'Invalid request: websiteData is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [PREVIEW] Generating .data.ts files for preview...');

    // DEBUG: Log websiteData being used for preview
    console.log('🔍 [DEBUG] WebsiteData received in preview API:');
    console.log('  - Pages:', Object.keys(websiteData.pages || {}).length);
    console.log('  - Current Version:', websiteData.currentVersionNumber);
    console.log('  - First page components:', websiteData.pages?.index?.components?.length || 0);
    if (websiteData.pages?.index?.components?.[0]) {
      console.log('  - First component type:', websiteData.pages.index.components[0].type);
      console.log('  - First component props keys:', Object.keys(websiteData.pages.index.components[0].props || {}));
    }

    // Generate all page files
    const seoMetadata: Record<string, any> = {};
    const allGeneratedFiles = generateAllPageFiles(websiteData, seoMetadata);

    // Filter to only include .data.ts files
    const dataFiles = allGeneratedFiles.filter(file => file.path.endsWith('.data.ts'));

    console.log(`✅ [PREVIEW] Generated ${dataFiles.length} .data.ts files for preview`);

    // Return file contents
    return NextResponse.json({
      success: true,
      files: dataFiles.map(file => ({
        path: file.path,
        content: file.content,
        size: file.content.length,
      })),
      totalFiles: dataFiles.length,
      websiteDataPages: Object.keys(websiteData.pages || {}).length,
    });
  } catch (error: any) {
    console.error('❌ [PREVIEW] Error generating preview:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate preview',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
