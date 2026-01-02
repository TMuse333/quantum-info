/**
 * Deployment Orchestrator API (Server-Sent Events)
 *
 * Streams deployment progress in real-time using Server-Sent Events.
 * Client receives updates as each stage completes.
 */

import { NextRequest } from 'next/server';
import { generateAllPageFiles, validateComponentTypes, getUsedComponentTypes } from '@/lib/deploy/generators/generatePageFiles';
import { copyProductionComponents } from '@/lib/deploy/copyComponents';
import { deployToProductionViaAPI, saveProductionSnapshot } from '@/lib/deploy/github-api-operations';
import { deployToVercel } from '@/lib/deploy/vercel-operations';
import { validateProductionCodebase } from '@/lib/deploy/claude-validation';
import { SEOMetadata } from '@/types/website';

interface DeploymentRequest {
  websiteData: any;
  skipCodeReview?: boolean;
  skipVercelDeploy?: boolean;
  dryRun?: boolean;
  appName?: string; // Vercel app name
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
        const body: DeploymentRequest = await request.json();
        const { websiteData, skipCodeReview = false, skipVercelDeploy = false, dryRun = false, appName } = body;

        if (!websiteData) {
          sendEvent(controller, 'error', { message: 'Invalid request: websiteData is required' });
          controller.close();
          return;
        }

        const startTime = Date.now();

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

        console.log(`\n📋 [VALIDATION] Validation result:`, {
          valid: validation.valid,
          usedTypes: validation.usedTypes,
          missingTypes: validation.missingTypes,
          missingCount: validation.missingTypes.length
        });

        if (!validation.valid) {
          const errorMessage = validation.missingTypes.length > 0
            ? `Missing component types: ${validation.missingTypes.join(', ')}`
            : `Validation failed: ${validation.missingTypes.length} issues found`;
          
          console.error(`\n❌ [VALIDATION] Validation failed!`);
          console.error(`   Missing types: ${validation.missingTypes.join(', ')}`);
          console.error(`   Used types: ${validation.usedTypes.join(', ')}`);
          
          sendEvent(controller, 'stage', {
            stage: 1,
            name: 'Validation',
            status: 'failed',
            message: errorMessage
          });
          sendEvent(controller, 'complete', { 
            success: false, 
            errors: validation.missingTypes,
            message: errorMessage
          });
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
        console.log(`\n🔍 [COMPONENT COPY] Starting component copy process...`);
        console.log(`   Component types to process: ${usedTypes.length}`);
        console.log(`   Types: ${usedTypes.join(', ')}`);
        console.log(`   Working directory: ${process.cwd()}`);
        console.log(`   Dry run: ${dryRun}\n`);
        
        const copyResult = await copyProductionComponents(usedTypes, dryRun);
        
        console.log(`\n📊 [COMPONENT COPY] Results:`);
        console.log(`   Components copied: ${copyResult.componentsCopied}`);
        console.log(`   Total files: ${copyResult.files.length}`);
        console.log(`   Success: ${copyResult.success}`);
        if (copyResult.errors.length > 0) {
          console.log(`   ❌ Errors: ${copyResult.errors.length}`);
          copyResult.errors.forEach(e => console.log(`      - ${e}`));
        }
        if (copyResult.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${copyResult.warnings.length}`);
          copyResult.warnings.forEach(w => console.log(`      - ${w}`));
        }
        console.log(`\n📋 [COMPONENT COPY] Files that will be written to production:`);
        copyResult.files.forEach((f, i) => {
          console.log(`   ${i + 1}. ${f.path} (${(f.content.length / 1024).toFixed(1)}KB)`);
        });
        console.log('');

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
        // STAGE 3: SEO Generation (COMMENTED OUT TO SAVE TOKENS)
        // ========================================================================
        // const seoStartTime = Date.now();
        // sendEvent(controller, 'stage', {
        //   stage: 3,
        //   name: 'SEO Generation',
        //   status: 'in-progress',
        //   message: 'Generating SEO metadata with AI...'
        // });

        let seoMetadata: Record<string, SEOMetadata> = {};

        // SEO generation commented out to save tokens
        // try {
        //   const seoResponse = await fetch(
        //     `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/assistant/generate-seo-batch`,
        //     {
        //       method: 'POST',
        //       headers: { 'Content-Type': 'application/json' },
        //       body: JSON.stringify({ websiteData }),
        //     }
        //   );

        //   if (seoResponse.ok) {
        //     const seoData = await seoResponse.json();
        //     seoMetadata = seoData.seoMetadata;
        //     sendEvent(controller, 'stage', {
        //       stage: 3,
        //       name: 'SEO Generation',
        //       status: 'completed',
        //       message: `Generated SEO for ${Object.keys(seoMetadata).length} pages`,
        //       duration: `${Date.now() - seoStartTime}ms`
        //     });
        //   } else {
        //     throw new Error('SEO generation failed');
        //   }
        // } catch (error: any) {
        //   sendEvent(controller, 'stage', {
        //     stage: 3,
        //     name: 'SEO Generation',
        //     status: 'skipped',
        //     message: 'Using default SEO metadata',
        //     duration: `${Date.now() - seoStartTime}ms`
        //   });
        // }

        // Skip SEO generation - using empty metadata
        sendEvent(controller, 'stage', {
          id: 'seo',
          stage: 3,
          name: 'SEO Generation',
          status: 'skipped',
          message: 'SEO generation skipped (commented out to save tokens)',
        });

        // ========================================================================
        // STAGE 4: File Generation
        // ========================================================================
        const fileGenStartTime = Date.now();
        sendEvent(controller, 'stage', {
          stage: 4,
          name: 'File Generation',
          status: 'in-progress',
          message: 'Generating page files...'
        });

        const files = generateAllPageFiles(websiteData, seoMetadata);

        sendEvent(controller, 'stage', {
          stage: 4,
          name: 'File Generation',
          status: 'completed',
          message: `Generated ${files.length} files`,
          duration: `${Date.now() - fileGenStartTime}ms`
        });

        // ========================================================================
        // STAGE 5: Final Validation
        // ========================================================================
        const validationStartTime = Date.now();
        sendEvent(controller, 'stage', {
          stage: 5,
          name: 'Final Validation',
          status: 'in-progress',
          message: 'Validating production codebase structure...'
        });

        const allFiles = [...copyResult.files, ...files];
        const validationResult = await validateProductionCodebase(allFiles);

        if (!validationResult.valid) {
          sendEvent(controller, 'stage', {
            stage: 5,
            name: 'Final Validation',
            status: 'failed',
            message: `Validation failed: ${validationResult.errors.length} issues found`,
            duration: `${Date.now() - validationStartTime}ms`
          });
          sendEvent(controller, 'complete', {
            success: false,
            errors: validationResult.errors.map(e => `${e.file}: ${e.issue}`),
          });
          controller.close();
          return;
        }

        sendEvent(controller, 'stage', {
          stage: 5,
          name: 'Final Validation',
          status: 'completed',
          message: 'All checks passed. Production ready.',
          duration: `${Date.now() - validationStartTime}ms`
        });

        // ========================================================================
        // STAGE 6: Code Review
        // ========================================================================
        const reviewStartTime = Date.now();
        let codeReviewPassed = true;

        if (!skipCodeReview) {
          sendEvent(controller, 'stage', {
            stage: 6,
            name: 'Code Review',
            status: 'in-progress',
            message: 'Reviewing generated code with AI...'
          });

          try {
            const reviewResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/assistant/review-deployment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files }),
              }
            );

            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();

              if (reviewData.approved) {
                sendEvent(controller, 'stage', {
                  stage: 6,
                  name: 'Code Review',
                  status: 'completed',
                  message: `Code review passed${reviewData.suggestions?.length ? ` (${reviewData.suggestions.length} suggestions)` : ''}`,
                  duration: `${Date.now() - reviewStartTime}ms`
                });
              } else {
                sendEvent(controller, 'stage', {
                  stage: 6,
                  name: 'Code Review',
                  status: 'failed',
                  message: `Code review failed: ${reviewData.issues.join(', ')}`,
                  duration: `${Date.now() - reviewStartTime}ms`
                });
                sendEvent(controller, 'complete', { success: false, errors: reviewData.issues });
                controller.close();
                return;
              }
            } else {
              throw new Error('Code review API failed');
            }
          } catch (error: any) {
            sendEvent(controller, 'stage', {
              stage: 6,
              name: 'Code Review',
              status: 'skipped',
              message: 'Code review skipped (API error)',
              duration: `${Date.now() - reviewStartTime}ms`
            });
          }
        } else {
          sendEvent(controller, 'stage', {
            stage: 6,
            name: 'Code Review',
            status: 'skipped',
            message: 'Code review skipped'
          });
        }

        // ========================================================================
        // STAGE 7: Git Operations
        // ========================================================================
        const gitStartTime = Date.now();
        sendEvent(controller, 'stage', {
          stage: 7,
          name: 'Git Operations',
          status: 'in-progress',
          message: dryRun ? 'Simulating git operations...' : 'Committing and pushing to GitHub...'
        });

        // Convert GeneratedFile[] to ComponentFileContent[] format for GitHub API
        // Both types have the same structure: { path: string, content: string }
        const componentFiles = copyResult.files.map(f => ({
          path: f.path,
          content: f.content,
        }));
        const pageFiles = files.map(f => ({
          path: f.path,
          content: f.content,
        }));

        // Add websiteData.json to the deployment
        const websiteDataFile = {
          path: 'frontend/src/data/websiteData.json',
          content: JSON.stringify(websiteData, null, 2),
          encoding: 'utf-8' as const
        };

        const gitResult = await deployToProductionViaAPI(
          componentFiles,
          [...pageFiles, websiteDataFile], // Include websiteData.json with page files
          `Generated ${files.length} files for ${Object.keys(websiteData.pages).length} pages`,
          dryRun
        );

        if (!gitResult.success) {
          sendEvent(controller, 'stage', {
            stage: 7,
            name: 'Git Operations',
            status: 'failed',
            message: gitResult.message || gitResult.error || 'Deployment failed',
            duration: `${Date.now() - gitStartTime}ms`
          });
          sendEvent(controller, 'complete', { 
            success: false, 
            errors: [gitResult.message || gitResult.error || 'Deployment failed'] 
          });
          controller.close();
          return;
        }

        sendEvent(controller, 'stage', {
          stage: 7,
          name: 'Git Operations',
          status: 'completed',
          message: dryRun
            ? `Dry run complete (would create v${gitResult.details?.version || '?'})`
            : `Deployed v${gitResult.details?.version || '?'} via GitHub API`,
          duration: `${Date.now() - gitStartTime}ms`
        });

        // ========================================================================
        // STAGE 7.5: Production Snapshot (Non-blocking)
        // ========================================================================
        let snapshotAvailable = false;
        let snapshotVersion: number | undefined = undefined;

        if (!dryRun && gitResult.details?.version && gitResult.details?.commitSha) {
          const snapshotStartTime = Date.now();
          console.log(`\n📸 [SNAPSHOT] Creating production snapshot for v${gitResult.details.version}...\n`);

          try {
            const snapshotResult = await saveProductionSnapshot(
              websiteData,
              gitResult.details.version,
              gitResult.details.commitSha
            );

            if (snapshotResult.success) {
              console.log(`✅ [SNAPSHOT] ${snapshotResult.message}`);
              console.log(`   Duration: ${Date.now() - snapshotStartTime}ms`);
              snapshotAvailable = true;
              snapshotVersion = gitResult.details.version;
            } else {
              console.warn(`⚠️  [SNAPSHOT] ${snapshotResult.message}: ${snapshotResult.error}`);
              console.warn(`   Snapshot failed but deployment succeeded - continuing...`);
            }
          } catch (snapshotError: any) {
            console.warn(`⚠️  [SNAPSHOT] Error creating snapshot:`, snapshotError.message);
            console.warn(`   Snapshot failed but deployment succeeded - continuing...`);
          }
        }

        // ========================================================================
        // STAGE 8: Vercel Deployment
        // ========================================================================
        const vercelStartTime = Date.now();
        let vercelResult = null;

        if (!skipVercelDeploy && appName) {
          sendEvent(controller, 'stage', {
            stage: 8,
            name: 'Vercel Deployment',
            status: 'in-progress',
            message: dryRun ? 'Simulating Vercel deployment...' : 'Deploying to Vercel...'
          });

          try {
            // Import GITHUB_CONFIG for deployment
            const { GITHUB_CONFIG } = await import('@/lib/config');

            console.log(`\n🚀 [VERCEL] Starting Vercel deployment...`);
            console.log(`   App name: ${appName}`);
            console.log(`   Repo: ${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`);
            console.log(`   Branch: ${GITHUB_CONFIG.PRODUCTION_BRANCH}`);
            console.log(`   Dry run: ${dryRun}\n`);

            // Construct custom domain if DOMAIN_NAME is set
            const DOMAIN_NAME = process.env.DOMAIN_NAME;
            const customDomain = DOMAIN_NAME ? `${appName}.dev.${DOMAIN_NAME}` : undefined;

            if (customDomain) {
              console.log(`🌐 [VERCEL] Custom domain will be configured: ${customDomain}`);
            } else {
              console.log(`🌐 [VERCEL] Using default Vercel domain: ${appName}.vercel.app`);
            }

            // Call the Vercel deployment API
            const deployResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/vercel/deploy-production`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: appName,
                  githubOwner: GITHUB_CONFIG.REPO_OWNER,
                  githubRepo: GITHUB_CONFIG.REPO_NAME,
                  githubToken: GITHUB_CONFIG.GITHUB_TOKEN,
                  customDomain, // ✅ Pass custom domain to Vercel deployment
                  validateBuild: false, // Skip build validation for now
                  autoFixErrors: false,
                  dryRun,
                }),
              }
            );

            console.log(`📡 [VERCEL] API response status: ${deployResponse.status}`);

            if (deployResponse.ok) {
              const deployData = await deployResponse.json();
              console.log(`📡 [VERCEL] API response data:`, deployData);

              if (deployData.success) {
                vercelResult = {
                  success: true,
                  url: deployData.productionUrl,
                  deploymentId: deployData.deploymentId,
                };

                console.log(`✅ [VERCEL] Deployment successful: ${deployData.productionUrl}`);

                sendEvent(controller, 'stage', {
                  stage: 8,
                  name: 'Vercel Deployment',
                  status: 'completed',
                  message: dryRun ? 'Dry run complete' : `Deployed to ${deployData.productionUrl}`,
                  duration: `${Date.now() - vercelStartTime}ms`
                });
              } else {
                const errorMsg = deployData.error || 'Deployment failed';
                console.error(`❌ [VERCEL] Deployment failed: ${errorMsg}`);
                throw new Error(errorMsg);
              }
            } else {
              const errorData = await deployResponse.json().catch(() => ({ error: 'Unknown error' }));
              const errorMsg = errorData.error || `Vercel deployment API failed with status ${deployResponse.status}`;
              console.error(`❌ [VERCEL] API error:`, errorData);
              throw new Error(errorMsg);
            }
          } catch (error: any) {
            console.error('❌ [VERCEL] Deployment failed:', error);
            console.error('❌ [VERCEL] Error details:', {
              message: error.message,
              stack: error.stack,
            });
            sendEvent(controller, 'stage', {
              stage: 8,
              name: 'Vercel Deployment',
              status: 'failed',
              message: error.message || 'Vercel deployment failed. Check server logs for details.',
              duration: `${Date.now() - vercelStartTime}ms`
            });
            // Don't fail entire deployment if Vercel fails - continue
          }
        } else {
          sendEvent(controller, 'stage', {
            stage: 8,
            name: 'Vercel Deployment',
            status: 'skipped',
            message: skipVercelDeploy ? 'Skipped by user' : !appName ? 'No app name provided' : 'Vercel deployment disabled'
          });
        }

        // ========================================================================
        // Complete
        // ========================================================================
        sendEvent(controller, 'complete', {
          success: true,
          message: dryRun ? 'Dry run successful (no changes made)' : 'Deployment successful',
          details: {
            version: gitResult!.details!.version,
            commitSha: gitResult.details!.commitSha,
            tag: gitResult.details!.tagName,
            deploymentUrl: vercelResult?.url,
            filesGenerated: files.length,
            pagesDeployed: Object.keys(websiteData.pages),
            codeReviewPassed,
            vercelDeploymentId: vercelResult?.deploymentId,
            dryRun,
            totalDuration: `${Date.now() - startTime}ms`,
            snapshotAvailable,
            snapshotVersion,
          }
        });

        controller.close();
      } catch (error: any) {
        sendEvent(controller, 'error', {
          message: 'Deployment failed',
          details: error.message
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
