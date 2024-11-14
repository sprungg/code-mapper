import { glob } from 'glob';
import * as path from 'path';
import { Node, NodeType } from '../models/Node';
import { ProjectGraph } from '../models/ProjectGraph';
import { loadConfig } from '../utils/configLoader';
import { AnalyzerConfig } from '../models/Config';

export class FileAnalyzer {
  private projectGraph: ProjectGraph;
  private config: AnalyzerConfig;

  constructor(private rootPath: string) {
    this.projectGraph = new ProjectGraph();
    this.rootPath = path.resolve(rootPath);
    this.config = loadConfig(this.rootPath);
  }

  async analyze(includeRoot: boolean = false): Promise<ProjectGraph> {
    const files = await glob(this.config.include, {
      cwd: this.rootPath,
      ignore: this.config.ignore,
      absolute: true,
    });

    if (includeRoot) {
      const rootNode: Node = {
        id: this.rootPath,
        type: NodeType.FOLDER,
        name: path.basename(this.rootPath),
        path: this.rootPath,
      };
      this.projectGraph.addNode(rootNode);
    }

    // Process all files and directories
    for (const file of files) {
      const fullPath = path.resolve(file);
      const fileParentPath = path.dirname(fullPath);
      let currentPath = fileParentPath;

      // Create directory chain from file up to root
      const dirs = [];
      while (currentPath.startsWith(this.rootPath) && currentPath !== this.rootPath) {
        dirs.push(currentPath);
        currentPath = path.dirname(currentPath);
      }

      // Add directories from root down
      for (const dirPath of dirs.reverse()) {
        const parentPath = path.dirname(dirPath);
        const dirNode: Node = {
          id: dirPath,
          type: NodeType.FOLDER,
          name: path.basename(dirPath),
          parentId: includeRoot || parentPath !== this.rootPath ? parentPath : undefined,
          path: dirPath,
        };
        this.projectGraph.addNode(dirNode);
      }

      // Add file node
      const fileNode: Node = {
        id: fullPath,
        type: NodeType.FILE,
        name: path.basename(file),
        parentId: includeRoot || fileParentPath !== this.rootPath ? fileParentPath : undefined,
        path: fullPath,
        metadata: {
          extension: path.extname(file),
        },
      };
      this.projectGraph.addNode(fileNode);
    }

    return this.projectGraph;
  }

  getConfig(): AnalyzerConfig {
    return this.config;
  }
}
