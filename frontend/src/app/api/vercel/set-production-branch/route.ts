import { NextResponse } from 'next/server';
import { getVercelClient } from '@/lib/vercel/vercel-client';

/**
 * Set Vercel production branch to 'main'
 *
 * This ensures Vercel always deploys from the main branch,
 * not from experiment or other development branches
 *
 * Usage: POST /api/vercel/set-production-branch
 * Body: { projectId: "your-project-id" }
 */
export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const vercelClient = getVercelClient();

    console.log('🔧 Setting production branch to main for project:', projectId);

    // Update project to use 'main' as production branch
    const updatedProject = await vercelClient.updateProject(projectId, {
      productionBranch: 'main',
    });

    return NextResponse.json({
      success: true,
      message: 'Production branch set to main',
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        productionBranch: 'main',
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to set production branch:', error);

    return NextResponse.json(
      {
        error: 'Failed to set production branch',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get current project settings including production branch
 *
 * Usage: GET /api/vercel/set-production-branch?projectId=your-project-id
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const vercelClient = getVercelClient();
    const project = await vercelClient.getProject(projectId);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        link: project.link,
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to get project:', error);

    return NextResponse.json(
      {
        error: 'Failed to get project',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
