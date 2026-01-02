/**
 * Push to Main Branch API (Server-Sent Events)
 *
 * Pushes code to main branch without Vercel deployment.
 * Useful for testing that files are correctly updated in the main branch.
 */

import { NextRequest } from 'next/server';
import { generateAllPageFiles, validateComponentTypes, getUsedComponentTypes } from '@/lib/deploy/generators/generatePageFiles';
import { copyProductionComponents } from '@/lib/deploy/copyComponents';
import { deployToProductionViaAPI, saveProductionSnapshot, regenerateDataFilesFromSnapshot } from '@/lib/deploy/github-api-operations';
import { SEOMetadata } from '@/types/website';

interface PushToMainRequest {
  websiteData: any;
  dryRun?: boolean;
}

// Helper to send SSE event
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse request
        const body: PushToMainRequest = await request.json();
        const { websiteData, dryRun = false } = body;

        if (!websiteData) {
          sendEvent(controller, 'error', { message: 'Invalid request: websiteData is required' });
          controller.close();
          return;
        }

        const startTime = Date.now();
        let trackingId: string | null = null;

        // ========================================================================
        // DEPLOYMENT TRACKING: Start
        // ========================================================================
        try {
          const trackResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deployments/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: process.env.NEXT_PUBLIC_USER_ID || 'default-user',
              deploymentType: 'update',
              commitMessage: 'Push to main',
            }),
          });

          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            trackingId = trackData.deploymentId;
            console.log(`📊 [PUSH-TO-MAIN] Tracking deployment: ${trackingId}`);
          }
        } catch (error) {
          console.warn('⚠️ [PUSH-TO-MAIN] Failed to start tracking:', error);
        }

        // ========================================================================
        // STAGE 1: Validation
        // ========================================================================
        sendEvent(controller, 'stage', {
          stage: 1,
          name: 'Validation',
          status: 'in-progress',
          message: 'Validating website data...'
        });

        const validation = validateComponentTypes(websiteData);

        if (!validation.valid) {
          sendEvent(controller, 'stage', {
            stage: 1,
            name: 'Validation',
            status: 'failed',
            message: `Missing component types: ${validation.missingTypes.join(', ')}`
          });
          sendEvent(controller, 'complete', { success: false, errors: validation.missingTypes });
          controller.close();
          return;
        }

        sendEvent(controller, 'stage', {
          stage: 1,
          name: 'Validation',
          status: 'completed',
          message: `Validated ${validation.usedTypes.length} component types`,
          duration: `${Date.now() - startTime}ms`
        });

        // ========================================================================
        // STAGE 2: Component Copying
        // ========================================================================
        const copyStartTime = Date.now();
        sendEvent(controller, 'stage', {
          id: 'components',
          stage: 2,
          name: 'Component Copying',
          status: 'in-progress',
          message: 'Copying production components...'
        });

        const usedTypes = Array.from(getUsedComponentTypes(websiteData));
        const copyResult = await copyProductionComponents(usedTypes, dryRun);

        if (!copyResult.success && copyResult.errors.length > 0) {
          sendEvent(controller, 'stage', {
            id: 'components',
            stage: 2,
            name: 'Component Copying',
            status: 'failed',
            message: `Component copying failed: ${copyResult.errors[0]}`,
            duration: `${Date.now() - copyStartTime}ms`
          });
          sendEvent(controller, 'complete', { success: false, errors: copyResult.errors });
          controller.close();
          return;
        }

        sendEvent(controller, 'stage', {
          id: 'components',
          stage: 2,
          name: 'Component Copying',
          status: 'completed',
          message: `Copied ${copyResult.componentsCopied} components (${copyResult.files.length} files)`,
          duration: `${Date.now() - copyStartTime}ms`
        });

        // ========================================================================
        // STAGE 3: File Generation
        // ========================================================================
        const fileGenStartTime = Date.now();
        sendEvent(controller, 'stage', {
          id: 'generation',
          stage: 3,
          name: 'File Generation',
          status: 'in-progress',
          message: 'Generating page files...'
        });

        // DEBUG: Log websiteData being used for generation
        console.log('🔍 [DEBUG] WebsiteData received in push-to-main API:');
        console.log('  - Pages:', Object.keys(websiteData.pages || {}).length);
        console.log('  - Current Version:', websiteData.currentVersionNumber);
        console.log('  - First page components:', websiteData.pages?.index?.components?.length || 0);
        if (websiteData.pages?.index?.components?.[0]) {
          console.log('  - First component type:', websiteData.pages.index.components[0].type);
          console.log('  - First component props keys:', Object.keys(websiteData.pages.index.components[0].props || {}));
        }

        let seoMetadata: Record<string, SEOMetadata> = {};
        const files = generateAllPageFiles(websiteData, seoMetadata);

        sendEvent(controller, 'stage', {
          id: 'generation',
          stage: 3,
          name: 'File Generation',
          status: 'completed',
          message: `Generated ${files.length} files`,
          duration: `${Date.now() - fileGenStartTime}ms`
        });

        // ========================================================================
        // STAGE 4: GitHub Push
        // ========================================================================
        const gitStartTime = Date.now();
        sendEvent(controller, 'stage', {
          id: 'git',
          stage: 4,
          name: 'GitHub Push',
          status: 'in-progress',
          message: dryRun ? 'Simulating GitHub push...' : 'Pushing to main branch...'
        });

        // Add websiteData.json to the deployment
        const websiteDataFile = {
          path: 'frontend/src/data/websiteData.json',
          content: JSON.stringify(websiteData, null, 2),
          encoding: 'utf-8' as const
        };

        const componentFiles = copyResult.files;
        const gitResult = await deployToProductionViaAPI(
          componentFiles,
          [...files, websiteDataFile], // Include websiteData.json with page files
          `Push to main: ${files.length} page files and ${componentFiles.length} component files for ${Object.keys(websiteData.pages).length} pages`,
          dryRun
        );

        if (!gitResult.success) {
          sendEvent(controller, 'stage', {
            id: 'git',
            stage: 4,
            name: 'GitHub Push',
            status: 'failed',
            message: gitResult.error || 'GitHub push failed',
            duration: `${Date.now() - gitStartTime}ms`
          });
          sendEvent(controller, 'complete', {
            success: false,
            errors: [gitResult.error || gitResult.message]
          });
          controller.close();
          return;
        }

        sendEvent(controller, 'stage', {
          id: 'git',
          stage: 4,
          name: 'GitHub Push',
          status: 'completed',
          message: dryRun
            ? `Dry run: Would push ${gitResult.details?.filesDeployed || 0} files to main`
            : `Pushed ${gitResult.details?.filesDeployed || 0} files to main branch`,
          commitSha: gitResult.details?.commitSha,
          commitUrl: gitResult.details?.commitUrl,
          version: gitResult.details?.version,
          duration: `${Date.now() - gitStartTime}ms`
        });

        // ========================================================================
        // STAGE 5: Production Snapshot (if not dry run)
        // ========================================================================
        let snapshotAvailable = false;
        let snapshotVersion: number | undefined = undefined;

        if (!dryRun && gitResult.details?.version && gitResult.details?.commitSha) {
          const snapshotStartTime = Date.now();
          sendEvent(controller, 'stage', {
            id: 'snapshot',
            stage: 5,
            name: 'Production Snapshot',
            status: 'in-progress',
            message: 'Creating production snapshot...'
          });

          try {
            const snapshotResult = await saveProductionSnapshot(
              websiteData,
              gitResult.details.version,
              gitResult.details.commitSha
            );

            if (snapshotResult.success) {
              snapshotAvailable = true;
              snapshotVersion = gitResult.details.version;
              sendEvent(controller, 'stage', {
                id: 'snapshot',
                stage: 5,
                name: 'Production Snapshot',
                status: 'completed',
                message: snapshotResult.message,
                duration: `${Date.now() - snapshotStartTime}ms`
              });
            } else {
              sendEvent(controller, 'stage', {
                id: 'snapshot',
                stage: 5,
                name: 'Production Snapshot',
                status: 'skipped',
                message: `Snapshot failed: ${snapshotResult.error}`,
                duration: `${Date.now() - snapshotStartTime}ms`
              });
            }
          } catch (snapshotError: any) {
            sendEvent(controller, 'stage', {
              id: 'snapshot',
              stage: 5,
              name: 'Production Snapshot',
              status: 'skipped',
              message: `Snapshot error: ${snapshotError.message}`,
              duration: `${Date.now() - snapshotStartTime}ms`
            });
          }
        } else {
          sendEvent(controller, 'stage', {
            id: 'snapshot',
            stage: 5,
            name: 'Production Snapshot',
            status: 'skipped',
            message: 'Snapshot skipped (dry run mode)'
          });
        }

        // ========================================================================
        // STAGE 6: Regenerate .data.ts files from snapshot
        // ========================================================================
        if (!dryRun && snapshotAvailable && snapshotVersion) {
          const regenStartTime = Date.now();
          sendEvent(controller, 'stage', {
            id: 'regenerate',
            stage: 6,
            name: 'Sync Data Files',
            status: 'in-progress',
            message: 'Regenerating .data.ts files from snapshot...'
          });

          try {
            const regenResult = await regenerateDataFilesFromSnapshot(snapshotVersion);

            if (regenResult.success) {
              sendEvent(controller, 'stage', {
                id: 'regenerate',
                stage: 6,
                name: 'Sync Data Files',
                status: 'completed',
                message: regenResult.message,
                duration: `${Date.now() - regenStartTime}ms`
              });
            } else {
              sendEvent(controller, 'stage', {
                id: 'regenerate',
                stage: 6,
                name: 'Sync Data Files',
                status: 'skipped',
                message: `Regeneration failed: ${regenResult.error}`,
                duration: `${Date.now() - regenStartTime}ms`
              });
            }
          } catch (regenError: any) {
            sendEvent(controller, 'stage', {
              id: 'regenerate',
              stage: 6,
              name: 'Sync Data Files',
              status: 'skipped',
              message: `Regeneration error: ${regenError.message}`,
              duration: `${Date.now() - regenStartTime}ms`
            });
          }
        } else {
          sendEvent(controller, 'stage', {
            id: 'regenerate',
            stage: 6,
            name: 'Sync Data Files',
            status: 'skipped',
            message: snapshotAvailable ? 'Sync skipped (dry run mode)' : 'Sync skipped (no snapshot)'
          });
        }

        // ========================================================================
        // DEPLOYMENT TRACKING: Complete (Success)
        // ========================================================================
        if (trackingId && !dryRun) {
          try {
            const buildTime = Date.now() - startTime;
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deployments/${trackingId}/complete`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'success',
                commitSha: gitResult.details?.commitSha,
                commitMessage: 'Push to main',
                buildTime,
                filesDeployed: gitResult.details?.filesDeployed,
                branch: 'main',
              }),
            });
            console.log(`📊 [PUSH-TO-MAIN] Updated tracking: success`);

            // Update websiteData.json deployment field
            const { updateWebsiteDeployment } = await import('@/lib/db/updateWebsiteDeployment');
            await updateWebsiteDeployment({
              projectId: process.env.NEXT_PUBLIC_USER_ID || 'default-user',
              githubOwner: 'TMuse333',
              githubRepo: 'next-js-template',
              lastDeploymentStatus: 'success',
              lastDeploymentId: trackingId,
              lastCommitSha: gitResult.details?.commitSha,
              lastBuildTime: buildTime,
              incrementTotal: true,
              incrementSuccess: true,
            });
            console.log(`📊 [PUSH-TO-MAIN] Updated websiteData.json`);
          } catch (error) {
            console.warn('⚠️ [PUSH-TO-MAIN] Failed to update tracking:', error);
          }
        }

        // ========================================================================
        // Complete
        // ========================================================================
        const totalDuration = Date.now() - startTime;

        sendEvent(controller, 'complete', {
          success: true,
          message: dryRun ? 'Dry run completed successfully' : 'Successfully pushed to main branch!',
          details: {
            version: gitResult.details?.version,
            commitSha: gitResult.details?.commitSha,
            commitUrl: gitResult.details?.commitUrl,
            tagName: gitResult.details?.tagName,
            tagUrl: gitResult.details?.tagUrl,
            filesDeployed: gitResult.details?.filesDeployed,
            snapshotAvailable,
            snapshotVersion,
            totalDuration: `${totalDuration}ms`,
            dryRun
          }
        });

        controller.close();
      } catch (error: any) {
        console.error('Push to main error:', error);

        sendEvent(controller, 'error', {
          message: error.message || 'Unknown error occurred',
          stack: error.stack
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
