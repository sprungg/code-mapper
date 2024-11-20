import { GitAnalyzer } from '../../src/analyzers/gitAnalyzer';
import { ProjectGraph } from '../../src/models/ProjectGraph';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Node } from '../../src/models/Node';

const execAsync = promisify(exec);

describe('GitAnalyzer', () => {
  let projectGraph: ProjectGraph;
  let analyzer: GitAnalyzer;
  const testRepoPath = path.join(__dirname, 'fixtures/testGitRepo');

  beforeAll(async () => {
    // Set up a test git repository
    await execAsync('git init', { cwd: testRepoPath });
    await execAsync('git config --local user.email "test@example.com"', { cwd: testRepoPath });
    await execAsync('git config --local user.name "Test User"', { cwd: testRepoPath });
    await execAsync('git remote add origin https://github.com/testuser/testrepo.git', { cwd: testRepoPath });
  });

  beforeEach(() => {
    projectGraph = new ProjectGraph(testRepoPath);
    analyzer = new GitAnalyzer(projectGraph, testRepoPath);
  });

  it('should include GitHub URL in metadata when available', async () => {
    const node = {
      id: 'test.ts',
      type: 'FILE',
      name: 'test.ts',
      path: path.join(testRepoPath, 'test.ts')
    } as Node;

    projectGraph.addNode(node);
    await analyzer.analyze();

    const { nodes } = projectGraph.toJSON();
    const testNode = nodes.find(n => n.id === 'test.ts');
    
    expect(testNode?.metadata?.git?.githubUrl).toMatch(
      /^https:\/\/github\.com\/testuser\/testrepo\/blob\/[a-f0-9]+\/test\.ts$/
    );
  });

  afterAll(async () => {
    // Clean up test repository
    await execAsync('rm -rf .git', { cwd: testRepoPath });
  });
});
