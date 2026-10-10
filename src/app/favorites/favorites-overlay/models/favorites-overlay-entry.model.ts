export type FavoritesOverlayPageId =
  | 'languages'
  | 'frameworks'
  | 'devOps'
  | 'tools'
  | 'security'
  | 'databases';

export interface FavoritesOverlayTagListEntryModel {
  id: FavoritesOverlayPageId;
  tags: string[];
}

export interface FavoritesOverlayEntryModel {
  title: string;
  tags: string[];
}
