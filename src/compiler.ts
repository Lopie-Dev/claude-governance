import * as fs from 'fs';
import * as path from 'path';
import { GovernanceParser } from './parser';
import { SettingsGenerator } from './generators/settings';
import { HooksGenerator } from './generators/hooks';
import { WorkflowGenerator } from './generators/workflow';
import { GovernanceConfig } from './schema/governance';

export interface CompilationResult {
  success: boolean;
  files: CompilationFile[];
  errors?: string[];
}

export interface CompilationFile {
  path: string;
  content: string;
  executable?: boolean;
}

export class GovernanceCompiler {
  /**
   * Compile governance.yaml into Claude Code config files
   */
  static compile(governancePath: string, outputDir: string): CompilationResult {
    try {
      // Parse governance.yaml
      const config = GovernanceParser.parseFile(governancePath);

      // Generate files
      const files = this.generateFiles(config, outputDir);

      // Write files to disk
      this.writeFiles(files, outputDir);

      return {
        success: true,
        files,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate all output files from config
   */
  private static generateFiles(config: GovernanceConfig, baseDir: string): CompilationFile[] {
    const files: CompilationFile[] = [];

    // Generate .claude/settings.json
    const settings = SettingsGenerator.generate(config);
    files.push({
      path: '.claude/settings.json',
      content: SettingsGenerator.toJSON(settings),
    });

    // Generate hook scripts
    const hooksGen = new HooksGenerator();
    const hooks = hooksGen.generate(config);
    for (const hook of hooks) {
      files.push({
        path: `.claude/hooks/${hook.filename}`,
        content: hook.content,
        executable: hook.executable,
      });
    }

    // Generate GitHub Actions workflow
    const workflowGen = new WorkflowGenerator();
    const workflow = workflowGen.generate(config);
    files.push({
      path: `.github/workflows/${workflow.filename}`,
      content: workflow.content,
    });

    // Generate documentation
    files.push({
      path: 'GOVERNANCE.md',
      content: this.generateDocumentation(config),
    });

    return files;
  }

  /**
   * Write files to disk
   */
  private static writeFiles(files: CompilationFile[], baseDir: string): void {
    for (const file of files) {
      const fullPath = path.join(baseDir, file.path);
      const dir = path.dirname(fullPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(fullPath, file.content, 'utf8');

      // Make executable if needed (Unix-like systems)
      if (file.executable && process.platform !== 'win32') {
        fs.chmodSync(fullPath, 0o755);
      }
    }
  }

  /**
   * Generate documentation file
   */
  private static generateDocumentation(config: GovernanceConfig): string {
    let doc = '# Governance Documentation\n\n';
    doc += `Project: ${config.project}\n\n`;

    if (config.description) {
      doc += `${config.description}\n\n`;
    }

    doc += '## Overview\n\n';
    doc += 'This project uses Claude Code Governance framework for:\n\n';
    doc += '- Automated policy enforcement during development\n';
    doc += '- CI/CD integration for tamper-proof checks\n';
    doc += '- Compliance control mapping and audit trails\n\n';

    // Document permissions
    if (config.permissions) {
      doc += '## Permissions\n\n';

      if (config.permissions.filesystem) {
        doc += '### Filesystem Access\n\n';

        if (config.permissions.filesystem.deny && config.permissions.filesystem.deny.length > 0) {
          doc += '**Blocked paths:**\n';
          for (const rule of config.permissions.filesystem.deny) {
            doc += `- \`${rule.path}\``;
            if (rule.reason) doc += ` - ${rule.reason}`;
            doc += '\n';
          }
          doc += '\n';
        }

        if (config.permissions.filesystem.ask && config.permissions.filesystem.ask.length > 0) {
          doc += '**Requires approval:**\n';
          for (const rule of config.permissions.filesystem.ask) {
            doc += `- \`${rule.path}\``;
            if (rule.reason) doc += ` - ${rule.reason}`;
            doc += '\n';
          }
          doc += '\n';
        }
      }

      if (config.permissions.commands) {
        doc += '### Command Restrictions\n\n';

        if (config.permissions.commands.deny && config.permissions.commands.deny.length > 0) {
          doc += '**Blocked commands:**\n';
          for (const rule of config.permissions.commands.deny) {
            doc += `- \`${rule.pattern}\``;
            if (rule.reason) doc += ` - ${rule.reason}`;
            doc += '\n';
          }
          doc += '\n';
        }
      }
    }

    // Document approval gates
    if (config.approval_gates && config.approval_gates.length > 0) {
      doc += '## Approval Gates\n\n';
      for (const gate of config.approval_gates) {
        doc += `### ${gate.name}\n\n`;
        doc += `**Trigger:** `;
        if (gate.trigger.path_pattern) {
          doc += `Files matching \`${gate.trigger.path_pattern}\``;
        } else if (gate.trigger.command_pattern) {
          doc += `Commands matching \`${gate.trigger.command_pattern}\``;
        }
        doc += '\n\n';

        doc += `**Action:** ${gate.action.type}\n\n`;
      }
    }

    // Document compliance
    if (config.compliance?.frameworks && config.compliance.frameworks.length > 0) {
      doc += '## Compliance\n\n';
      for (const framework of config.compliance.frameworks) {
        doc += `### ${framework.name}\n\n`;
        for (const control of framework.controls) {
          doc += `**${control.id}:** ${control.description}\n`;
          doc += `- Satisfied by: ${control.satisfied_by.join(', ')}\n\n`;
        }
      }
    }

    doc += '---\n\n';
    doc += '*Auto-generated by [claude-governance](https://github.com/Lopie-Dev/claude-governance)*\n';

    return doc;
  }

  /**
   * Dry-run compilation (don't write files)
   */
  static preview(governancePath: string): CompilationResult {
    try {
      const config = GovernanceParser.parseFile(governancePath);
      const files = this.generateFiles(config, '.');

      return {
        success: true,
        files,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        errors: [(error as Error).message],
      };
    }
  }
}
