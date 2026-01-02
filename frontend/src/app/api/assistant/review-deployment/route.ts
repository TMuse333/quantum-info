/**
 * Code Review API
 *
 * Reviews generated deployment files for errors and issues.
 * Uses OpenAI to analyze TypeScript/React code.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_KEY,
}) : null;

interface GeneratedFile {
  path: string;
  content: string;
}

interface ReviewResult {
  approved: boolean;
  issues: string[];
  suggestions: string[];
  fileReviews?: Record<string, FileReview>;
}

interface FileReview {
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

const MAX_FILE_SIZE = 50000; // chars - truncate if larger to avoid token limits

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const files: GeneratedFile[] = body.files || [];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: files array is required' },
        { status: 400 }
      );
    }

    // Skip review if OpenAI API key is not available
    if (!openai || !process.env.OPENAI_KEY) {
      console.log('⚠️  [CODE REVIEW] Skipping - OPENAI_KEY not set');
      return NextResponse.json({
        approved: true,
        issues: [],
        suggestions: [],
        skipped: true,
        reason: 'OpenAI API key not configured'
      });
    }

    console.log(`🔍 Reviewing ${files.length} files...`);

    // Prepare files for review (truncate if needed)
    const filesToReview = files.map((file) => ({
      path: file.path,
      content:
        file.content.length > MAX_FILE_SIZE
          ? file.content.substring(0, MAX_FILE_SIZE) + '\n// ... (truncated)'
          : file.content,
      truncated: file.content.length > MAX_FILE_SIZE,
    }));

    // Create review prompt
    const prompt = `You are an expert TypeScript/React code reviewer. Review the following generated production deployment files for a Next.js 14 application.

FILES TO REVIEW:
${filesToReview
  .map(
    (file) => `
=== ${file.path} ===
${file.content}
${file.truncated ? '\n(File was truncated due to length)' : ''}
`
  )
  .join('\n')}

CRITICAL ERRORS ONLY (These should fail the review):

1. **Syntax Errors** - Code that won't compile or run
   - Missing closing braces, brackets, or parentheses
   - Malformed JSX syntax
   - Invalid TypeScript syntax

2. **Missing Required Imports** - Imports needed for code to work
   - Components used but not imported
   - Functions/utilities used but not imported
   - IGNORE: Unused imports are fine

3. **Missing Required Exports** - Exports needed by Next.js
   - Missing default export for page component
   - Missing metadata export (if referenced)

4. **Type Errors** - Only if they would cause compilation failure
   - Passing wrong type to a function that would break
   - Using undefined properties that would crash

EXPLICITLY IGNORE (These are NOT errors and should NOT fail the review):

❌ DO NOT FLAG THESE AS ERRORS:
1. "Duplicate property 'images.main' in component1Props and component2Props" - IGNORE THIS
   - Different objects can have same property names
   - This is valid TypeScript and will compile fine

2. "Incomplete URL in openGraph images" - IGNORE THIS
   - OpenGraph metadata is optional
   - Missing/placeholder URLs won't cause runtime errors
   - This is SEO metadata, not critical code

3. "Duplicate image URLs" - IGNORE THIS
   - Multiple components can use the same image
   - This is intentional and valid

4. Any styling, formatting, or performance suggestions - IGNORE THESE
   - Only flag actual compilation/runtime errors

WHAT SHOULD FAIL THE REVIEW (ONLY THESE):
✅ Missing closing braces/brackets that prevent compilation
✅ Components used but not imported (e.g., using <Hero /> but no import)
✅ Missing required default export in page files
✅ Syntax errors that would crash TypeScript compiler

RESPONSE FORMAT:

Return ONLY a valid JSON object:
{
  "approved": true,     // ALWAYS true unless code literally won't compile
  "issues": [],         // ONLY syntax errors that prevent compilation
  "suggestions": [      // Put duplicate props, URLs, etc. here (not in issues)
    "file.tsx: Optional suggestion"
  ]
}

CRITICAL INSTRUCTION:
- If the code will compile with tsc and run with next build, return approved: true
- Duplicate properties across different objects = NOT AN ERROR = approved: true
- Incomplete metadata URLs = NOT AN ERROR = approved: true
- Return approved: false ONLY if TypeScript compilation would fail`;

    // Call OpenAI API
    console.log('🤖 Analyzing code with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 is best for code review
      messages: [
        {
          role: 'system',
          content:
            'You are an expert TypeScript and React code reviewer. Analyze code for errors, issues, and improvements. Return only valid JSON, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent/factual review
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('OpenAI returned empty response');
    }

    // Parse the JSON response
    let reviewResult: ReviewResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      reviewResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate response structure
    if (typeof reviewResult.approved !== 'boolean') {
      reviewResult.approved = false;
    }
    if (!Array.isArray(reviewResult.issues)) {
      reviewResult.issues = [];
    }
    if (!Array.isArray(reviewResult.suggestions)) {
      reviewResult.suggestions = [];
    }

    // Log results
    if (reviewResult.approved) {
      console.log('✅ Code review passed!');
      if (reviewResult.suggestions.length > 0) {
        console.log(`⚠️  ${reviewResult.suggestions.length} suggestions for improvement`);
      }
    } else {
      console.log(`❌ Code review failed with ${reviewResult.issues.length} issues`);
    }

    return NextResponse.json({
      success: true,
      ...reviewResult,
      filesReviewed: files.length,
      truncatedFiles: filesToReview.filter((f) => f.truncated).length,
    });
  } catch (error: any) {
    console.error('Code review error:', error);
    return NextResponse.json(
      {
        error: 'Failed to review deployment files',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
