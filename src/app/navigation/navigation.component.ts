import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faJs } from '@fortawesome/free-brands-svg-icons';
import { isPlatformBrowser, NgStyle, ViewportScroller } from '@angular/common';
import { ThemeModeToggleComponent } from '../lib/theme-mode-toggle/theme-mode-toggle.component';
import { navigationEntries } from '../app.routes';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { NavigationEntryComponent } from './navigation-entry/navigation-entry.component';
import { ScrollTrigger } from '../lib/misc/gsap/gsap';
import { NavigationEntryModel } from './navigation-entry/models/navigation-entry.model';

@Component({
  selector: 'app-navigation',
  imports: [
    FontAwesomeModule,
    NgStyle,
    ThemeModeToggleComponent,
    NavigationEntryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './navigation.component.html',
})
export class NavigationComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly viewportScroller: ViewportScroller =
    inject(ViewportScroller);

  protected readonly faJs: IconDefinition = faJs;
  protected readonly navigationEntries = navigationEntries;

  protected navbarExpanded = signal<number>(0);

  private gsapScrollTrigger: ScrollTrigger | undefined;

  get sortedRouteEntries(): NavigationEntryModel[] {
    return Object.entries(this.navigationEntries)
      .sort((a, b) => a[1].index - b[1].index)
      .map(([, route]) => route);
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.gsapScrollTrigger = ScrollTrigger.create({
        trigger: 'header',
        scrub: true,
        onEnter: () => this.navbarExpanded.set(0),
        onEnterBack: () => this.navbarExpanded.set(0),
        onLeave: () => this.navbarExpanded.set(1),
        onLeaveBack: () => this.navbarExpanded.set(1),
      });
    }
  }

  protected navigateToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  ngOnDestroy(): void {
    this.gsapScrollTrigger?.kill();
  }
}
