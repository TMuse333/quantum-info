import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { DeploymentRecord } from '@/models/DeploymentRecord';

/**
 * PATCH /api/deployments/[id]/complete
 *
 * Update deployment record when deployment completes (success or failure)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updates = await request.json();
    const { id } = await params;

    await connectDB();

    const deployment = await DeploymentRecord.findByIdAndUpdate(
      id,
      {
        ...updates,
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment record not found' },
        { status: 404 }
      );
    }

    console.log(`📊 [TRACK] Updated deployment ${id}:`, deployment.status);

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment._id.toString(),
        status: deployment.status,
        completedAt: deployment.completedAt,
        buildTime: deployment.buildTime,
        errorMessage: deployment.errorMessage,
      },
    });
  } catch (error: any) {
    console.error('❌ [TRACK] Failed to update deployment record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update deployment record' },
      { status: 500 }
    );
  }
}
