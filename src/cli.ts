#!/usr/bin/env node

import { mapProject } from './index';
import path from 'path';
import fs from 'fs';

async function run(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const projectPath = args[0] || '.';
    const outputFormat = args[1]?.toLowerCase() || 'text';
    const outputPath = args[2];

    const absolutePath = path.resolve(projectPath);
    const graph = await mapProject(absolutePath);

    let output: string;
    if (outputFormat === 'json') {
      output = JSON.stringify(graph.toJSON(), null, 2);
    } else {
      // Use the existing visualizer for text output
      const { visualizeGraph } = await import('./utils/visualizer');
      output = visualizeGraph(graph, absolutePath);
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, output);
      console.log(`Output written to ${outputPath}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

run();
