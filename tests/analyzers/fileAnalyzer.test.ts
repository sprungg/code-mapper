import { FileAnalyzer } from '../../src/analyzers/fileAnalyzer';
import * as path from 'path';
import { ProjectGraph } from '../../src/models/ProjectGraph';

describe('FileAnalyzer', () => {
  const fixturesPath = path.join(__dirname, '../fixtures/sampleProject');

  let analyzer: FileAnalyzer;
  let projectGraph: ProjectGraph;

  beforeEach(async () => {
    analyzer = new FileAnalyzer(fixturesPath);
    projectGraph = await analyzer.analyze();
  });

  it('should analyze project structure correctly', () => {
    const { nodes, relationships } = projectGraph.toJSON();

    expect(nodes).toContainEqual(
      expect.objectContaining({
        type: 'FOLDER',
        name: 'sampleProject',
      })
    );

    expect(relationships).toContainEqual(
      expect.objectContaining({
        type: 'CONTAINS',
      })
    );
  });

  it('should handle empty directories gracefully', async () => {
    // Simulate an empty directory scenario
    const emptyDirPath = path.join(__dirname, '../fixtures/emptyProject');
    const emptyAnalyzer = new FileAnalyzer(emptyDirPath);
    const emptyGraph = await emptyAnalyzer.analyze();
    const { nodes } = emptyGraph.toJSON();

    expect(nodes).toHaveLength(0);
  });

  it('should correctly identify file types', () => {
    const { nodes } = projectGraph.toJSON();

    expect(nodes).toContainEqual(
      expect.objectContaining({
        type: 'FILE',
        name: 'test.js',
      })
    );
  });
});
