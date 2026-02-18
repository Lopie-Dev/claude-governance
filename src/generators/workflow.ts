import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { GovernanceConfig } from '../schema/governance';

export interface GeneratedWorkflow {
  filename: string;
  content: string;
}

export class WorkflowGenerator {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '..', 'templates', 'workflows');
  }

  /**
   * Generate GitHub Actions workflow from governance config
   */
  generate(config: GovernanceConfig): GeneratedWorkflow {
    const templatePath = path.join(this.templatesDir, 'governance.yml.hbs');
    const template = fs.readFileSync(templatePath, 'utf8');
    const compiled = Handlebars.compile(template);

    // Extract data for template
    const data = {
      projectName: config.project,
      protectedBranches: this.getProtectedBranches(config),
      secretPatterns: config.secrets?.detection?.patterns || [],
      hasTerraform: this.checkTerraformUsage(config),
      dynamodbBillingMode: config.operational?.dynamodb?.billing_mode,
      contractorMembers: this.getContractorMembers(config),
      complianceControls: this.getComplianceControls(config),
    };

    const content = compiled(data);

    return {
      filename: 'governance.yml',
      content,
    };
  }

  /**
   * Extract protected branch names
   */
  private getProtectedBranches(config: GovernanceConfig): string[] {
    const branches = config.operational?.branches?.protected || [];
    return branches.map(b => b.name);
  }

  /**
   * Check if Terraform is used (based on infra approval gates or paths)
   */
  private checkTerraformUsage(config: GovernanceConfig): boolean {
    if (!config.approval_gates) return false;

    for (const gate of config.approval_gates) {
      if (gate.trigger.path_pattern?.includes('.tf') ||
          gate.trigger.path_pattern?.includes('infrastructure/')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get contractor member names
   */
  private getContractorMembers(config: GovernanceConfig): string[] {
    if (!config.roles?.contractor) return [];
    return config.roles.contractor.members || [];
  }

  /**
   * Extract compliance controls for reporting
   */
  private getComplianceControls(config: GovernanceConfig): any[] {
    if (!config.compliance?.frameworks) return [];

    const controls: any[] = [];

    for (const framework of config.compliance.frameworks) {
      for (const control of framework.controls) {
        controls.push({
          id: control.id,
          framework: framework.name,
          description: control.description,
          evidence: control.satisfied_by,
        });
      }
    }

    return controls;
  }
}
