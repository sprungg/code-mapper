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
    try {
      let content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Brittle Preprocess: Convert <const> syntax to 'as const'
      // TODO: This is brittle and should be removed when we have a better way to handle this
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        content = content.replace(
          /export\s+const\s+(\w+)\s*=\s*<const>/g,
          'export const $1 ='
        );
        content = content.replace(/<const>(\[.*?\])/g, '$1 as const');
      }

      const ast = parse(content, {
        sourceType: 'unambiguous',
        plugins: this.determinePlugins(filePath) as ParserOptions['plugins'],
        tokens: true,
        errorRecovery: true,
        attachComment: true,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
        allowUndeclaredExports: true,
        createParenthesizedExpressions: true
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
    // Convert to relative paths
    const relativeFilePath = path.relative(this.rootPath, filePath);
    const relativeResolvedPath = path.relative(this.rootPath, resolvedPath);

    const filePathParts = relativeFilePath.split(path.sep);
    const resolvedPathParts = relativeResolvedPath.split(path.sep);
    
    // Find common parent directory
    const minLength = Math.min(filePathParts.length, resolvedPathParts.length);
    let commonIndex = 0;
    
    while (
      commonIndex < minLength &&
      filePathParts[commonIndex] === resolvedPathParts[commonIndex]
    ) {
      commonIndex++;
    }

    if (commonIndex === 0) return undefined;
    
    // Join the common parts to create the common parent path
    const commonParentPath = filePathParts.slice(0, commonIndex).join(path.sep);
    return commonParentPath || undefined;
  }

  private determinePlugins(filePath: string): (string | [string, object])[] {
    const ext = path.extname(filePath);
    const plugins: (string | [string, object])[] = ['jsx'];

    // Add TypeScript plugin with options
    if (ext.includes('ts')) {
      plugins.push(['typescript', { 
        isTSX: true,
        allExtensions: true,
        dts: true,
        disallowAmbiguousJSXLike: false
      }]);
    }
    if (filePath.includes('vue')) plugins.push('decorators');

    return plugins;
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    const resolvePathWithExtension = (pathToResolve: string): string | null => {
      // Handle Node16 module resolution where .js extensions are used for TypeScript files
      if (pathToResolve.endsWith('.js')) {
        // Try the TypeScript equivalent first
        const tsPath = pathToResolve.replace(/\.js$/, '.ts');
        const tsxPath = pathToResolve.replace(/\.js$/, '.tsx');
        
        if (fs.existsSync(tsPath)) return tsPath;
        if (fs.existsSync(tsxPath)) return tsxPath;
      }

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
        // Try TypeScript extensions first, then JavaScript
        const indexExtensions = ['.ts', '.tsx', '.js', '.jsx'];
        for (const ext of indexExtensions) {
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
