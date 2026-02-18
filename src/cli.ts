#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { GovernanceParser } from './parser';
import { GovernanceCompiler } from './compiler';

const program = new Command();

program
  .name('claude-governance')
  .description('Governance as Code framework for Claude Code')
  .version('1.0.0');

// Compile command
program
  .command('compile')
  .description('Compile governance.yaml to Claude Code config files')
  .option('-f, --file <path>', 'Path to governance.yaml', 'governance.yaml')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action((options) => {
    console.log(chalk.blue('🔨 Compiling governance configuration...\n'));

    const result = GovernanceCompiler.compile(options.file, options.output);

    if (!result.success) {
      console.error(chalk.red('❌ Compilation failed:\n'));
      result.errors?.forEach(err => console.error(chalk.red(`  ${err}`)));
      process.exit(1);
    }

    console.log(chalk.green('✓ Compilation successful!\n'));
    console.log(chalk.bold('Generated files:'));
    result.files.forEach(file => {
      console.log(chalk.gray(`  ${file.path}`));
    });
    console.log();
  });

// Validate command
program
  .command('validate')
  .description('Validate governance.yaml without compiling')
  .option('-f, --file <path>', 'Path to governance.yaml', 'governance.yaml')
  .action((options) => {
    console.log(chalk.blue('🔍 Validating governance configuration...\n'));

    const result = GovernanceParser.validate(options.file);

    if (!result.valid) {
      console.error(chalk.red('❌ Validation failed:\n'));
      result.errors?.forEach(err => console.error(chalk.red(`  ${err}`)));
      process.exit(1);
    }

    console.log(chalk.green('✓ Validation successful!'));
    console.log(chalk.gray('\nYour governance.yaml is valid and ready to compile.\n'));
  });

// Preview command
program
  .command('preview')
  .description('Preview what files would be generated')
  .option('-f, --file <path>', 'Path to governance.yaml', 'governance.yaml')
  .action((options) => {
    console.log(chalk.blue('👀 Preview mode - no files will be written\n'));

    const result = GovernanceCompiler.preview(options.file);

    if (!result.success) {
      console.error(chalk.red('❌ Preview failed:\n'));
      result.errors?.forEach(err => console.error(chalk.red(`  ${err}`)));
      process.exit(1);
    }

    console.log(chalk.bold('Files that would be generated:\n'));

    result.files.forEach(file => {
      console.log(chalk.cyan(`📄 ${file.path}`));
      console.log(chalk.gray('─'.repeat(60)));
      // Show first 10 lines of content
      const lines = file.content.split('\n').slice(0, 10);
      lines.forEach(line => console.log(chalk.gray(line)));
      if (file.content.split('\n').length > 10) {
        console.log(chalk.gray('...'));
      }
      console.log();
    });
  });

// Init command (create template governance.yaml)
program
  .command('init')
  .description('Initialize governance.yaml from template')
  .option('-t, --template <name>', 'Template to use (startup, soc2, hipaa, enterprise)', 'startup')
  .action((options) => {
    console.log(chalk.blue(`🚀 Initializing governance with ${options.template} template...\n`));

    const templatePath = path.join(__dirname, '..', 'templates', 'compliance', `${options.template}.yaml`);

    if (!fs.existsSync(templatePath)) {
      console.error(chalk.red(`❌ Template not found: ${options.template}`));
      console.error(chalk.gray('\nAvailable templates: startup, soc2, hipaa, enterprise\n'));
      process.exit(1);
    }

    const targetPath = path.join(process.cwd(), 'governance.yaml');

    if (fs.existsSync(targetPath)) {
      console.error(chalk.red('❌ governance.yaml already exists in current directory\n'));
      process.exit(1);
    }

    fs.copyFileSync(templatePath, targetPath);

    console.log(chalk.green('✓ Created governance.yaml\n'));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. Edit governance.yaml to match your project'));
    console.log(chalk.gray('  2. Run: claude-governance validate'));
    console.log(chalk.gray('  3. Run: claude-governance compile\n'));
  });

// Test command (verify hooks work)
program
  .command('test')
  .description('Test generated hooks (coming soon)')
  .action(() => {
    console.log(chalk.yellow('⚠️  Test command coming in v1.1\n'));
  });

program.parse();
