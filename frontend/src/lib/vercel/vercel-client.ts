/**
 * Vercel API Client Wrapper
 *
 * Provides typed interface to Vercel API for deployments
 */

// Note: Using REST API since @vercel/client may have different interface
// We'll use fetch directly for more control

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  link?: {
    type: string;
    repo: string;
    repoId: number;
    org?: string;
    gitBranch?: string;
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  readyState: 'QUEUED' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'READY' | 'CANCELED';
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  creator: {
    uid: string;
  };
}

export interface CreateProjectParams {
  name: string;
  framework?: 'nextjs';
  gitRepository?: {
    type: 'github';
    repo: string;
    branch?: string;
  };
  productionBranch?: string; // Set which branch deploys to production (default: main)
  environmentVariables?: Array<{
    key: string;
    value: string;
    type?: 'encrypted' | 'plain' | 'system' | 'sensitive';
    target?: Array<'production' | 'preview' | 'development'>;
  }>;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  rootDirectory?: string; // For monorepos - subdirectory containing the app
}

export interface CreateDeploymentParams {
  name: string;
  gitSource?: {
    type: 'github';
    ref: string;
    repoId: number;
  };
  target?: 'production' | 'staging';
  meta?: Record<string, string>;
}

class VercelAPIClient {
  private token: string;
  private baseUrl = 'https://api.vercel.com';
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async fetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log(`📡 [VERCEL] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Vercel API Error: ${error.error?.message || error.error || response.statusText}`);
    }

    return response.json();
  }

  private getTeamParam(): string {
    return this.teamId ? `?teamId=${this.teamId}` : '';
  }

  async createProject(params: CreateProjectParams): Promise<VercelProject> {
    console.log('📦 [VERCEL] Creating project:', params.name);

    const body: any = {
      name: params.name,
      framework: params.framework || 'nextjs',
    };

    if (params.gitRepository) {
      body.gitRepository = {
        type: params.gitRepository.type,
        repo: params.gitRepository.repo,
      };
    }

    if (params.environmentVariables) {
      body.environmentVariables = params.environmentVariables;
    }

    if (params.buildCommand) body.buildCommand = params.buildCommand;
    if (params.outputDirectory) body.outputDirectory = params.outputDirectory;
    if (params.installCommand) body.installCommand = params.installCommand;
    if (params.devCommand) body.devCommand = params.devCommand;
    if (params.rootDirectory) body.rootDirectory = params.rootDirectory;
    if (params.productionBranch) body.productionBranch = params.productionBranch;

    console.log('📦 [VERCEL] Project configuration:', {
      name: body.name,
      framework: body.framework,
      rootDirectory: body.rootDirectory,
      buildCommand: body.buildCommand,
    });

    const result = await this.fetch<VercelProject>(
      `/v9/projects${this.getTeamParam()}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    console.log('✅ [VERCEL] Project created:', result.id);
    return result;
  }

  async getProject(projectId: string): Promise<VercelProject> {
    return this.fetch<VercelProject>(
      `/v9/projects/${projectId}${this.getTeamParam()}`
    );
  }

  /**
   * Update project settings (e.g., production branch)
   *
   * @param projectId - The project ID or name
   * @param updates - Project settings to update
   * @returns Updated project
   */
  async updateProject(
    projectId: string,
    updates: {
      productionBranch?: string;
      buildCommand?: string;
      installCommand?: string;
      outputDirectory?: string;
      rootDirectory?: string;
    }
  ): Promise<VercelProject> {
    console.log('🔧 [VERCEL] Updating project:', projectId);
    console.log('   Updates:', updates);

    const result = await this.fetch<VercelProject>(
      `/v9/projects/${projectId}${this.getTeamParam()}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );

    console.log('✅ [VERCEL] Project updated');
    if (updates.productionBranch) {
      console.log(`   Production branch set to: ${updates.productionBranch}`);
    }
    return result;
  }

  async createDeployment(
    projectId: string,
    params: CreateDeploymentParams
  ): Promise<VercelDeployment> {
    console.log('🚀 [VERCEL] Creating deployment for project:', projectId);
    console.log('   Deployment params:', {
      name: params.name,
      target: params.target,
      gitSource: params.gitSource,
    });

    const body: any = {
      name: params.name,
      target: params.target || 'production',
      // Note: projectId goes in URL, not body
    };

    if (params.gitSource) {
      body.gitSource = params.gitSource;
      console.log('   Using git source:', params.gitSource);
    }

    if (params.meta) {
      body.meta = params.meta;
    }

    try {
      // projectId should be in query param, not body
      const result = await this.fetch<VercelDeployment>(
        `/v13/deployments?projectId=${projectId}${this.getTeamParam()}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      console.log('✅ [VERCEL] Deployment created:', result.id);
      console.log('   Deployment URL:', result.url);
      return result;
    } catch (error: any) {
      console.error('❌ [VERCEL] Deployment creation failed:', error);
      console.error('   Request body:', JSON.stringify(body, null, 2));
      throw error;
    }
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.fetch<VercelDeployment>(
      `/v13/deployments/${deploymentId}${this.getTeamParam()}`
    );
  }

  async addDomain(projectId: string, domain: string): Promise<any> {
    console.log('🌐 [VERCEL] Adding domain:', domain);

    const result = await this.fetch(
      `/v10/projects/${projectId}/domains${this.getTeamParam()}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: domain,
        }),
      }
    );

    console.log('✅ [VERCEL] Domain added');
    return result;
  }

  async waitForDeployment(
    deploymentId: string,
    timeout = 600000, // 10 min
    onProgress?: (state: string, elapsed: number) => void
  ): Promise<VercelDeployment> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    console.log('⏳ [VERCEL] Waiting for deployment to complete...');

    while (Date.now() - startTime < timeout) {
      const deployment = await this.getDeployment(deploymentId);
      const elapsed = Date.now() - startTime;

      if (onProgress) {
        onProgress(deployment.readyState, elapsed);
      }

      console.log(`⏳ [VERCEL] State: ${deployment.readyState} (${Math.round(elapsed / 1000)}s)`);

      if (deployment.readyState === 'READY') {
        console.log('✅ [VERCEL] Deployment ready!');
        return deployment;
      }

      if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
        throw new Error(`Deployment ${deployment.readyState.toLowerCase()}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Deployment timeout');
  }
}

// Singleton instance
let vercelClient: VercelAPIClient | null = null;

export function getVercelClient(): VercelAPIClient {
  if (!vercelClient) {
    const token = process.env.VERCEL_API_TOKEN;
    if (!token) {
      throw new Error('VERCEL_API_TOKEN environment variable is not set');
    }

    const teamId = process.env.VERCEL_TEAM_ID; // Optional
    vercelClient = new VercelAPIClient(token, teamId);
  }

  return vercelClient;
}
