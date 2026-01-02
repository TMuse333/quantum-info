import { WebsiteFormAnswer } from "./forms";
import { GradientConfig } from "./colors";
import { BaseTextProps } from "./componentTypes";
import { PageComponentInstance } from "./registry/mainRegistry";

// Moved from websiteDataTypes.ts to avoid deployment issues
export interface ComponentTextSnapshot {
  componentId: string;
  componentType: string;
  text: Partial<BaseTextProps>; // Not all components have all text fields
}

export interface WebsitePage {
  pageName?: string;
  slug?: string;
  components: PageComponentInstance[];
  text: ComponentTextSnapshot[]; // Array of text from each component
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    type: string;
    locale: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
  icons: {
    icon: string[];
  };
}

export interface WebsiteVersion {
  versionNumber: number;
  websiteData: WebsiteMaster; // Full snapshot
  createdAt: Date;
  createdBy: string; // User ID or 'system'
  changeDescription: string;
  claudeRequestId?: string; // For tracking Claude API requests
  status: "draft" | "confirmed" | "implemented" | "rejected";
  implementedAt?: Date; // When changes were implemented in GitHub
}

export interface WebsiteMaster {
    _id?: string; // when saved to DB later
    ownerId?: string; // user ID (optional for now)
    owner?: string; // user email (used when saved to DB)
    templateName: string;
    repoName?: string;
    repoUrl?: string;
    deploymentUrl?: string;
    websiteName?:string
    formData: Record<string, WebsiteFormAnswer>,
    pages: Record<string, WebsitePage>; // Object keyed by slug, not array

    status: "draft" | "in-progress" | "completed";

    // Deployment tracking (latest status)
    deployment?: {
      // Vercel connection
      vercelProjectId?: string;
      vercelProductionUrl?: string;
      customDomain?: string;

      // GitHub connection
      githubOwner?: string;
      githubRepo?: string;

      // Latest deployment status (quick access)
      lastDeploymentStatus?: 'success' | 'failed' | 'pending' | 'building';
      lastDeploymentAt?: Date;
      lastDeploymentId?: string; // Reference to DeploymentRecord._id
      lastCommitSha?: string;
      lastBuildTime?: number; // milliseconds

      // Quick stats for dashboard
      totalDeployments?: number;
      successfulDeployments?: number;
      failedDeployments?: number;
    };
    
    // Version control
    versions?: WebsiteVersion[];
    currentVersionNumber?: number; // Track the latest version number
    
    // Payment tracking
    initialPaymentIntentId?: string;
    initialPaymentCompleted?: boolean;
    initialPaymentDate?: Date;
    initialPaymentRefunded?: boolean;
    initialPaymentRefundDate?: Date;
    deploymentPaymentIntentId?: string;
    deploymentPaymentCompleted?: boolean;
    deploymentPaymentDate?: Date;
    deploymentPaymentRefunded?: boolean;
    deploymentPaymentRefundDate?: Date;
    
    // Color Theme
    colorTheme?: {
      primary: string;        // mainColor - all variations derived from this
      text: string;           // textColor
      background: string;     // baseBgColor
      bgLayout: GradientConfig;
      updatedAt: Date;
      source: "initial" | "page-wide-update" | "manual";
    };
    
    // SEO Metadata (per page)
    seoMetadata?: Record<string, SEOMetadata>; // keyed by page slug
    
    createdAt: Date;
    updatedAt: Date;
  }

// WebsitePage is already exported above, no need to re-export
