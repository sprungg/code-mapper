export enum NodeType {
  FILE = 'FILE',
  FOLDER = 'FOLDER',
}

export interface Position {
  line: number;
  column: number;
}

export interface Location {
  start: Position;
  end: Position;
}

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  path?: string;
  parentId?: string;
  location?: Location;
  metadata?: Record<string, any>;
}
