#!/usr/bin/env node

import { mapProject } from './index';
import path from 'path';
import fs from 'fs';
import { GitPluginOptions } from './models/Config';

interface CLIOptions {
  projectPath: string;
  outputFormat: 'text' | 'json';
  outputPath?: string;
  plugins?: {
    git?: boolean | GitPluginOptions;
  };
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    projectPath: '.',
    outputFormat: 'text',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      switch (arg) {
        case '--git':
          options.plugins = {
            ...options.plugins,
            git: true,
          };
          break;
        case '--git-no-message':
          options.plugins = {
            ...options.plugins,
            git: { enabled: true, includeCommitMessage: false },
          };
          break;
        case '--output':
        case '-o':
          options.outputPath = args[++i];
          break;
        case '--format':
        case '-f':
          options.outputFormat = (args[++i] as 'text' | 'json') || 'text';
          break;
        default:
          if (arg.startsWith('--git-history=')) {
            const maxHistory = parseInt(arg.split('=')[1], 10);
            options.plugins = {
              ...options.plugins,
              git: { enabled: true, maxHistory },
            };
          }
      }
    } else if (!arg.startsWith('-')) {
      options.projectPath = arg;
    }
  }

  return options;
}

async function run(): Promise<void> {
  try {
    const options = parseArgs();
    const absolutePath = path.resolve(options.projectPath);
    
    const graph = await mapProject(absolutePath, {
      plugins: options.plugins,
    });

    let output: string;
    if (options.outputFormat === 'json') {
      output = JSON.stringify(graph.toJSON(), null, 2);
    } else {
      const { visualizeGraph } = await import('./utils/visualizer');
      output = visualizeGraph(graph, absolutePath);
    }

    if (options.outputPath) {
      fs.writeFileSync(options.outputPath, output);
      console.log(`Output written to ${options.outputPath}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

run();
