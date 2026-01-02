/**
 * Website Data Check Utilities
 * 
 * Functions for comparing website data versions and formatting values for display
 */

import type { WebsiteMaster } from '@/types/editorial';

export interface VersionComparison {
  versionNumber: number; // -1 for current vs latest
  changeDescription?: string;
  totalDifferences: number;
  structureChanged: boolean;
  summary: {
    added: number;
    modified: number;
    removed: number;
  };
  differences: Array<{
    type: "added" | "removed" | "modified";
    path: string;
    oldValue: any;
    newValue: any;
  }>;
}

export interface VersionComparisonSummary {
  totalComparisons: number;
  totalDifferences: number;
  added: number;
  modified: number;
  removed: number;
  structureChanges: number;
  totalVersions: number;
  versionsWithChanges: number;
  averageDifferencesPerVersion: number;
}

/**
 * Test website master data and compare versions
 */
export function testWebsiteMasterCheck(websiteData: WebsiteMaster | null): VersionComparison[] {
  if (!websiteData || !websiteData.versions || websiteData.versions.length === 0) {
    return [];
  }

  const comparisons: VersionComparison[] = [];
  const currentData = websiteData;
  const latestVersion = websiteData.versions[websiteData.versions.length - 1];

  // Compare current with latest version
  if (latestVersion) {
    const comparison = compareWebsiteData(
      currentData,
      latestVersion.websiteData,
      -1,
      latestVersion.changeDescription
    );
    comparisons.push(comparison);
  }

  // Compare each version with the previous one
  for (let i = 1; i < websiteData.versions.length; i++) {
    const currentVersion = websiteData.versions[i];
    const previousVersion = websiteData.versions[i - 1];
    
    const comparison = compareWebsiteData(
      previousVersion.websiteData,
      currentVersion.websiteData,
      currentVersion.versionNumber,
      currentVersion.changeDescription
    );
    comparisons.push(comparison);
  }

  return comparisons;
}

/**
 * Compare two website data objects
 */
function compareWebsiteData(
  oldData: WebsiteMaster,
  newData: WebsiteMaster,
  versionNumber: number,
  changeDescription?: string
): VersionComparison {
  const differences: VersionComparison["differences"] = [];
  let structureChanged = false;

  // Deep comparison helper
  function compareObjects(
    oldObj: any,
    newObj: any,
    path: string = ""
  ): void {
    if (oldObj === newObj) return;

    // Handle null/undefined
    if (oldObj == null && newObj != null) {
      differences.push({
        type: "added",
        path,
        oldValue: oldObj,
        newValue: newObj,
      });
      return;
    }

    if (oldObj != null && newObj == null) {
      differences.push({
        type: "removed",
        path,
        oldValue: oldObj,
        newValue: newObj,
      });
      return;
    }

    // Handle arrays
    if (Array.isArray(oldObj) || Array.isArray(newObj)) {
      const oldArr = Array.isArray(oldObj) ? oldObj : [];
      const newArr = Array.isArray(newObj) ? newObj : [];

      if (oldArr.length !== newArr.length) {
        structureChanged = true;
      }

      const maxLength = Math.max(oldArr.length, newArr.length);
      for (let i = 0; i < maxLength; i++) {
        const itemPath = `${path}[${i}]`;
        if (i >= oldArr.length) {
          differences.push({
            type: "added",
            path: itemPath,
            oldValue: undefined,
            newValue: newArr[i],
          });
        } else if (i >= newArr.length) {
          differences.push({
            type: "removed",
            path: itemPath,
            oldValue: oldArr[i],
            newValue: undefined,
          });
        } else {
          compareObjects(oldArr[i], newArr[i], itemPath);
        }
      }
      return;
    }

    // Handle objects
    if (typeof oldObj === "object" && typeof newObj === "object") {
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
      
      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in oldObj)) {
          differences.push({
            type: "added",
            path: newPath,
            oldValue: undefined,
            newValue: newObj[key],
          });
          structureChanged = true;
        } else if (!(key in newObj)) {
          differences.push({
            type: "removed",
            path: newPath,
            oldValue: oldObj[key],
            newValue: undefined,
          });
          structureChanged = true;
        } else {
          compareObjects(oldObj[key], newObj[key], newPath);
        }
      }
      return;
    }

    // Handle primitives
    if (oldObj !== newObj) {
      differences.push({
        type: "modified",
        path,
        oldValue: oldObj,
        newValue: newObj,
      });
    }
  }

  compareObjects(oldData, newData);

  const summary = {
    added: differences.filter((d) => d.type === "added").length,
    modified: differences.filter((d) => d.type === "modified").length,
    removed: differences.filter((d) => d.type === "removed").length,
  };

  return {
    versionNumber,
    changeDescription,
    totalDifferences: differences.length,
    structureChanged,
    summary,
    differences,
  };
}

/**
 * Get summary of all version comparisons
 */
export function getVersionComparisonSummary(
  comparisons: VersionComparison[]
): VersionComparisonSummary {
  const summary: VersionComparisonSummary = {
    totalComparisons: comparisons.length,
    totalDifferences: 0,
    added: 0,
    modified: 0,
    removed: 0,
    structureChanges: 0,
    totalVersions: comparisons.length,
    versionsWithChanges: 0,
    averageDifferencesPerVersion: 0,
  };

  comparisons.forEach((comparison) => {
    summary.totalDifferences += comparison.totalDifferences;
    summary.added += comparison.summary.added;
    summary.modified += comparison.summary.modified;
    summary.removed += comparison.summary.removed;
    if (comparison.structureChanged) {
      summary.structureChanges++;
    }
    if (comparison.totalDifferences > 0) {
      summary.versionsWithChanges++;
    }
  });

  summary.averageDifferencesPerVersion = 
    summary.totalComparisons > 0 
      ? Math.round((summary.totalDifferences / summary.totalComparisons) * 100) / 100
      : 0;

  return summary;
}

/**
 * Format a value for display in the debug panel
 */
export function formatValueForDisplay(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  
  if (typeof value === "string") {
    return `"${value}"`;
  }
  
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}

