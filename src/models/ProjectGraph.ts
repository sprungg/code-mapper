import { Node } from './Node';
import { Relationship } from './Relationship';

export class ProjectGraph {
  private nodes: Map<string, Node>;
  private relationships: Map<string, Relationship>;

  constructor() {
    this.nodes = new Map();
    this.relationships = new Map();
  }

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  addRelationship(relationship: Relationship): void {
    this.relationships.set(relationship.id, relationship);
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
