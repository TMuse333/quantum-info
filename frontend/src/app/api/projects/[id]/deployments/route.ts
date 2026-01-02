import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { DeploymentRecord } from '@/models/DeploymentRecord';

/**
 * GET /api/projects/[id]/deployments
 *
 * Get deployment history for a project
 * Used by client dashboard
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectDB();

    const deployments = await DeploymentRecord
      .find({ projectId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    // Calculate stats
    const total = await DeploymentRecord.countDocuments({ projectId });
    const successful = await DeploymentRecord.countDocuments({
      projectId,
      status: 'success',
    });
    const failed = await DeploymentRecord.countDocuments({
      projectId,
      status: 'failed',
    });

    return NextResponse.json({
      success: true,
      deployments,
      stats: {
        total,
        successful,
        failed,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0',
      },
    });
  } catch (error: any) {
    console.error('❌ [DEPLOYMENTS] Failed to fetch deployments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}
