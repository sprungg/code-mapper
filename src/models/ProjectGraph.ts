import { Node } from './Node';
import { Relationship } from './Relationship';
import * as path from 'path';

export class ProjectGraph {
  private nodes: Map<string, Node>;
  private relationships: Map<string, Relationship>;
  private rootPath: string;

  constructor(rootPath: string) {
    this.nodes = new Map();
    this.relationships = new Map();
    this.rootPath = rootPath;
  }

  private normalizePath(fullPath: string): string {
    return path.relative(this.rootPath, fullPath);
  }

  addNode(node: Node): void {
    const normalizedNode = {
      ...node,
      id: this.normalizePath(node.id),
      path: node.path ? this.normalizePath(node.path) : undefined,
      parentId: node.parentId ? this.normalizePath(node.parentId) : undefined
    };
    this.nodes.set(normalizedNode.id, normalizedNode);
  }

  addRelationship(relationship: Relationship): void {
    const normalizedRelationship = {
      ...relationship,
      id: `${this.normalizePath(relationship.sourceId)}-${relationship.type}-${this.normalizePath(relationship.targetId)}`,
      sourceId: this.normalizePath(relationship.sourceId),
      targetId: this.normalizePath(relationship.targetId),
      commonParentId: relationship.commonParentId ? this.normalizePath(relationship.commonParentId) : undefined
    };
    this.relationships.set(normalizedRelationship.id, normalizedRelationship);
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getRelationships(nodeId: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(
      (rel) => rel.sourceId === nodeId || rel.targetId === nodeId
    );
  }

  toJSON(): { nodes: Node[]; relationships: Relationship[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      relationships: Array.from(this.relationships.values()),
    };
  }
}
