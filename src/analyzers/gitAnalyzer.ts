import { exec } from 'child_process';
import { promisify } from 'util';
import { ProjectGraph } from '../models/ProjectGraph';
import { Node } from '../models/Node';
import { GitPluginOptions } from '../models/Config';

const execAsync = promisify(exec);

interface GitCommitInfo {
  hash: string;
  date: string;
  author: string;
  message?: string;
  githubUrl?: string;
}

export class GitAnalyzer {
  private githubInfo: { owner: string; repo: string } | null = null;

  constructor(
    private projectGraph: ProjectGraph,
    private rootPath: string,
    private options: GitPluginOptions = { enabled: true }
  ) {}

  async analyze(): Promise<void> {
    if (!this.options.enabled) return;

    try {
      await this.isGitRepository();
      await this.detectGithubRepository();
      
      const { nodes } = this.projectGraph.toJSON();
      
      for (const node of nodes) {
        try {
          const commitInfo = await this.getLastCommitInfo(node);
          if (commitInfo) {
            // Update node metadata with git information
            this.projectGraph.updateNodeMetadata(node.id, {
              ...node.metadata,
              git: commitInfo
            });
          }
        } catch (error) {
          console.warn(`Failed to get git info for ${node.path}:`, error);
        }
      }
    } catch (error) {
      console.warn('Git analysis skipped:', error);
    }
  }

  private async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.rootPath });
      return true;
    } catch (error) {
      throw new Error('Not a git repository');
    }
  }

  private async detectGithubRepository(): Promise<void> {
    try {
      const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', {
        cwd: this.rootPath
      });

      const githubPattern = /github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/;
      const match = remoteUrl.trim().match(githubPattern);

      if (match) {
        this.githubInfo = {
          owner: match[1],
          repo: match[2]
        };
      }
    } catch (error) {
      console.warn('Not a GitHub repository or unable to detect GitHub info');
    }
  }

  private getGithubFileUrl(node: Node, commitHash: string): string | undefined {
    if (!this.githubInfo || node.type !== 'FILE') return undefined;

    const { owner, repo } = this.githubInfo;

    return `https://github.com/${owner}/${repo}/blob/${commitHash}/${node.path}`;
  }

  private async getLastCommitInfo(node: Node): Promise<GitCommitInfo | null> {
    if (!node.path) return null;

    const nodePath = node.id;
    const format = this.options.includeCommitMessage !== false
      ? '%H|%aI|%an|%s'
      : '%H|%aI|%an';
    
    const historyLimit = this.options.maxHistory 
      ? `-n ${this.options.maxHistory}`
      : '-1';

    const command = node.type === 'FOLDER'
      ? `git log ${historyLimit} --format="${format}" -- "${nodePath}"`
      : `git log ${historyLimit} --format="${format}" "${nodePath}"`;

    try {
      const { stdout } = await execAsync(command, { cwd: this.rootPath });
      if (!stdout.trim()) return null;

      const [hash, date, author, ...messageParts] = stdout.trim().split('|');
      
      return {
        hash,
        date,
        author,
        ...(this.options.includeCommitMessage !== false && {
          message: messageParts.join('|')
        }),
        ...(this.githubInfo && node.type === 'FILE' && {
          githubUrl: this.getGithubFileUrl(node, hash)
        })
      };
    } catch (error) {
      return null;
    }
  }
}
