import { FileAnalyzer } from '../../src/analyzers/fileAnalyzer';
import * as path from 'path';
import { ProjectGraph } from '../../src/models/ProjectGraph';

describe('FileAnalyzer', () => {
  const fixturesPath = path.join(__dirname, './fixtures/sampleProject');

  let projectGraph: ProjectGraph;
  let analyzer: FileAnalyzer;
  beforeEach(async () => {
    projectGraph = new ProjectGraph(fixturesPath);
    analyzer = new FileAnalyzer(fixturesPath, projectGraph);
    await analyzer.analyze();
  });

  it('should analyze project structure correctly', () => {
    const { nodes } = projectGraph.toJSON();

    expect(nodes).toContainEqual(
      expect.objectContaining({
        type: 'FOLDER',
        name: 'src',
      })
    );
  });

  it('should handle empty directories gracefully', async () => {
    // Simulate an empty directory scenario
    const emptyDirPath = path.join(__dirname, '../fixtures/emptyProject');
    const emptyProjectGraph = new ProjectGraph(emptyDirPath);
    const emptyAnalyzer = new FileAnalyzer(emptyDirPath, emptyProjectGraph);
    await emptyAnalyzer.analyze();
    const { nodes } = emptyProjectGraph.toJSON();

    expect(nodes).toHaveLength(0);
  });

  it('should correctly identify file types', () => {
    const { nodes } = projectGraph.toJSON();

    expect(nodes).toContainEqual(
      expect.objectContaining({
        type: 'FILE',
        name: 'index.js',
      })
    );
  });
});
