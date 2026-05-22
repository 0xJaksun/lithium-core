export interface Cluster {
  id: string;
  parentId: string | null;
  path: string;
  name: string;
  description: string | null;
  createdAt: Date;
}
