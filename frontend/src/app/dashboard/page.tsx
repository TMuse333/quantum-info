/**
 * Dashboard Page - User-friendly website overview
 * Shows deployment status, history, and quick actions
 *
 * This page is automatically excluded from production deployment
 */

import { SiteStatusCard } from '@/components/dashboard/SiteStatusCard';
import { DeploymentHistory } from '@/components/dashboard/DeploymentHistory';
import { QuickActions } from '@/components/dashboard/QuickActions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export default async function DashboardPage() {
  // Read website data for quick status
  const websiteDataPath = path.join(process.cwd(), 'src/data/websiteData.json');
  let websiteData: any = {};

  try {
    const data = fs.readFileSync(websiteDataPath, 'utf-8');
    websiteData = JSON.parse(data);
  } catch (error) {
    console.error('Failed to read website data:', error);
  }

  const { deployment } = websiteData;

  // Fetch real deployment history from MongoDB
  let deployments: any[] = [];
  try {
    const { connectDB } = await import('@/lib/db/mongodb');
    const { DeploymentRecord } = await import('@/models/DeploymentRecord');

    await connectDB();

    // Get recent deployments (last 10)
    // TODO: Replace 'user-id' with actual user ID from session
    const userId = process.env.NEXT_PUBLIC_USER_ID || 'default-user';

    const rawDeployments = await DeploymentRecord
      .find({ projectId: userId })
      .sort({ startedAt: -1 })
      .limit(10)
      .lean();

    // Convert MongoDB documents to plain objects
    deployments = rawDeployments.map((dep: any) => ({
      id: dep._id.toString(),
      status: dep.status,
      deploymentType: dep.deploymentType,
      commitMessage: dep.commitMessage,
      branch: dep.branch,
      vercelDeploymentUrl: dep.vercelDeploymentUrl,
      buildTime: dep.buildTime,
      errorMessage: dep.errorMessage,
      startedAt: dep.startedAt.toISOString(),
      completedAt: dep.completedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch deployments from MongoDB:', error);
    // Continue with empty deployments array
  }

  const siteUrl = deployment?.customDomain
    ? `https://${deployment.customDomain}`
    : deployment?.vercelProductionUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Website Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor your website
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Editor
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Site Status */}
          <SiteStatusCard deployment={deployment} />

          {/* Quick Actions */}
          <QuickActions
            siteUrl={siteUrl}
            onDeploy={async () => {
              'use server';
              // TODO: Implement deploy function
              console.log('Deploy triggered');
            }}
          />

          {/* Deployment History */}
          <DeploymentHistory deployments={deployments} />
        </div>
      </div>
    </div>
  );
}
