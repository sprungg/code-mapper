import { parse, ParserOptions } from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import { ProjectGraph } from '../models/ProjectGraph';
import { Relationship, RelationType } from '../models/Relationship';
import * as path from 'path';

export class ASTAnalyzer {
  private extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.mjs', '.cjs'];

  constructor(private projectGraph: ProjectGraph) {}

  async analyzeFile(filePath: string): Promise<void> {
    // Parse imports
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const ast = parse(content, {
        sourceType: "unambiguous",
        plugins: this.determinePlugins(filePath) as ParserOptions['plugins'],
      });

      traverse(ast, {
        // Handle ES6 imports
        ImportDeclaration: (path) => {
          const importPath = path.node.source.value;
          const resolvedPath = this.resolveImportPath(filePath, importPath);

          if (resolvedPath) {
            const relationship: Relationship = {
              id: `${filePath}-imports-${resolvedPath}`,
              type: RelationType.IMPORTS,
              sourceId: filePath,
              targetId: resolvedPath,
            };
            this.projectGraph.addRelationship(relationship);
          }
        },

        // Handle require statements
        CallExpression: (path) => {
          if (
            path.node.callee.type === 'Identifier' &&
            path.node.callee.name === 'require' &&
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === 'StringLiteral'
          ) {
            const importPath = path.node.arguments[0].value;
            const resolvedPath = this.resolveImportPath(filePath, importPath);

            if (resolvedPath) {
              const relationship: Relationship = {
                id: `${filePath}-imports-${resolvedPath}`,
                type: RelationType.IMPORTS,
                sourceId: filePath,
                targetId: resolvedPath,
              };
              this.projectGraph.addRelationship(relationship);
            }
          }
        },
      });
    } catch (error) {
      console.warn(`Error analyzing file ${filePath}:`, error);
    }
  }

  private determinePlugins(filePath: string): string[] {
    const ext = path.extname(filePath);
    const plugins = ['jsx'];

    if (ext.includes('ts')) plugins.push('typescript');
    if (filePath.includes('vue')) plugins.push('decorators');

    return plugins;
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    try {
      // Handle relative imports
      if (importPath.startsWith('.')) {
        const dirName = path.dirname(currentFile);
        const resolvedPath = path.resolve(dirName, importPath);

        // If the import already has an extension, try it directly
        if (this.extensions.some((ext) => importPath.endsWith(ext))) {
          return fs.existsSync(resolvedPath) ? resolvedPath : null;
        }

        // Try with different extensions
        for (const ext of this.extensions) {
          const pathWithExt = resolvedPath + ext;
          if (fs.existsSync(pathWithExt)) {
            return pathWithExt;
          }
        }

        // Check for index files in directories
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
          for (const ext of this.extensions) {
            const indexPath = path.join(resolvedPath, `index${ext}`);
            if (fs.existsSync(indexPath)) {
              return indexPath;
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.warn(`Could not resolve import path: ${importPath} in file ${currentFile}`);
      return null;
    }
  }
}
