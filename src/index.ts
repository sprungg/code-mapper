import { FileAnalyzer } from './analyzers/fileAnalyzer';
import { ASTAnalyzer } from './analyzers/astAnalyzer';
import { ProjectGraph } from './models/ProjectGraph';
import { visualizeGraph } from './utils/visualizer';
import * as path from 'path';
import { GitAnalyzer } from './analyzers/gitAnalyzer';
import { GitPluginOptions } from './models/Config';

export async function mapProject(
  projectPath: string, 
  options: { plugins?: { git?: boolean | GitPluginOptions } } = {}
): Promise<ProjectGraph> {
  const projectGraph = new ProjectGraph(projectPath);
  const fileAnalyzer = new FileAnalyzer(projectPath, projectGraph);
  await fileAnalyzer.analyze();

  if (options.plugins?.git) {
    const gitOptions = typeof options.plugins.git === 'boolean' 
      ? { enabled: true }
      : options.plugins.git;
    
    const gitAnalyzer = new GitAnalyzer(projectGraph, projectPath, gitOptions);
    await gitAnalyzer.analyze();
  }

  const astAnalyzer = new ASTAnalyzer(projectGraph, projectPath);
  const { nodes } = projectGraph.toJSON();

  for (const node of nodes) {
    if (
      node.type === 'FILE' &&
      node.path &&
      fileAnalyzer.getConfig().parsable.includes(node.metadata?.extension)
    ) {
      await astAnalyzer.analyzeFile(path.join(projectPath, node.path));
    }
  }

  return projectGraph;
}

export async function logStats(graph: ProjectGraph, rootPath: string): Promise<string> {
  return visualizeGraph(graph, rootPath);
}

// CLI usage
if (require.main === module) {
  const projectPath = process.argv[2] || './fixtures';
  const outputPath = process.argv[3];

  if (!projectPath) {
    console.error('Please provide a project path');
    process.exit(1);
  }

  mapProject(projectPath,)
    .then((graph) => {
      return graph.toJSON();
    })
    .then((json) => {
      if (outputPath) {
        const fs = require('fs');
        fs.writeFileSync(outputPath, JSON.stringify(json, null, 2));
        console.log(`Project graph exported to ${outputPath}`);
      } else {
        console.log(JSON.stringify(json, null, 2));
      }
    })
    .catch((error) => {
      console.error('Error analyzing project:', error);
      process.exit(1);
    });
}


// CLI usage
if (require.main === module) {
  const projectPath = process.argv[2] || './fixtures';
  const outputPath = process.argv[3];

  if (!projectPath) {
    console.error('Please provide a project path');
    process.exit(1);
  }

  mapProject(projectPath, { plugins: { git: true } })
    .then((graph) => {
      return graph.toJSON();
    })
    .then((json) => {
      if (outputPath) {
        const fs = require('fs');
        fs.writeFileSync(outputPath, JSON.stringify(json, null, 2));
        console.log(`Project graph exported to ${outputPath}`);
      } else {
        console.log(JSON.stringify(json, null, 2));
      }
    })
    .catch((error) => {
      console.error('Error analyzing project:', error);
      process.exit(1);
    });
}