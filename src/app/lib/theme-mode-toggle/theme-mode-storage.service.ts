import { inject, Injectable, InjectionToken, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { ThemeMode } from './utils/theme-mode-toggle.enum';
import { isPlatformBrowser } from '@angular/common';

export const THEME_MODE_STORAGE_SERVICE = new InjectionToken<ThemeModeStorage>(
  'THEME_MODE_STORAGE',
  {
    providedIn: 'root',
    factory: () => new ThemeModeLocalStorageService(),
  },
);

export interface ThemeModeStorage {
  save(mode: ThemeMode): void;

  get(): ThemeMode | null;
}

@Injectable()
export class ThemeModeLocalStorageService implements ThemeModeStorage {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);

  LOCAL_STORAGE_KEY = 'themeMode';

  save(mode: ThemeMode): void {
    if (isPlatformBrowser(this.platformId)) {
      this.angularDocument.defaultView!.localStorage.setItem(
        this.LOCAL_STORAGE_KEY,
        mode.toString(),
      );
    }
  }

  get(): ThemeMode | null {
    if (isPlatformBrowser(this.platformId)) {
      return this.angularDocument.defaultView!.localStorage.getItem(
        this.LOCAL_STORAGE_KEY,
      ) as ThemeMode;
    }
    return null;
  }
}
