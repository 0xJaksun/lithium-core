export interface Entry {
  id: string;
  clusterId: string;
  createdAt: Date;
}

export interface EntryVersion {
  id: string;
  entryId: string;
  version: number;
  createdAt: Date;
}
