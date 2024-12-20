import * as fs from 'fs';
import * as path from 'path';
import { AnalyzerConfig } from '../models/Config';
import { parse as parseGitignore } from 'parse-gitignore';
import { parse as parseJsonc } from 'jsonc-parser';

export interface ModuleConfig extends AnalyzerConfig {
  moduleSystem: 'Node16' | 'CommonJS';
}

export function loadConfig(rootPath: string): ModuleConfig {
  const config: ModuleConfig = {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.git/**'],
    include: ['**/*'],
    parsable: ['.js', '.jsx', '.ts', '.tsx'],
    paths: {},
    moduleSystem: 'CommonJS',
  };

  // Read package.json to determine module system
  try {
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.type === 'module') {
        config.moduleSystem = 'Node16';
      }
    }
  } catch (error) {
    console.warn('Error reading package.json:', error);
  }

  // Read .gitignore
  try {
    const gitignorePath = path.join(rootPath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      const gitignorePatterns = parseGitignore(gitignoreContent).patterns;
      config.ignore.push(...gitignorePatterns);
    }
  } catch (error) {
    console.warn('Error reading .gitignore:', error);
  }

  // Read tsconfig.json
  try {
    const tsconfigPath = path.join(rootPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
      const tsconfig = parseJsonc(tsconfigContent);
      if (tsconfig.compilerOptions) {
        const { baseUrl, paths } = tsconfig.compilerOptions;
        config.baseUrl = baseUrl;

        // Add paths from tsconfig
        if (paths) {
          config.paths = paths;
        }

        // Add includes from tsconfig
        if (tsconfig.include) {
          config.include.push(...tsconfig.include);
        }

        // Add excludes from tsconfig
        if (tsconfig.exclude) {
          config.ignore.push(...tsconfig.exclude);
        }
      }
    }
  } catch (error) {
    console.warn('Error reading tsconfig.json:', error);
  }

  return config;
}
