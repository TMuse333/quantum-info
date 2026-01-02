'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, AlertCircle, Image as ImageIcon, FileText } from 'lucide-react';
import useWebsiteStore from '@/stores/websiteStore';
import { validateWebsiteData, ValidationResult } from '@/lib/validation/websiteData';

interface ProductionValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  mode?: 'warning' | 'blocking'; // warning = can proceed with warnings, blocking = must fix errors
}

interface PlaceholderCheck {
  found: boolean;
  locations: string[];
}

interface SEOCheck {
  complete: boolean;
  missing: string[];
}

export function ProductionValidationModal({
  isOpen,
  onClose,
  onProceed,
  mode = 'warning'
}: ProductionValidationModalProps) {
  const { websiteData } = useWebsiteStore();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [placeholderCheck, setPlaceholderCheck] = useState<PlaceholderCheck>({ found: false, locations: [] });
  const [seoCheck, setSeoCheck] = useState<SEOCheck>({ complete: true, missing: [] });
  const [isValidating, setIsValidating] = useState(false);

  // Common placeholder image patterns
  const PLACEHOLDER_PATTERNS = [
    '/placeholder',
    'placeholder.png',
    'placeholder.jpg',
    'example.com',
    'via.placeholder.com',
    'placehold',
    'data:image/svg',
  ];

  useEffect(() => {
    if (isOpen && websiteData) {
      performValidation();
    }
  }, [isOpen, websiteData]);

  const performValidation = () => {
    setIsValidating(true);

    try {
      // 1. Run standard validation
      const result = validateWebsiteData(websiteData);
      setValidationResult(result);

      // 2. Check for placeholder images
      const placeholders = checkForPlaceholders();
      setPlaceholderCheck(placeholders);

      // 3. Check SEO metadata
      // const seo = checkSEOMetadata();
      // setSeoCheck(seo);
    } finally {
      setIsValidating(false);
    }
  };

  const checkForPlaceholders = (): PlaceholderCheck => {
    const locations: string[] = [];

    if (!websiteData?.pages) {
      return { found: false, locations: [] };
    }

    const pagesArray = Array.isArray(websiteData.pages)
      ? websiteData.pages
      : Object.values(websiteData.pages);

    pagesArray.forEach((page: any) => {
      const pageName = page.name || page.slug || 'Unknown Page';

      page.components?.forEach((comp: any, index: number) => {
        const componentRef = `${pageName} > ${comp.type || 'Component'} #${index + 1}`;

        // Check all props for image URLs
        Object.entries(comp.props || {}).forEach(([key, value]: [string, any]) => {
          // Check if it's an image prop
          if (typeof value === 'object' && value?.src) {
            const src = value.src.toLowerCase();
            const isPlaceholder = PLACEHOLDER_PATTERNS.some(pattern => src.includes(pattern));
            if (isPlaceholder) {
              locations.push(`${componentRef} (${key})`);
            }
          } else if (typeof value === 'string' && (key.includes('image') || key.includes('img'))) {
            const valueLower = value.toLowerCase();
            const isPlaceholder = PLACEHOLDER_PATTERNS.some(pattern => valueLower.includes(pattern));
            if (isPlaceholder) {
              locations.push(`${componentRef} (${key})`);
            }
          }
        });
      });
    });

    return {
      found: locations.length > 0,
      locations,
    };
  };

  // const checkSEOMetadata = (): SEOCheck => {
  //   const missing: string[] = [];

  //   if (!websiteData?.seo) {
  //     missing.push('SEO configuration is missing');
  //     return { complete: false, missing };
  //   }

  //   const seo = websiteData.seo;

  //   if (!seo.title || !seo.title.trim()) {
  //     missing.push('Site title');
  //   }

  //   if (!seo.description || !seo.description.trim()) {
  //     missing.push('Site description');
  //   }

  //   if (!seo.keywords || seo.keywords.length === 0) {
  //     missing.push('SEO keywords');
  //   }

  //   if (!seo.ogImage || !seo.ogImage.trim()) {
  //     missing.push('Open Graph image (for social media sharing)');
  //   }

  //   return {
  //     complete: missing.length === 0,
  //     missing,
  //   };
  // };

  const hasBlockingIssues = () => {
    return validationResult && validationResult.errors.length > 0;
  };

  const hasWarnings = () => {
    return (
      (validationResult && validationResult.warnings.length > 0) ||
      placeholderCheck.found ||
      !seoCheck.complete
    );
  };

  const canProceed = () => {
    if (mode === 'blocking') {
      return !hasBlockingIssues() && !hasWarnings();
    }
    // In warning mode, can proceed if no blocking errors
    return !hasBlockingIssues();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {hasBlockingIssues() ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : hasWarnings() ? (
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                Production Validation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isValidating ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                  <p className="text-gray-600">Validating your website...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className={`p-4 rounded-lg ${
                  hasBlockingIssues()
                    ? 'bg-red-50 border border-red-200'
                    : hasWarnings()
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`font-semibold ${
                    hasBlockingIssues()
                      ? 'text-red-800'
                      : hasWarnings()
                      ? 'text-yellow-800'
                      : 'text-green-800'
                  }`}>
                    {hasBlockingIssues()
                      ? 'Your website has errors that must be fixed before deploying to production.'
                      : hasWarnings()
                      ? 'Your website is ready to deploy, but has some warnings you should review.'
                      : 'Your website is ready to deploy to production!'}
                  </p>
                </div>

                {/* Validation Errors */}
                {validationResult && validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-red-800">
                        Errors ({validationResult.errors.length})
                      </h3>
                    </div>
                    <ul className="space-y-1 bg-red-50 rounded-lg p-4">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Warnings */}
                {validationResult && validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">
                        Warnings ({validationResult.warnings.length})
                      </h3>
                    </div>
                    <ul className="space-y-1 bg-yellow-50 rounded-lg p-4">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Placeholder Images */}
                {placeholderCheck.found && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">
                        Placeholder Images ({placeholderCheck.locations.length})
                      </h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                      The following components still have placeholder images:
                    </p>
                    <ul className="space-y-1 bg-yellow-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {placeholderCheck.locations.map((location, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span>{location}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* SEO Metadata */}
                {!seoCheck.complete && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">
                        SEO Metadata Incomplete
                      </h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Complete SEO metadata helps your website rank better in search engines:
                    </p>
                    <ul className="space-y-1 bg-yellow-50 rounded-lg p-4">
                      {seoCheck.missing.map((item, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span>Missing: {item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success State */}
                {!hasBlockingIssues() && !hasWarnings() && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">All Checks Passed</h3>
                    </div>
                    <p className="text-sm text-green-700">
                      Your website has passed all validation checks and is ready for production deployment.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {hasBlockingIssues() ? 'Fix Issues' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                if (canProceed()) {
                  onProceed();
                  onClose();
                }
              }}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canProceed()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {hasWarnings() ? 'Proceed Anyway' : 'Deploy to Production'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
