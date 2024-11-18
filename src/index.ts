import { FileAnalyzer } from './analyzers/fileAnalyzer';
import { ASTAnalyzer } from './analyzers/astAnalyzer';
import { ProjectGraph } from './models/ProjectGraph';
import { visualizeGraph } from './utils/visualizer';

export async function mapProject(projectPath: string): Promise<ProjectGraph> {
  // Analyze the file structure
  const fileAnalyzer = new FileAnalyzer(projectPath);
  const projectGraph = await fileAnalyzer.analyze();

  // Then analyze the AST of each file
  const astAnalyzer = new ASTAnalyzer(projectGraph, projectPath);
  const { nodes } = projectGraph.toJSON();

  for (const node of nodes) {
    if (
      node.type === 'FILE' &&
      node.path &&
      fileAnalyzer.getConfig().parsable.includes(node.metadata?.extension)
    ) {
      await astAnalyzer.analyzeFile(node.path);
    }
  }

  return projectGraph;
}

export async function logStats(graph: ProjectGraph, rootPath: string): Promise<string> {
  return visualizeGraph(graph, rootPath);
}
