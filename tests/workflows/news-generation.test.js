/**
 * Unit Tests for News Generation Workflow Logic
 * 
 * Tests workflow decision logic that would normally be in news-generation.yml:
 * - Language expansion presets (nordic, eu-core, all)
 * - Timestamp commit logic (when to commit, when to skip)
 * - Error detection and classification
 * - PR creation conditions
 * - Agentic workflow coordination
 */

import { describe, it, expect } from 'vitest';

/**
 * Language expansion logic from workflow
 * Expands preset names to actual language codes
 */
export function expandLanguagePreset(preset) {
  const presets = {
    'nordic': ['en', 'sv', 'da', 'no', 'fi'],
    'eu-core': ['en', 'sv', 'de', 'fr', 'es', 'nl'],
    'all': ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']
  };
  
  return presets[preset] || preset.split(',').map(l => l.trim());
}

/**
 * Timestamp commit logic from workflow
 * Determines if timestamp should be committed to main branch
 */
export function shouldCommitTimestamp({ shouldGenerate, articlesGenerated, lastGenerationHours = null }) {
  // Only commit timestamp when:
  // 1. Generation was attempted (should_generate=true)
  // 2. Zero articles generated (no new content)
  // 3. Need to mark this time slot as "checked" to prevent immediate retry
  
  if (!shouldGenerate) {
    return false; // Don't commit if we didn't attempt generation
  }
  
  if (articlesGenerated > 0) {
    return false; // Don't commit if articles were generated (PR handles it)
  }
  
  // Commit when 0 articles generated to prevent retry loops
  return true;
}

/**
 * Error type detection from workflow logs
 * Classifies errors by type and severity
 */
export function detectErrorType(errorMessage) {
  if (!errorMessage) return null;
  
  const errorMsg = errorMessage.toLowerCase();
  
  if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
    return 'script_missing';
  }
  
  if (errorMsg.includes('mcp') && (errorMsg.includes('timeout') || errorMsg.includes('unavailable'))) {
    return 'mcp_unavailable';
  }
  
  if (errorMsg.includes('failed') || errorMsg.includes('error')) {
    return 'script_failure';
  }
  
  return 'unknown';
}

/**
 * Error severity classification
 */
export function getErrorSeverity(errorType) {
  const severityMap = {
    'script_missing': 'critical',
    'mcp_unavailable': 'warning',
    'script_failure': 'error',
    'unknown': 'error'
  };
  
  return severityMap[errorType] || 'error';
}

/**
 * PR creation decision logic
 * Determines if PR should be created
 */
export function shouldCreatePR({ generated, success, hasTimestampOnly = false }) {
  // Only create PR when:
  // 1. Articles were generated (> 0)
  // 2. Generation succeeded
  // 3. Not just timestamp changes
  
  if (!success) {
    return false; // Don't create PR on failure
  }
  
  if (generated === 0 || generated === '0') {
    return false; // Don't create PR when no articles
  }
  
  if (hasTimestampOnly) {
    return false; // Don't create PR for timestamp-only changes
  }
  
  return true;
}

/**
 * Agentic workflow activity check
 * Determines if recent agentic workflow activity exists
 */
export function hasRecentAgenticActivity(workflowState, thresholdHours = 2) {
  if (!workflowState || !workflowState.lastUpdate) {
    return false;
  }
  
  const lastUpdate = new Date(workflowState.lastUpdate);
  const now = new Date();
  const hoursAgo = (now - lastUpdate) / (1000 * 60 * 60);
  
  return hoursAgo < thresholdHours;
}

/**
 * Should skip traditional workflow due to agentic activity
 */
export function shouldSkipTraditionalWorkflow(workflowState, shouldGenerate) {
  if (!shouldGenerate) {
    return true; // Skip if we wouldn't generate anyway
  }
  
  return hasRecentAgenticActivity(workflowState, 2);
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('News Generation Workflow Logic', () => {
  describe('Language Expansion', () => {
    it('should expand "nordic" preset to 5 Nordic languages', () => {
      const expanded = expandLanguagePreset('nordic');
      expect(expanded).toEqual(['en', 'sv', 'da', 'no', 'fi']);
      expect(expanded).toHaveLength(5);
    });
    
    it('should expand "eu-core" preset to 6 EU core languages', () => {
      const expanded = expandLanguagePreset('eu-core');
      expect(expanded).toEqual(['en', 'sv', 'de', 'fr', 'es', 'nl']);
      expect(expanded).toHaveLength(6);
    });
    
    it('should expand "all" preset to all 14 languages', () => {
      const expanded = expandLanguagePreset('all');
      expect(expanded).toEqual(['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']);
      expect(expanded).toHaveLength(14);
    });
    
    it('should handle custom comma-separated languages', () => {
      const expanded = expandLanguagePreset('en,de,fr');
      expect(expanded).toEqual(['en', 'de', 'fr']);
    });
    
    it('should trim whitespace from custom languages', () => {
      const expanded = expandLanguagePreset('en, de, fr');
      expect(expanded).toEqual(['en', 'de', 'fr']);
    });
  });
  
  describe('Timestamp Commit Logic', () => {
    it('should commit timestamp when 0 articles generated and generation attempted', () => {
      const shouldCommit = shouldCommitTimestamp({
        shouldGenerate: true,
        articlesGenerated: 0
      });
      expect(shouldCommit).toBe(true);
    });
    
    it('should NOT commit timestamp when articles were generated', () => {
      const shouldCommit = shouldCommitTimestamp({
        shouldGenerate: true,
        articlesGenerated: 5
      });
      expect(shouldCommit).toBe(false);
    });
    
    it('should NOT commit timestamp when generation was skipped', () => {
      const shouldCommit = shouldCommitTimestamp({
        shouldGenerate: false,
        articlesGenerated: 0
      });
      expect(shouldCommit).toBe(false);
    });
    
    it('should NOT commit when many articles generated', () => {
      const shouldCommit = shouldCommitTimestamp({
        shouldGenerate: true,
        articlesGenerated: 10
      });
      expect(shouldCommit).toBe(false);
    });
    
    it('should commit when generation attempted but no content available', () => {
      // This is the key case: prevents infinite retry loops
      const shouldCommit = shouldCommitTimestamp({
        shouldGenerate: true,
        articlesGenerated: 0,
        lastGenerationHours: 6
      });
      expect(shouldCommit).toBe(true);
    });
  });
  
  describe('Error Detection and Classification', () => {
    it('should detect script_missing error', () => {
      const errorType = detectErrorType('scripts/generate-news-enhanced.js not found');
      expect(errorType).toBe('script_missing');
      expect(getErrorSeverity(errorType)).toBe('critical');
    });
    
    it('should detect script_missing error with "does not exist"', () => {
      const errorType = detectErrorType('File does not exist: scripts/generate.js');
      expect(errorType).toBe('script_missing');
      expect(getErrorSeverity(errorType)).toBe('critical');
    });
    
    it('should detect mcp_unavailable error', () => {
      const errorType = detectErrorType('MCP server timeout after 30s');
      expect(errorType).toBe('mcp_unavailable');
      expect(getErrorSeverity(errorType)).toBe('warning');
    });
    
    it('should detect mcp_unavailable with "unavailable" keyword', () => {
      const errorType = detectErrorType('riksdag-regering-mcp unavailable');
      expect(errorType).toBe('mcp_unavailable');
      expect(getErrorSeverity(errorType)).toBe('warning');
    });
    
    it('should detect generic script_failure error', () => {
      const errorType = detectErrorType('Generation failed with exit code 1');
      expect(errorType).toBe('script_failure');
      expect(getErrorSeverity(errorType)).toBe('error');
    });
    
    it('should return unknown for unrecognized errors', () => {
      const errorType = detectErrorType('Something went wrong');
      expect(errorType).toBe('unknown');
      expect(getErrorSeverity(errorType)).toBe('error');
    });
    
    it('should return null for no error message', () => {
      const errorType = detectErrorType(null);
      expect(errorType).toBe(null);
    });
  });
  
  describe('PR Creation Logic', () => {
    it('should create PR when articles generated and succeeded', () => {
      const shouldCreate = shouldCreatePR({ 
        generated: 5, 
        success: true 
      });
      expect(shouldCreate).toBe(true);
    });
    
    it('should NOT create PR when 0 articles generated', () => {
      const shouldCreate = shouldCreatePR({ 
        generated: 0, 
        success: true 
      });
      expect(shouldCreate).toBe(false);
    });
    
    it('should NOT create PR when generation failed', () => {
      const shouldCreate = shouldCreatePR({ 
        generated: 5, 
        success: false 
      });
      expect(shouldCreate).toBe(false);
    });
    
    it('should NOT create PR for timestamp-only changes', () => {
      const shouldCreate = shouldCreatePR({ 
        generated: 0, 
        success: true,
        hasTimestampOnly: true
      });
      expect(shouldCreate).toBe(false);
    });
    
    it('should handle string "0" as zero articles', () => {
      const shouldCreate = shouldCreatePR({ 
        generated: '0', 
        success: true 
      });
      expect(shouldCreate).toBe(false);
    });
  });
  
  describe('Agentic Workflow Coordination', () => {
    it('should detect recent agentic activity within 2 hours', () => {
      const workflowState = {
        lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      };
      
      const hasActivity = hasRecentAgenticActivity(workflowState, 2);
      expect(hasActivity).toBe(true);
    });
    
    it('should NOT detect recent activity beyond threshold', () => {
      const workflowState = {
        lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      };
      
      const hasActivity = hasRecentAgenticActivity(workflowState, 2);
      expect(hasActivity).toBe(false);
    });
    
    it('should handle missing workflow state', () => {
      const hasActivity = hasRecentAgenticActivity(null, 2);
      expect(hasActivity).toBe(false);
    });
    
    it('should handle missing lastUpdate field', () => {
      const workflowState = {};
      const hasActivity = hasRecentAgenticActivity(workflowState, 2);
      expect(hasActivity).toBe(false);
    });
    
    it('should skip traditional workflow when agentic activity recent', () => {
      const workflowState = {
        lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      };
      
      const shouldSkip = shouldSkipTraditionalWorkflow(workflowState, true);
      expect(shouldSkip).toBe(true);
    });
    
    it('should NOT skip when agentic activity old', () => {
      const workflowState = {
        lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      };
      
      const shouldSkip = shouldSkipTraditionalWorkflow(workflowState, true);
      expect(shouldSkip).toBe(false);
    });
    
    it('should skip when generation not needed anyway', () => {
      const workflowState = null;
      
      const shouldSkip = shouldSkipTraditionalWorkflow(workflowState, false);
      expect(shouldSkip).toBe(true);
    });
  });
});
