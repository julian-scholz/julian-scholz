import { inject, Injectable, PLATFORM_ID, Renderer2 } from '@angular/core';
import { ThemeMode } from './utils/theme-mode-toggle.enum';
import { Observable, ReplaySubject } from 'rxjs';
import {
  THEME_MODE_STORAGE_SERVICE,
  ThemeModeStorage,
} from './theme-mode-storage.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeModeToggleService {
  private readonly platformId: object = inject(PLATFORM_ID);
  private currentMode: ThemeMode | undefined;
  private readonly modeChangedSubject = new ReplaySubject<ThemeMode>(1);
  private readonly modeStorage: ThemeModeStorage = inject(
    THEME_MODE_STORAGE_SERVICE,
  );

  public modeChanged$: Observable<ThemeMode>;

  constructor() {
    this.modeChanged$ = this.modeChangedSubject.asObservable();
  }

  private updateCurrentMode(mode: ThemeMode): void {
    this.currentMode = mode;
    this.modeChangedSubject.next(mode);
    this.modeStorage.save(mode);
  }

  public init(
    renderer: Renderer2,
    angularDocument: Document,
  ): Promise<ThemeMode> {
    let initMode: ThemeMode | null = this.modeStorage.get();
    if (!initMode) {
      if (isPlatformBrowser(this.platformId)) {
        const prefersDarkMode = angularDocument.defaultView!.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches;
        initMode = prefersDarkMode ? ThemeMode.DARK : ThemeMode.LIGHT;
      } else {
        initMode = ThemeMode.LIGHT;
      }
    }
    this.updateCurrentMode(initMode);
    renderer.addClass(angularDocument.documentElement, initMode);

    return Promise.resolve(initMode);
  }

  private toggleThemeMode(
    renderer: Renderer2,
    documentElement: HTMLElement,
  ): void {
    this.toggleElementClass(renderer, documentElement, ThemeMode.LIGHT);
    this.toggleElementClass(renderer, documentElement, ThemeMode.DARK);
    if (this.currentMode) {
      if (this.currentMode === ThemeMode.LIGHT) {
        this.updateCurrentMode(ThemeMode.DARK);
      } else {
        this.updateCurrentMode(ThemeMode.LIGHT);
      }
    } else {
      console.error('currentMode is not set!');
    }
  }

  private toggleElementClass(
    renderer: Renderer2,
    element: HTMLElement,
    className: string,
  ): void {
    if (element.classList.contains(className)) {
      renderer.removeClass(element, className);
    } else {
      renderer.addClass(element, className);
    }
  }

  public initToggleThemeMode(
    renderer: Renderer2,
    angularDocument: Document,
  ): void {
    /*if (angularDocument.startViewTransition !== undefined) {
      setTimeout(() => {
        angularDocument.startViewTransition(() =>
          this.toggleThemeMode(renderer, angularDocument.documentElement),
        );
      }, 700);
    } else {*/
      this.toggleThemeMode(renderer, angularDocument.documentElement);
    //}
  }
}
