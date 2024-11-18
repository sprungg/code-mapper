import { FileAnalyzer } from './analyzers/fileAnalyzer';
import { ASTAnalyzer } from './analyzers/astAnalyzer';
import { ProjectGraph } from './models/ProjectGraph';
import { visualizeGraph } from './utils/visualizer';
import * as path from 'path';

export async function mapProject(projectPath: string): Promise<ProjectGraph> {
  const projectGraph = new ProjectGraph(projectPath);
  const fileAnalyzer = new FileAnalyzer(projectPath, projectGraph);
  await fileAnalyzer.analyze();

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
