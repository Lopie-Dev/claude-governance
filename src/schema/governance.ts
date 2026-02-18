import { z } from 'zod';

// Permission rule schema
const PermissionRuleSchema = z.object({
  path: z.string().optional(),
  pattern: z.string().optional(),
  reason: z.string().optional(),
});

// Filesystem permissions
const FilesystemPermissionsSchema = z.object({
  deny: z.array(PermissionRuleSchema).optional(),
  ask: z.array(PermissionRuleSchema).optional(),
  allow: z.array(PermissionRuleSchema).optional(),
});

// Command permissions
const CommandPermissionsSchema = z.object({
  deny: z.array(PermissionRuleSchema).optional(),
  ask: z.array(PermissionRuleSchema).optional(),
  allow: z.array(PermissionRuleSchema).optional(),
});

// Network permissions
const NetworkPermissionsSchema = z.object({
  allowed_domains: z.array(z.string()).optional(),
  blocked_domains: z.array(z.string()).optional(),
});

// Permissions section
const PermissionsSchema = z.object({
  filesystem: FilesystemPermissionsSchema.optional(),
  commands: CommandPermissionsSchema.optional(),
  network: NetworkPermissionsSchema.optional(),
});

// Secrets detection
const SecretPatternSchema = z.object({
  pattern: z.string(),
  name: z.string().optional(),
});

const SecretsSchema = z.object({
  policy: z.string().optional(),
  allowed_sources: z.array(z.string()).optional(),
  detection: z.object({
    patterns: z.array(SecretPatternSchema).optional(),
  }).optional(),
  enforcement: z.object({
    hook: z.string().optional(),
    action: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});

// Approval gate action
const ApprovalGateActionSchema = z.object({
  type: z.enum(['command', 'prompt', 'agent']),
  command: z.string().optional(),
  prompt: z.string().optional(),
  timeout: z.number().optional(),
});

// Approval gate trigger
const ApprovalGateTriggerSchema = z.object({
  tool: z.string().optional(),
  path_pattern: z.string().optional(),
  command_pattern: z.string().optional(),
});

// Approval gate
const ApprovalGateSchema = z.object({
  name: z.string(),
  trigger: ApprovalGateTriggerSchema,
  action: ApprovalGateActionSchema,
});

// Audit logging
const AuditSchema = z.object({
  enabled: z.boolean().optional(),
  events: z.array(z.string()).optional(),
  destinations: z.array(z.object({
    type: z.string(),
    path: z.string().optional(),
    bucket: z.string().optional(),
    prefix: z.string().optional(),
    profile: z.string().optional(),
    endpoint: z.string().optional(),
    headers: z.record(z.string()).optional(),
  })).optional(),
  required_fields: z.array(z.string()).optional(),
  retention: z.string().optional(),
});

// Sandbox
const SandboxSchema = z.object({
  enabled: z.boolean().optional(),
  mode: z.enum(['auto-allow', 'regular']).optional(),
  filesystem: z.object({
    allowed_paths: z.array(z.string()).optional(),
    blocked_paths: z.array(z.string()).optional(),
  }).optional(),
  network: z.object({
    inherit_from: z.string().optional(),
  }).optional(),
  excluded_commands: z.array(z.string()).optional(),
});

// Compliance control
const ComplianceControlSchema = z.object({
  id: z.string(),
  description: z.string(),
  satisfied_by: z.array(z.string()),
});

// Compliance framework
const ComplianceFrameworkSchema = z.object({
  name: z.string(),
  controls: z.array(ComplianceControlSchema),
});

// Role restrictions
const RoleSchema = z.object({
  members: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  additional_gates: z.array(ApprovalGateSchema).optional(),
  behavior: z.array(z.string()).optional(),
});

// Main governance schema
export const GovernanceSchema = z.object({
  version: z.string(),
  project: z.string(),
  description: z.string().optional(),

  data_classification: z.record(z.array(z.string())).optional(),

  permissions: PermissionsSchema.optional(),
  secrets: SecretsSchema.optional(),
  approval_gates: z.array(ApprovalGateSchema).optional(),

  operational: z.object({
    branches: z.object({
      protected: z.array(z.object({
        name: z.string(),
        requires: z.record(z.any()),
      })).optional(),
    }).optional(),
    deployment: z.object({
      sequence: z.array(z.object({
        environment: z.string(),
        branch: z.string(),
        auto_deploy: z.boolean().optional(),
        gates: z.array(z.string()).optional(),
      })).optional(),
    }).optional(),
    dynamodb: z.object({
      billing_mode: z.string(),
      enforcement: z.string(),
      reason: z.string().optional(),
    }).optional(),
    git: z.object({
      no_claude_attribution: z.boolean().optional(),
      reason: z.string().optional(),
    }).optional(),
  }).optional(),

  testing: z.object({
    required_before_commit: z.array(z.object({
      name: z.string(),
      command: z.string(),
      directories: z.array(z.string()).optional(),
    })).optional(),
    required_before_merge: z.array(z.object({
      name: z.string(),
      command: z.string(),
      directories: z.array(z.string()).optional(),
    })).optional(),
    enforcement: z.object({
      hook: z.string(),
      action: z.string(),
      prompt: z.string().optional(),
    }).optional(),
  }).optional(),

  roles: z.record(RoleSchema).optional(),

  audit: AuditSchema.optional(),
  sandbox: SandboxSchema.optional(),

  compliance: z.object({
    frameworks: z.array(ComplianceFrameworkSchema).optional(),
  }).optional(),

  cost_controls: z.record(z.array(z.object({
    resource: z.string().optional(),
    policy: z.string().optional(),
    alert_threshold: z.string().optional(),
    action: z.string().optional(),
    enforcement: z.string().optional(),
  }))).optional(),
});

export type GovernanceConfig = z.infer<typeof GovernanceSchema>;
export type PermissionRule = z.infer<typeof PermissionRuleSchema>;
export type ApprovalGate = z.infer<typeof ApprovalGateSchema>;
export type SecretPattern = z.infer<typeof SecretPatternSchema>;
