import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  DOCUMENT,
} from '@angular/core';
import { faJs } from '@fortawesome/free-brands-svg-icons';
import { isPlatformBrowser, NgStyle, ViewportScroller } from '@angular/common';
import { ThemeModeToggleComponent } from '../lib/theme-mode-toggle/theme-mode-toggle.component';
import { LanguageSwitchComponent } from '../lib/language-switch/language-switch.component';
import { navigationEntries } from '../app.routes';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { NavigationEntryComponent } from './navigation-entry/navigation-entry.component';
import { NavigationEntryModel } from './navigation-entry/models/navigation-entry.model';
import { IconComponent } from '../lib/icon/icon.component';

@Component({
  selector: 'app-navigation',
  imports: [
    IconComponent,
    NgStyle,
    ThemeModeToggleComponent,
    NavigationEntryComponent,
    LanguageSwitchComponent,
  ],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly viewportScroller: ViewportScroller =
    inject(ViewportScroller);

  protected readonly faJs: IconDefinition = faJs;
  protected readonly navigationEntries = navigationEntries;

  protected navbarExpanded = signal<number>(0);

  private headerIntersectionObserver: IntersectionObserver | undefined;

  protected readonly sortedRouteEntries: NavigationEntryModel[] = Object.values(
    this.navigationEntries,
  ).sort((a, b) => a.index - b.index);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // The navbar expands once the header is out of view
      this.headerIntersectionObserver = new IntersectionObserver(([entry]) =>
        this.navbarExpanded.set(entry.isIntersecting ? 0 : 1),
      );
      this.headerIntersectionObserver.observe(
        this.angularDocument.querySelector('header')!,
      );
    }
  }

  protected navigateToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  ngOnDestroy(): void {
    this.headerIntersectionObserver?.disconnect();
  }
}
