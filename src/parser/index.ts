import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { GovernanceSchema, GovernanceConfig } from '../schema/governance';

export class GovernanceParser {
  /**
   * Parse and validate a governance.yaml file
   */
  static parseFile(filePath: string): GovernanceConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Governance file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.parseString(content, filePath);
  }

  /**
   * Parse and validate governance YAML from string
   */
  static parseString(content: string, source = 'governance.yaml'): GovernanceConfig {
    let data: any;

    try {
      data = yaml.load(content);
    } catch (error) {
      throw new Error(`YAML parsing error in ${source}: ${(error as Error).message}`);
    }

    try {
      return GovernanceSchema.parse(data);
    } catch (error: any) {
      const message = this.formatValidationError(error, source);
      throw new Error(message);
    }
  }

  /**
   * Format Zod validation errors into helpful messages
   */
  private static formatValidationError(error: any, source: string): string {
    const lines: string[] = [`Validation errors in ${source}:`];

    if (error.errors && Array.isArray(error.errors)) {
      for (const err of error.errors) {
        const path = err.path.join('.');
        const message = err.message;
        lines.push(`  - ${path}: ${message}`);

        // Add helpful suggestions
        if (err.code === 'invalid_enum_value') {
          lines.push(`    Allowed values: ${err.options.join(', ')}`);
        }
      }
    } else {
      lines.push(`  ${error.message}`);
    }

    return lines.join('\n');
  }

  /**
   * Validate without throwing - returns validation result
   */
  static validate(filePath: string): { valid: boolean; errors?: string[] } {
    try {
      this.parseFile(filePath);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [(error as Error).message],
      };
    }
  }
}
