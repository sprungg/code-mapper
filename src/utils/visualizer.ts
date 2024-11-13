import { ProjectGraph } from '../models/ProjectGraph';
import { NodeType } from '../models/Node';
import { RelationType } from '../models/Relationship';
import * as path from 'path';
export function visualizeGraph(graph: ProjectGraph, rootPath: string): string {
  const { nodes, relationships } = graph.toJSON();

  let output = '\n=== Project Structure Analysis ===\n\n';

  // Print Files and Folders
  output += '📁 Files and Folders:\n';
  nodes.forEach((node) => {
    const relativePath = path.relative(rootPath, node.path || '');
    const prefix = node.type === NodeType.FOLDER ? '📂' : '📄';
    output += `${prefix} ${relativePath || path.basename(rootPath)}\n`;
  });

  // Print Dependencies
  output += '\n🔗 Dependencies:\n';
  relationships
    .filter((rel) => rel.type === RelationType.IMPORTS)
    .forEach((rel) => {
      const sourceFile = path.relative(rootPath, rel.sourceId);
      const targetFile = path.relative(rootPath, rel.targetId);
      output += `${sourceFile} → ${targetFile}\n`;
    });

  // Print Statistics
  output += '\n📊 Statistics:\n';
  const fileCount = nodes.filter((n) => n.type === NodeType.FILE).length;
  const folderCount = nodes.filter((n) => n.type === NodeType.FOLDER).length;
  const importCount = relationships.filter((r) => r.type === RelationType.IMPORTS).length;

  output += `Total Files: ${fileCount}\n`;
  output += `Total Folders: ${folderCount}\n`;
  output += `Total Import Dependencies: ${importCount}`;

  return output;
}
