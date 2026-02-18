import { GovernanceConfig, PermissionRule } from '../schema/governance';

interface ClaudeSettings {
  permissions?: {
    allow?: string[];
    deny?: string[];
    ask?: string[];
  };
  sandbox?: {
    enabled?: boolean;
    mode?: string;
    allowedDomains?: string[];
    blockedDomains?: string[];
    allowedPaths?: string[];
    blockedPaths?: string[];
    excludedCommands?: string[];
  };
  hooks?: Record<string, any[]>;
  defaultMode?: string;
}

export class SettingsGenerator {
  /**
   * Generate .claude/settings.json from governance config
   */
  static generate(config: GovernanceConfig): ClaudeSettings {
    const settings: ClaudeSettings = {};

    // Generate permissions
    if (config.permissions) {
      settings.permissions = this.generatePermissions(config);
    }

    // Generate sandbox config
    if (config.sandbox?.enabled) {
      settings.sandbox = this.generateSandbox(config);
    }

    // Generate hooks configuration
    const hooks = this.generateHooksConfig(config);
    if (Object.keys(hooks).length > 0) {
      settings.hooks = hooks;
    }

    return settings;
  }

  /**
   * Generate permissions section
   */
  private static generatePermissions(config: GovernanceConfig): ClaudeSettings['permissions'] {
    const permissions: ClaudeSettings['permissions'] = {};

    // Filesystem permissions
    if (config.permissions?.filesystem) {
      const { deny, ask, allow } = config.permissions.filesystem;

      if (deny && deny.length > 0) {
        permissions.deny = permissions.deny || [];
        permissions.deny.push(...deny.map(r => this.formatFilePermission(r, 'Read|Write|Edit')));
      }

      if (ask && ask.length > 0) {
        permissions.ask = permissions.ask || [];
        permissions.ask.push(...ask.map(r => this.formatFilePermission(r, 'Read|Write|Edit')));
      }

      if (allow && allow.length > 0) {
        permissions.allow = permissions.allow || [];
        permissions.allow.push(...allow.map(r => this.formatFilePermission(r, 'Read|Write|Edit')));
      }
    }

    // Command permissions
    if (config.permissions?.commands) {
      const { deny, ask, allow } = config.permissions.commands;

      if (deny && deny.length > 0) {
        permissions.deny = permissions.deny || [];
        permissions.deny.push(...deny.map(r => this.formatBashPermission(r)));
      }

      if (ask && ask.length > 0) {
        permissions.ask = permissions.ask || [];
        permissions.ask.push(...ask.map(r => this.formatBashPermission(r)));
      }

      if (allow && allow.length > 0) {
        permissions.allow = permissions.allow || [];
        permissions.allow.push(...allow.map(r => this.formatBashPermission(r)));
      }
    }

    return permissions;
  }

  /**
   * Format filesystem permission rule
   */
  private static formatFilePermission(rule: PermissionRule, tools: string): string {
    if (!rule.path) {
      throw new Error('Filesystem permission rule must have a path');
    }

    // Handle glob patterns
    if (rule.path.includes('*')) {
      return `${tools}(${rule.path})`;
    }

    return `${tools}(${rule.path})`;
  }

  /**
   * Format bash command permission rule
   */
  private static formatBashPermission(rule: PermissionRule): string {
    if (!rule.pattern) {
      throw new Error('Command permission rule must have a pattern');
    }

    return `Bash(${rule.pattern})`;
  }

  /**
   * Generate sandbox configuration
   */
  private static generateSandbox(config: GovernanceConfig): ClaudeSettings['sandbox'] {
    const sandbox: ClaudeSettings['sandbox'] = {
      enabled: true,
    };

    if (!config.sandbox) {
      return sandbox;
    }

    if (config.sandbox.mode) {
      sandbox.mode = config.sandbox.mode;
    }

    // Network sandbox
    if (config.permissions?.network) {
      if (config.permissions.network.allowed_domains) {
        sandbox.allowedDomains = config.permissions.network.allowed_domains;
      }
      if (config.permissions.network.blocked_domains) {
        sandbox.blockedDomains = config.permissions.network.blocked_domains;
      }
    }

    // Filesystem sandbox
    if (config.sandbox.filesystem) {
      if (config.sandbox.filesystem.allowed_paths) {
        sandbox.allowedPaths = config.sandbox.filesystem.allowed_paths;
      }
      if (config.sandbox.filesystem.blocked_paths) {
        sandbox.blockedPaths = config.sandbox.filesystem.blocked_paths;
      }
    }

    // Excluded commands
    if (config.sandbox.excluded_commands) {
      sandbox.excludedCommands = config.sandbox.excluded_commands;
    }

    return sandbox;
  }

  /**
   * Generate hooks configuration
   */
  private static generateHooksConfig(config: GovernanceConfig): Record<string, any[]> {
    const hooks: Record<string, any[]> = {};

    if (!config.approval_gates || config.approval_gates.length === 0) {
      return hooks;
    }

    // Group gates by hook event (PreToolUse, PostToolUse, etc.)
    for (const gate of config.approval_gates) {
      // Determine which hook event this gate belongs to
      let hookEvent = 'PreToolUse'; // Default for approval gates

      if (gate.trigger.command_pattern) {
        hookEvent = 'PreToolUse'; // Bash commands
      } else if (gate.trigger.path_pattern) {
        hookEvent = 'PreToolUse'; // File operations
      }

      // Determine matcher (what tool this applies to)
      let matcher = '';
      if (gate.trigger.tool) {
        matcher = gate.trigger.tool;
      } else if (gate.trigger.command_pattern) {
        matcher = 'Bash';
      } else if (gate.trigger.path_pattern) {
        matcher = 'Edit|Write';
      }

      // Create hook configuration
      const hookConfig: any = {
        type: gate.action.type,
      };

      if (gate.action.command) {
        hookConfig.command = gate.action.command;
      }

      if (gate.action.prompt) {
        hookConfig.prompt = gate.action.prompt;
      }

      if (gate.action.timeout) {
        hookConfig.timeout = gate.action.timeout;
      }

      // Add to hooks configuration
      if (!hooks[hookEvent]) {
        hooks[hookEvent] = [];
      }

      hooks[hookEvent].push({
        matcher,
        hooks: [hookConfig],
      });
    }

    return hooks;
  }

  /**
   * Format settings as JSON string
   */
  static toJSON(settings: ClaudeSettings): string {
    return JSON.stringify(settings, null, 2);
  }
}
