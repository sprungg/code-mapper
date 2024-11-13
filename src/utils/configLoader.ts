import * as fs from 'fs';
import * as path from 'path';
import { AnalyzerConfig } from '../models/Config';
import { parse as parseGitignore } from 'parse-gitignore';

export function loadConfig(rootPath: string): AnalyzerConfig {
  const config: AnalyzerConfig = {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.git/**'],
    include: ['**/*'],
    parsable: ['.js', '.jsx', '.ts', '.tsx'],
  };
  // return config;

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
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      if (tsconfig.compilerOptions) {
        const { baseUrl } = tsconfig.compilerOptions;
        config.baseUrl = baseUrl;

        // Add includes from tsconfig
        if (tsconfig.include) {
          config.parsable = tsconfig.include;
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
