import {
  afterNextRender,
  DOCUMENT,
  inject,
  Injectable,
  Injector,
  signal,
} from '@angular/core';
import { ThemeMode } from './utils/theme-mode-toggle.enum';

@Injectable({ providedIn: 'root' })
export class ThemeModeToggleService {
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly injector: Injector = inject(Injector);

  // Also read by the inline script in index.html
  private readonly LOCAL_STORAGE_KEY = 'themeMode';
  private readonly viewTransitionDelay: number = 700;

  // The theme mode is decided and applied by the inline script in index.html
  // before the first paint, so it only has to be adopted here
  private readonly mode = signal<ThemeMode>(
    this.angularDocument.documentElement.classList.contains(ThemeMode.DARK)
      ? ThemeMode.DARK
      : ThemeMode.LIGHT,
  );

  public readonly currentMode = this.mode.asReadonly();

  public toggleThemeMode(): void {
    const nextMode =
      this.mode() === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    const prefersReducedMotion = this.angularDocument.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (this.angularDocument.startViewTransition !== undefined) {
      setTimeout(
        () =>
          this.angularDocument.startViewTransition(() => {
            this.applyThemeMode(nextMode);
            return this.waitForNextRender();
          }),
        prefersReducedMotion ? 0 : this.viewTransitionDelay,
      );
    } else {
      this.applyThemeMode(nextMode);
    }

    this.saveThemeMode(nextMode);
  }

  private applyThemeMode(mode: ThemeMode): void {
    this.angularDocument.documentElement.classList.toggle(
      ThemeMode.DARK,
      mode === ThemeMode.DARK,
    );
    this.mode.set(mode);
  }

  // Lets the view transition take its new snapshot only after Angular has
  // rendered the new theme mode, the same way the Angular router does it
  private waitForNextRender(): Promise<void> {
    return new Promise((resolve) =>
      afterNextRender(
        { read: () => setTimeout(resolve) },
        { injector: this.injector },
      ),
    );
  }

  private saveThemeMode(mode: ThemeMode): void {
    try {
      this.angularDocument.defaultView?.localStorage.setItem(
        this.LOCAL_STORAGE_KEY,
        mode,
      );
    } catch {
      // Without storage the choice only lasts until the next page load
    }
  }
}
