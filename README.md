# Claude Governance

**Governance as Code framework for Claude Code**

Turn compliance requirements into enforceable policies. One YAML file generates hooks, CI workflows, and audit trails.

---

## What It Does

- **Blocks secrets in code** - Detects AWS keys, API tokens, GitHub PATs before commit
- **Enforces file/command permissions** - Block destructive operations, require approval for infra changes
- **Generates CI/CD enforcement** - Same policies enforced in GitHub Actions (tamper-proof)
- **Compliance mapping** - Map policies to SOC 2, HIPAA, PCI controls
- **Audit trails** - Log all tool executions with 7-year retention

## Installation

```bash
npm install -g @lopiedev/claude-governance
```

## Quick Start

```bash
# Initialize with template
claude-governance init --template startup

# Edit governance.yaml to match your project
# ...

# Validate configuration
claude-governance validate

# Compile to Claude Code configs
claude-governance compile

# Generated files:
# .claude/settings.json         - Permission rules + hooks
# .claude/hooks/*.sh             - Hook scripts
# .github/workflows/governance.yml - CI enforcement
# GOVERNANCE.md                  - Documentation
```

## Example: Minimal Governance

```yaml
version: "1.0"
project: "my-app"

permissions:
  filesystem:
    deny:
      - path: ".env*"
        reason: "Use environment variables"

  commands:
    deny:
      - pattern: "rm -rf *"
      - pattern: "git push --force*"

secrets:
  detection:
    patterns:
      - pattern: 'AKIA[0-9A-Z]{16}'
        name: "AWS Access Key"

  enforcement:
    action: "block"

approval_gates:
  - name: "production-deployment"
    trigger:
      command_pattern: "git push .* main"
    action:
      type: "prompt"
      prompt: "Deploy to production?"
```

## What Gets Enforced

| Policy | Hook (Dev) | CI (Pre-merge) | Result |
|--------|------------|----------------|--------|
| **No inline secrets** | ✅ Blocks Write/Edit | ✅ TruffleHog scan | Can't commit secrets |
| **File access control** | ✅ Blocks reads/writes | ❌ Not enforced | Local only |
| **Command restrictions** | ✅ Blocks execution | ❌ Not enforced | Local only |
| **Approval gates** | ✅ Prompts user | ✅ Requires review | Dual enforcement |
| **Audit logs** | ✅ Local logs | ✅ Artifact retention | 7-year trail |

## Templates

```bash
# Minimal (for startups)
claude-governance init --template startup

# SOC 2 compliance
claude-governance init --template soc2

# HIPAA compliance
claude-governance init --template hipaa

# Full enterprise governance
claude-governance init --template enterprise
```

## CLI Commands

```bash
# Initialize
claude-governance init [--template <name>]

# Validate without compiling
claude-governance validate [--file governance.yaml]

# Compile to configs
claude-governance compile [--file governance.yaml] [--output .]

# Preview what would be generated
claude-governance preview [--file governance.yaml]
```

## How It Works

1. **You write `governance.yaml`** - Declare policies in one file
2. **Compiler generates configs** - Creates `.claude/settings.json`, hooks, workflows
3. **Claude Code enforces** - Hooks block violations during development
4. **CI enforces** - GitHub Actions blocks merges that violate policies
5. **Audit trail created** - Every tool execution logged for compliance

## Real Example: MissFit Workflow App

See [templates/compliance/enterprise.yaml](templates/compliance/enterprise.yaml) for a production example with:
- Secret detection (AWS, Anthropic, Stripe, SendGrid)
- Contractor restrictions (no infra access)
- DynamoDB billing enforcement (PAY_PER_REQUEST only)
- Production deployment gates
- SOC 2 + GDPR compliance mapping

## What's Enforceable Today

✅ **100% Enforceable** (Claude Code native):
- File/directory access control
- Command allowlisting/denylisting
- Secret detection and blocking
- Approval gates for specific operations
- Filesystem + network sandboxing
- Audit logging with retention

⚠️ **Partially Enforceable** (requires CI):
- Historical secret scanning
- Cross-repo policy consistency
- Tamper-proof enforcement
- Expensive checks (test suites, security scans)

❌ **Not Supported Yet**:
- Per-user/per-role policies (org-wide only)
- Distributed policy server
- Real-time compliance dashboard

## Development

```bash
git clone https://github.com/Lopie-Dev/claude-governance.git
cd claude-governance
npm install
npm run build
npm test
```

## Architecture

```
governance.yaml
    ↓
[Compiler]
    ↓
    ├─→ .claude/settings.json      (permissions + hooks config)
    ├─→ .claude/hooks/*.sh          (hook scripts)
    ├─→ .github/workflows/*.yml     (CI enforcement)
    └─→ GOVERNANCE.md               (documentation)
```

## License

MIT

## Support

- Issues: https://github.com/Lopie-Dev/claude-governance/issues
- Docs: https://lopie.dev/governance (coming soon)
- Enterprise support: contact@lopie.dev

## About

Built by [Lopie Development](https://lopie.dev) - We help companies ship stalled software projects and build governance frameworks for AI-assisted development.
