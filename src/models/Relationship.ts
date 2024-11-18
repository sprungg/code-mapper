export enum RelationType {
  IMPORTS = 'IMPORTS',
  EXPORTS = 'EXPORTS',
}

export interface Relationship {
  id: string;
  type: RelationType;
  sourceId: string;
  targetId: string;
  commonParentId?: string;
  metadata?: Record<string, any>;
}
