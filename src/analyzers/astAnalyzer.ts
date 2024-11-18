import { parse, ParserOptions } from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import { ProjectGraph } from '../models/ProjectGraph';
import { Relationship, RelationType } from '../models/Relationship';
import * as path from 'path';
import { loadConfig } from '../utils/configLoader';

export class ASTAnalyzer {
  private extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.mjs', '.cjs'];

  constructor(
    private projectGraph: ProjectGraph,
    private rootPath: string
  ) {}

  async analyzeFile(filePath: string): Promise<void> {
    // Parse imports
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const ast = parse(content, {
        sourceType: 'unambiguous',
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
              commonParentId: this.getCommonParentId(filePath, resolvedPath), // parentId is the last dir common to both paths
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
                commonParentId: this.getCommonParentId(filePath, resolvedPath),
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

  private getCommonParentId(filePath: string, resolvedPath: string): string | undefined {
    const filePathParts = filePath.split(path.sep);
    const resolvedPathParts = resolvedPath.split(path.sep);
    const minLength = Math.min(filePathParts.length, resolvedPathParts.length);
    let commonIndex = 0;
    while (
      commonIndex < minLength &&
      filePathParts[commonIndex] === resolvedPathParts[commonIndex]
    ) {
      commonIndex++;
    }
    const commonParentId = filePathParts.slice(0, commonIndex).join(path.sep);
    return commonParentId !== this.rootPath ? commonParentId : undefined;
  }

  private determinePlugins(filePath: string): string[] {
    const ext = path.extname(filePath);
    const plugins = ['jsx'];

    if (ext.includes('ts')) plugins.push('typescript');
    if (filePath.includes('vue')) plugins.push('decorators');

    return plugins;
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    const resolvePathWithExtension = (pathToResolve: string): string | null => {
      // If the import already has an extension, try it directly
      if (this.extensions.some((ext) => pathToResolve.endsWith(ext))) {
        return fs.existsSync(pathToResolve) ? pathToResolve : null;
      }

      // Try with different extensions
      for (const ext of this.extensions) {
        const pathWithExt = pathToResolve + ext;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }

      // Check for index files in directories
      if (fs.existsSync(pathToResolve) && fs.statSync(pathToResolve).isDirectory()) {
        for (const ext of this.extensions) {
          const indexPath = path.join(pathToResolve, `index${ext}`);
          if (fs.existsSync(indexPath)) {
            return indexPath;
          }
        }
      }
      return null;
    };
    try {
      const config = loadConfig(this.rootPath);
      const baseUrl = config.baseUrl;
      const paths = config.paths || {};

      // Handle path aliases
      for (const alias in paths) {
        const aliasPattern = alias.replace('/*', '');
        if (importPath.startsWith(aliasPattern)) {
          const aliasPaths = paths[alias];
          for (const aliasPath of aliasPaths) {
            const resolvedAliasPath = path.join(
              baseUrl || '',
              aliasPath.replace('/*', ''),
              importPath.replace(aliasPattern, '')
            );
            const resolvedPath = resolvePathWithExtension(
              path.resolve(this.rootPath, './' + resolvedAliasPath)
            );
            if (resolvedPath && fs.existsSync(resolvedPath)) {
              return resolvedPath;
            }
          }
        }
      }
      // Handle relative imports
      if (importPath.startsWith('.')) {
        const dirName = path.dirname(currentFile);
        const resolvedPath = path.resolve(dirName, importPath);

        const resolvedPathWithExtension = resolvePathWithExtension(resolvedPath);
        if (resolvedPathWithExtension) {
          return resolvedPathWithExtension;
        }
      }
      return null;
    } catch (error) {
      console.warn(`Could not resolve import path: ${importPath} in file ${currentFile}`);
      return null;
    }
  }
}
