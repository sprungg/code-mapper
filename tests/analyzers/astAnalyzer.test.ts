import { ASTAnalyzer } from '../../src/analyzers/astAnalyzer';
import { ProjectGraph } from '../../src/models/ProjectGraph';
import { RelationType } from '../../src/models/Relationship';
import * as path from 'path';

describe('ASTAnalyzer', () => {
  let projectGraph: ProjectGraph;
  let analyzer: ASTAnalyzer;

  beforeEach(() => {
    projectGraph = new ProjectGraph(__dirname);
    analyzer = new ASTAnalyzer(projectGraph, __dirname);
  });

  it('should detect import relationships', async () => {
    const filePath = path.join(__dirname, './fixtures/sampleProject/index.js');
    await analyzer.analyzeFile(filePath);

    const { relationships } = projectGraph.toJSON();
    const importRelationships = relationships.filter(r => r.type === RelationType.IMPORTS);

    expect(importRelationships).toHaveLength(1);
    expect(importRelationships[0]).toMatchObject({
      type: RelationType.IMPORTS,
      sourceId: path.relative(__dirname, filePath)
    });
  });

  it('should handle files with no imports gracefully', async () => {
    const filePath = path.join(__dirname, './fixtures/sampleProject/src/index.js');
    await analyzer.analyzeFile(filePath);

    const { relationships } = projectGraph.toJSON();
    const importRelationships = relationships.filter(r => r.type === RelationType.IMPORTS);

    expect(importRelationships).toHaveLength(0);
  });
});
