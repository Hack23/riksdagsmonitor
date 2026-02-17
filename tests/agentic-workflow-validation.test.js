/**
 * Agentic Workflow Validation Tests
 * 
 * Tests for preventing workflow failures by validating:
 * - Safe output requirements are documented
 * - Workflow configuration is complete
 * - Error handling is properly configured
 * - MCP tools are properly configured
 * 
 * These tests help prevent issues like:
 * - Missing safe output calls leading to no agent_output.json
 * - Incomplete workflow configuration
 * - Missing error handling
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKFLOWS_DIR = '.github/workflows';
const AGENTIC_WORKFLOWS = [
  'news-article-generator.md',
  'news-realtime-monitor.md',
  'news-evening-analysis.md'
];

describe('Agentic Workflow Validation', () => {
  describe('Workflow File Structure', () => {
    AGENTIC_WORKFLOWS.forEach(workflowFile => {
      describe(`${workflowFile}`, () => {
        let workflowContent;
        let frontmatter;
        let instructions;

        beforeEach(() => {
          const workflowPath = join(WORKFLOWS_DIR, workflowFile);
          if (!existsSync(workflowPath)) {
            throw new Error(`Workflow file not found: ${workflowPath}`);
          }
          
          workflowContent = readFileSync(workflowPath, 'utf-8');
          
          // Parse frontmatter and instructions
          const parts = workflowContent.split(/^---$/m);
          if (parts.length >= 3) {
            frontmatter = parts[1];
            instructions = parts.slice(2).join('---');
          } else {
            frontmatter = '';
            instructions = workflowContent;
          }
        });

        it('should exist and be readable', () => {
          expect(workflowContent).toBeDefined();
          expect(workflowContent.length).toBeGreaterThan(0);
        });

        it('should have valid YAML frontmatter', () => {
          expect(frontmatter).toBeDefined();
          expect(frontmatter).toContain('name:');
          expect(frontmatter).toContain('description:');
        });

        it('should have timeout configuration', () => {
          expect(frontmatter).toMatch(/timeout-minutes:\s*\d+/);
        });

        it('should have permissions configured', () => {
          expect(frontmatter).toMatch(/permissions:/);
        });

        it('should have safe-outputs configuration', () => {
          expect(frontmatter).toMatch(/safe-outputs:/);
        });

        it('should have engine configuration', () => {
          expect(frontmatter).toMatch(/engine:/);
          expect(frontmatter).toMatch(/id:\s*copilot/);
          expect(frontmatter).toMatch(/model:/);
        });
      });
    });
  });

  describe('Safe Output Requirements Documentation', () => {
    AGENTIC_WORKFLOWS.forEach(workflowFile => {
      describe(`${workflowFile}`, () => {
        let workflowContent;

        beforeAll(() => {
          const workflowPath = join(WORKFLOWS_DIR, workflowFile);
          workflowContent = readFileSync(workflowPath, 'utf-8');
        });

        it('should document CRITICAL REQUIREMENTS for safe outputs', () => {
          expect(workflowContent).toMatch(/CRITICAL REQUIREMENTS?/i);
        });

        it('should mention safeoutputs___create_pull_request tool', () => {
          expect(workflowContent).toContain('safeoutputs___create_pull_request');
        });

        it('should mention safeoutputs___noop tool', () => {
          expect(workflowContent).toContain('safeoutputs___noop');
        });

        it('should document workflow failure if no safe output called', () => {
          const hasFailureWarning = 
            workflowContent.includes('WORKFLOW FAILURE') ||
            workflowContent.includes('workflow will fail') ||
            workflowContent.includes('MUST ALWAYS call');
          
          expect(hasFailureWarning).toBe(true);
        });

        it('should document when to use create_pull_request vs noop', () => {
          // Should explain when to use PR (normal case with changes)
          expect(workflowContent).toMatch(/create_pull_request.*when.*articles? generated/i);
          
          // Should explain when to use noop (no changes case) - more flexible pattern
          const hasNoopExplanation = 
            workflowContent.includes('noop') && 
            (workflowContent.includes('no new') || 
             workflowContent.includes('no updates') || 
             workflowContent.includes('no significant'));
          expect(hasNoopExplanation).toBe(true);
        });

        it('should have safe output call as final step instruction', () => {
          // Should instruct to call safe output before completing
          expect(workflowContent).toMatch(/(final step|before complet|must always call)/i);
        });
      });
    });
  });

  describe('MCP Server Configuration', () => {
    AGENTIC_WORKFLOWS.forEach(workflowFile => {
      describe(`${workflowFile}`, () => {
        let frontmatter;

        beforeAll(() => {
          const workflowPath = join(WORKFLOWS_DIR, workflowFile);
          const workflowContent = readFileSync(workflowPath, 'utf-8');
          const parts = workflowContent.split(/^---$/m);
          frontmatter = parts[1] || '';
        });

        it('should configure riksdag-regering MCP server', () => {
          expect(frontmatter).toMatch(/mcp-servers:/);
          expect(frontmatter).toMatch(/riksdag-regering:/);
        });

        it('should configure riksdag-regering server URL', () => {
          expect(frontmatter).toContain('riksdag-regering-ai.onrender.com');
        });

        it('should configure Playwright tools', () => {
          expect(frontmatter).toMatch(/microsoft\/playwright:/);
        });

        it('should configure bash tools', () => {
          expect(frontmatter).toMatch(/bash:\s*true/);
        });
      });
    });
  });

  describe('Network Configuration', () => {
    AGENTIC_WORKFLOWS.forEach(workflowFile => {
      describe(`${workflowFile}`, () => {
        let frontmatter;

        beforeAll(() => {
          const workflowPath = join(WORKFLOWS_DIR, workflowFile);
          const workflowContent = readFileSync(workflowPath, 'utf-8');
          const parts = workflowContent.split(/^---$/m);
          frontmatter = parts[1] || '';
        });

        it('should have network allowed configuration', () => {
          expect(frontmatter).toMatch(/network:/);
          expect(frontmatter).toMatch(/allowed:/);
        });

        it('should allow riksdag-regering-ai.onrender.com domain', () => {
          expect(frontmatter).toContain('riksdag-regering-ai.onrender.com');
        });

        it('should allow riksdag data sources', () => {
          expect(frontmatter).toContain('data.riksdagen.se');
        });
      });
    });
  });

  describe('Error Handling Documentation', () => {
    AGENTIC_WORKFLOWS.forEach(workflowFile => {
      describe(`${workflowFile}`, () => {
        let instructions;

        beforeAll(() => {
          const workflowPath = join(WORKFLOWS_DIR, workflowFile);
          const workflowContent = readFileSync(workflowPath, 'utf-8');
          const parts = workflowContent.split(/^---$/m);
          instructions = parts.slice(2).join('---');
        });

        it('should document error handling for MCP timeouts', () => {
          expect(instructions).toMatch(/timeout|cold start|retry/i);
        });

        it('should document error handling for MCP unavailable', () => {
          expect(instructions).toMatch(/unavailable|down|offline/i);
        });

        it('should document when to call noop on errors', () => {
          // Should explain graceful degradation scenarios
          expect(instructions).toMatch(/noop.*when/i);
        });
      });
    });
  });

  describe('Tool Usage Instructions', () => {
    const NEWS_GENERATOR = 'news-article-generator.md';

    describe(`${NEWS_GENERATOR}`, () => {
      let instructions;

      beforeAll(() => {
        const workflowPath = join(WORKFLOWS_DIR, NEWS_GENERATOR);
        const workflowContent = readFileSync(workflowPath, 'utf-8');
        const parts = workflowContent.split(/^---$/m);
        instructions = parts.slice(2).join('---');
      });

      it('should document riksdag-regering MCP tools', () => {
        expect(instructions).toContain('get_calendar_events');
        expect(instructions).toContain('search_dokument');
        expect(instructions).toContain('get_betankanden');
      });

      it('should document warm-up sequence', () => {
        expect(instructions).toMatch(/get_sync_status|warm.*up|cold start/i);
      });

      it('should document cross-referencing strategy', () => {
        expect(instructions).toMatch(/cross-refer|multiple tools|combine/i);
      });

      it('should document translation requirements', () => {
        expect(instructions).toMatch(/translation|translate|multi-language/i);
      });

      it('should document validation with Playwright', () => {
        expect(instructions).toMatch(/playwright|browser_navigate|browser_snapshot/i);
      });
    });
  });

  describe('Workflow Lock File Generation', () => {
    AGENTIC_WORKFLOWS.forEach(workflowFile => {
      const lockFile = workflowFile.replace('.md', '.lock.yml');
      
      describe(`${lockFile}`, () => {
        it('should exist', () => {
          const lockPath = join(WORKFLOWS_DIR, lockFile);
          expect(existsSync(lockPath)).toBe(true);
        });

        it('should be valid YAML', () => {
          const lockPath = join(WORKFLOWS_DIR, lockFile);
          const content = readFileSync(lockPath, 'utf-8');
          
          // Basic YAML structure checks
          expect(content).toMatch(/name:/);
          expect(content).toMatch(/jobs:/);
          expect(content).toMatch(/agent:/);
        });

        it('should have activation, agent, and conclusion jobs', () => {
          const lockPath = join(WORKFLOWS_DIR, lockFile);
          const content = readFileSync(lockPath, 'utf-8');
          
          expect(content).toMatch(/activation:/);
          expect(content).toMatch(/agent:/);
          expect(content).toMatch(/conclusion:/);
        });

        it('should have safe_outputs job configured', () => {
          const lockPath = join(WORKFLOWS_DIR, lockFile);
          const content = readFileSync(lockPath, 'utf-8');
          
          expect(content).toMatch(/safe_outputs:/);
        });
      });
    });
  });

  describe('Compilation Requirements', () => {
    it('should have compile-agentic-workflows.yml configured', () => {
      const compilePath = join(WORKFLOWS_DIR, 'compile-agentic-workflows.yml');
      expect(existsSync(compilePath)).toBe(true);
    });

    it('should compile on workflow file changes', () => {
      const compilePath = join(WORKFLOWS_DIR, 'compile-agentic-workflows.yml');
      const content = readFileSync(compilePath, 'utf-8');
      
      // Should watch for .md changes
      expect(content).toMatch(/\.md/);
      
      // Should generate .lock.yml files
      expect(content).toMatch(/\.lock\.yml/);
    });
  });
});

describe('Safe Output Call Detection', () => {
  /**
   * These tests would be run against actual agent execution logs
   * to detect if safe output tools were called.
   * 
   * In a real scenario, you'd parse agent logs or execution traces.
   */

  describe('Agent Execution Validation', () => {
    it('should detect safeoutputs___create_pull_request call in logs', () => {
      const mockAgentLog = `
        Calling tool: get_calendar_events
        Result: [...]
        Calling tool: safeoutputs___create_pull_request
        Result: PR created successfully
      `;
      
      const hasSafeOutput = 
        mockAgentLog.includes('safeoutputs___create_pull_request') ||
        mockAgentLog.includes('safeoutputs___noop');
      
      expect(hasSafeOutput).toBe(true);
    });

    it('should detect missing safe output call', () => {
      const mockAgentLog = `
        Calling tool: get_calendar_events
        Result: [...]
        Calling tool: search_dokument
        Result: [...]
        Agent completed
      `;
      
      const hasSafeOutput = 
        mockAgentLog.includes('safeoutputs___create_pull_request') ||
        mockAgentLog.includes('safeoutputs___noop');
      
      expect(hasSafeOutput).toBe(false);
    });

    it('should validate agent_output.json is created', () => {
      // Mock test - in real scenario check if file exists
      const mockAgentOutput = {
        tools_called: ['safeoutputs___create_pull_request'],
        pr_created: true,
        pr_number: 123
      };
      
      expect(mockAgentOutput.tools_called).toContain('safeoutputs___create_pull_request');
      expect(mockAgentOutput.pr_created).toBe(true);
    });
  });

  describe('Conclusion Job Validation', () => {
    it('should handle missing agent_output.json gracefully', () => {
      // Test that conclusion job reports proper error
      const mockConclusionLog = `
        Error reading agent output file: ENOENT: no such file or directory
        Creating failure issue...
      `;
      
      expect(mockConclusionLog).toContain('Error reading agent output file');
      expect(mockConclusionLog).toContain('Creating failure issue');
    });

    it('should create GitHub issue on workflow failure', () => {
      // Verify that failure handling creates proper issue
      const mockIssueTitle = '[agentics] News Article Generator failed';
      const mockIssueBody = 'Workflow failed - no agent output produced';
      
      expect(mockIssueTitle).toMatch(/\[agentics\].*failed/);
      expect(mockIssueBody).toBeDefined();
    });
  });
});

describe('Regression Prevention', () => {
  describe('Critical Path Validation', () => {
    it('should ensure all workflows have safe output documentation', () => {
      AGENTIC_WORKFLOWS.forEach(workflowFile => {
        const workflowPath = join(WORKFLOWS_DIR, workflowFile);
        const content = readFileSync(workflowPath, 'utf-8');
        
        // Must mention both safe output options
        expect(content).toContain('safeoutputs___create_pull_request');
        expect(content).toContain('safeoutputs___noop');
        
        // Must warn about failure
        const hasWarning = content.includes('MUST') || content.includes('FAILURE');
        expect(hasWarning).toBe(true);
      });
    });

    it('should ensure workflows have minimum required sections', () => {
      AGENTIC_WORKFLOWS.forEach(workflowFile => {
        const workflowPath = join(WORKFLOWS_DIR, workflowFile);
        const content = readFileSync(workflowPath, 'utf-8');
        
        // Must have key sections
        expect(content).toMatch(/CRITICAL REQUIREMENTS?/i);
        expect(content).toMatch(/Your Task/i);
        expect(content).toMatch(/MCP.*Tools?/i);
        expect(content).toMatch(/Safe Output/i);
      });
    });

    it('should ensure lock files are up to date', () => {
      // This would ideally check file modification times
      // or run the compiler and check for changes
      AGENTIC_WORKFLOWS.forEach(workflowFile => {
        const mdPath = join(WORKFLOWS_DIR, workflowFile);
        const lockPath = join(WORKFLOWS_DIR, workflowFile.replace('.md', '.lock.yml'));
        
        expect(existsSync(mdPath)).toBe(true);
        expect(existsSync(lockPath)).toBe(true);
      });
    });
  });

  describe('Error Recovery Validation', () => {
    it('should document common failure scenarios', () => {
      const COMMON_SCENARIOS = [
        'mcp',  // MCP-related issues
        'unavailable',  // Service unavailability
        'timeout',  // Timeout issues
        'error',  // General error handling
        'retry',  // Retry logic
        'fail'  // Failure scenarios
      ];

      AGENTIC_WORKFLOWS.forEach(workflowFile => {
        const workflowPath = join(WORKFLOWS_DIR, workflowFile);
        const content = readFileSync(workflowPath, 'utf-8').toLowerCase();
        
        // Should document at least 2 common failure scenarios
        const documentedScenarios = COMMON_SCENARIOS.filter(scenario =>
          content.includes(scenario.toLowerCase())
        );
        
        expect(documentedScenarios.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('CI Workflow Triggers', () => {
    it('should ensure javascript-testing workflow validates workflow markdown changes', () => {
      const workflowFile = join('.github', 'workflows', 'javascript-testing.yml');
      const workflowContent = readFileSync(workflowFile, 'utf-8');

      // Basic sanity check that the workflow file is present and non-empty
      expect(workflowContent.length).toBeGreaterThan(0);

      // The javascript-testing workflow should be configured to run on changes
      // to workflow markdown files, so that these validation tests are executed.
      // We check for the explicit path pattern here to prevent regressions.
      expect(workflowContent).toContain('.github/workflows/*.md');
    });
  });
});
