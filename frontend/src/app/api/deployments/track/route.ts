import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { DeploymentRecord } from '@/models/DeploymentRecord';

/**
 * POST /api/deployments/track
 *
 * Create a new deployment record when deployment starts
 */
export async function POST(request: Request) {
  try {
    const { projectId, deploymentType, commitMessage } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const deployment = await DeploymentRecord.create({
      projectId,
      deploymentType: deploymentType || 'update',
      commitMessage: commitMessage || 'Deployment',
      status: 'pending',
      startedAt: new Date(),
    });

    console.log('📊 [TRACK] Created deployment record:', deployment._id);

    return NextResponse.json({
      success: true,
      deploymentId: deployment._id.toString(),
      deployment: {
        id: deployment._id.toString(),
        status: deployment.status,
        startedAt: deployment.startedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ [TRACK] Failed to create deployment record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create deployment record' },
      { status: 500 }
    );
  }
}
