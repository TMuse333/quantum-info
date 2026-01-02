/**
 * SEO Generation API (Batch)
 *
 * Generates SEO metadata for all pages using OpenAI API.
 * Analyzes page components and content to create optimized SEO.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SEOMetadata } from '@/types/website';

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_KEY,
}) : null;

interface PageComponent {
  id: string;
  type: string;
  props?: Record<string, any>;
}

interface WebsitePage {
  id?: string;
  name?: string;
  path?: string;
  components: PageComponent[];
}

interface WebsiteData {
  pages: Record<string, WebsitePage> | WebsitePage[];
  websiteName?: string;
  templateName?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const websiteData: WebsiteData = body.websiteData || body;

    if (!websiteData || !websiteData.pages) {
      return NextResponse.json(
        { error: 'Invalid request: websiteData.pages is required' },
        { status: 400 }
      );
    }

    // Skip SEO generation if OpenAI API key is not available
    if (!openai || !process.env.OPENAI_KEY) {
      console.log('⚠️  [SEO GEN] Skipping - OPENAI_KEY not set');
      return NextResponse.json({
        seoMetadata: {},
        skipped: true,
        reason: 'OpenAI API key not configured'
      });
    }

    // Convert pages to object format if array
    const pages = Array.isArray(websiteData.pages)
      ? websiteData.pages.reduce((acc, page, index) => {
          const slug = page.id || `page-${index}`;
          acc[slug] = page;
          return acc;
        }, {} as Record<string, WebsitePage>)
      : websiteData.pages;

    // Prepare data for SEO generation
    const pagesSummary = Object.entries(pages).map(([slug, page]) => {
      // Extract text content from components
      const componentsSummary = page.components.map((comp) => {
        const props = comp.props || {};
        return {
          type: comp.type,
          title: props.title || '',
          description: props.description || '',
          subTitle: props.subTitle || '',
          content: JSON.stringify(props).substring(0, 500), // Limit content
        };
      });

      return {
        slug,
        name: page.name || slug,
        path: page.path || `/${slug === 'index' ? '' : slug}`,
        components: componentsSummary,
      };
    });

    // Create prompt for OpenAI
    const prompt = `You are an SEO expert. Generate SEO metadata for each page of a website.

Website Name: ${websiteData.websiteName || websiteData.templateName || 'Website'}

Pages:
${JSON.stringify(pagesSummary, null, 2)}

For EACH page, generate optimized SEO metadata with:

1. **title** (50-60 characters)
   - Include primary keyword
   - Be compelling and clear
   - Include brand/site name if appropriate

2. **description** (150-160 characters)
   - Compelling call-to-action
   - Include relevant keywords naturally
   - Describe page value proposition

3. **keywords** (5-8 relevant keywords, comma-separated)
   - Based on page content and components
   - Mix of broad and specific terms
   - Relevant to the industry/topic

4. **openGraph** object:
   - title: Can be slightly different from page title, optimized for social sharing
   - description: Can be shorter/punchier than meta description
   - url: The page URL (use the path provided)
   - siteName: The website name
   - type: "website"
   - locale: "en_US"
   - images: Array with at least one image object (extract from components if available, or use placeholder)

Return ONLY a valid JSON object with this structure:
{
  "pageSlug": {
    "title": "...",
    "description": "...",
    "keywords": "...",
    "openGraph": {
      "title": "...",
      "description": "...",
      "url": "...",
      "siteName": "...",
      "type": "website",
      "locale": "en_US",
      "images": [
        {
          "url": "https://...",
          "width": 1200,
          "height": 630,
          "alt": "..."
        }
      ]
    },
    "icons": {
      "icon": ["/favicon.ico"]
    }
  }
}

IMPORTANT:
- Return ONLY the JSON object, no markdown, no explanations
- Include all pages provided
- Use actual content from components to create relevant SEO
- Make titles and descriptions compelling and unique for each page`;

    // Call OpenAI API
    console.log('🤖 Generating SEO metadata with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-4-turbo-preview' or 'gpt-3.5-turbo' for cost savings
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO specialist. Generate optimized, compelling SEO metadata based on website content. Return only valid JSON, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('OpenAI returned empty response');
    }

    // Parse the JSON response
    let seoMetadata: Record<string, SEOMetadata>;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      seoMetadata = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate that we got metadata for all pages
    const missingPages: string[] = [];
    Object.keys(pages).forEach((slug) => {
      if (!seoMetadata[slug]) {
        missingPages.push(slug);
      }
    });

    if (missingPages.length > 0) {
      console.warn(`Missing SEO metadata for pages: ${missingPages.join(', ')}`);
      // Generate default SEO for missing pages
      missingPages.forEach((slug) => {
        const page = pages[slug];
        seoMetadata[slug] = {
          title: page.name || slug.charAt(0).toUpperCase() + slug.slice(1),
          description: `${page.name || slug} page`,
          keywords: '',
          openGraph: {
            title: page.name || slug,
            description: `${page.name || slug} page`,
            url: page.path || `/${slug === 'index' ? '' : slug}`,
            siteName: websiteData.websiteName || 'Website',
            type: 'website',
            locale: 'en_US',
            images: [],
          },
          icons: {
            icon: ['/favicon.ico'],
          },
        };
      });
    }

    console.log(`✅ Generated SEO for ${Object.keys(seoMetadata).length} pages`);

    return NextResponse.json({
      success: true,
      seoMetadata,
      pagesProcessed: Object.keys(seoMetadata).length,
    });
  } catch (error: any) {
    console.error('SEO generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate SEO metadata',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
