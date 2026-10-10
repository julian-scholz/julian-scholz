import { NavigationEntryModel } from './navigation/navigation-entry/models/navigation-entry.model';

type RouteId = 'bookRecommendations' | 'vita' | 'favorites';

export const navigationEntries: Record<RouteId, NavigationEntryModel> = {
  bookRecommendations: {
    id: 'book-recommendations',
    title: $localize`:@@bookRecommendationsNavigationTitle:Buchtipps`,
    index: 0,
  },
  vita: {
    id: 'vita',
    title: $localize`:@@vitaNavigationTitle:Vita`,
    index: 1,
  },
  favorites: {
    id: 'favorites',
    title: $localize`:@@favoritesNavigationTitle:Favoriten`,
    index: 2,
  },
} as const;
