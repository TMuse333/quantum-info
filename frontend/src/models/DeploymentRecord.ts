import mongoose from 'mongoose';

/**
 * DeploymentRecord - Track every deployment attempt
 *
 * Stores complete deployment history for analytics and debugging
 */

export interface IDeploymentRecord {
  _id?: string;
  projectId: string; // Links to WebsiteMaster._id or userId

  // Deployment info
  deploymentType: 'initial' | 'update';
  status: 'pending' | 'building' | 'success' | 'failed';

  // GitHub details
  commitSha?: string;
  commitMessage?: string;
  branch?: string; // Should always be 'main' for production

  // Vercel details
  vercelDeploymentId?: string;
  vercelDeploymentUrl?: string;
  vercelProjectId?: string;

  // Build results
  buildTime?: number; // milliseconds
  filesDeployed?: number;
  errorMessage?: string;
  errorStack?: string;

  // Timestamps
  startedAt: Date;
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const deploymentRecordSchema = new mongoose.Schema<IDeploymentRecord>(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
    },

    deploymentType: {
      type: String,
      enum: ['initial', 'update'],
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'building', 'success', 'failed'],
      default: 'pending',
      index: true,
    },

    // GitHub
    commitSha: String,
    commitMessage: String,
    branch: {
      type: String,
      default: 'main',
    },

    // Vercel
    vercelDeploymentId: String,
    vercelDeploymentUrl: String,
    vercelProjectId: String,

    // Build results
    buildTime: Number,
    filesDeployed: Number,
    errorMessage: String,
    errorStack: String,

    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
deploymentRecordSchema.index({ projectId: 1, startedAt: -1 }); // Recent deployments for a project
deploymentRecordSchema.index({ status: 1, startedAt: -1 }); // Failed/pending deployments

export const DeploymentRecord =
  mongoose.models.DeploymentRecord ||
  mongoose.model<IDeploymentRecord>('DeploymentRecord', deploymentRecordSchema);
