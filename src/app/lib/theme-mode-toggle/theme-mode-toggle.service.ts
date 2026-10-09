import { inject, Injectable, Renderer2 } from '@angular/core';
import { ThemeMode } from './utils/theme-mode-toggle.enum';
import { Observable, ReplaySubject } from 'rxjs';
import {
  THEME_MODE_STORAGE_SERVICE,
  ThemeModeStorage,
} from './theme-mode-storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeModeToggleService {
  private currentMode: ThemeMode | undefined;
  private readonly modeChangedSubject = new ReplaySubject<ThemeMode>(1);
  private readonly modeStorage: ThemeModeStorage = inject(
    THEME_MODE_STORAGE_SERVICE,
  );

  public modeChanged$: Observable<ThemeMode>;

  constructor() {
    this.modeChanged$ = this.modeChangedSubject.asObservable();
  }

  private setCurrentMode(mode: ThemeMode): void {
    this.currentMode = mode;
    this.modeChangedSubject.next(mode);
  }

  // The theme mode is decided and applied by the inline script in index.html
  // before the first paint, so it only has to be adopted here
  public init(angularDocument: Document): ThemeMode {
    const initMode = angularDocument.documentElement.classList.contains(
      ThemeMode.DARK,
    )
      ? ThemeMode.DARK
      : ThemeMode.LIGHT;
    this.setCurrentMode(initMode);

    return initMode;
  }

  // Only an explicit choice is saved, so the system preference applies until then
  private toggleThemeMode(
    renderer: Renderer2,
    documentElement: HTMLElement,
  ): void {
    const newMode =
      this.currentMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;

    if (newMode === ThemeMode.DARK) {
      renderer.addClass(documentElement, ThemeMode.DARK);
    } else {
      renderer.removeClass(documentElement, ThemeMode.DARK);
    }
    this.setCurrentMode(newMode);
    this.modeStorage.save(newMode);
  }

  public initToggleThemeMode(
    renderer: Renderer2,
    angularDocument: Document,
  ): void {
    if (angularDocument.startViewTransition !== undefined) {
      setTimeout(() => {
        angularDocument.startViewTransition(() =>
          this.toggleThemeMode(renderer, angularDocument.documentElement),
        );
      }, 700);
    } else {
      this.toggleThemeMode(renderer, angularDocument.documentElement);
    }
  }
}
