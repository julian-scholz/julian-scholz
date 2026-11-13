import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
  DOCUMENT,
} from '@angular/core';
import { isPlatformBrowser, NgStyle, ViewportScroller } from '@angular/common';
import { ThemeModeToggleComponent } from '../lib/theme-mode-toggle/theme-mode-toggle.component';
import { LanguageSwitchComponent } from '../lib/language-switch/language-switch.component';
import { navigationEntries } from '../app.routes';
import { NavigationEntryComponent } from './navigation-entry/navigation-entry.component';
import { NavigationEntryModel } from './navigation-entry/models/navigation-entry.model';
import { listenToScroll } from '../lib/misc/scroll/listen-to-scroll';

@Component({
  selector: 'app-navigation',
  imports: [
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
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly viewportScroller: ViewportScroller =
    inject(ViewportScroller);

  // The back-to-top button is a small record with a "JS" label, which
  // scrolling turns
  private readonly record =
    viewChild.required<ElementRef<HTMLElement>>('record');
  private readonly recordTurnPerPixel: number = 360 / 600;
  protected readonly navigationEntries = navigationEntries;

  protected navbarExpanded = signal<number>(0);

  private readonly arm = viewChild.required<ElementRef<HTMLElement>>('arm');
  protected readonly armIndex = signal<number>(0);
  protected readonly armDown = signal<boolean>(false);

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
      this.playRecord();
    }
  }

  private playRecord(): void {
    const angularWindow = this.angularDocument.defaultView!;
    if (angularWindow.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const record = this.record().nativeElement;
    listenToScroll(
      () =>
        record.style.setProperty(
          '--navigation-record-turn',
          `${angularWindow.scrollY * this.recordTurnPerPixel}deg`,
        ),
      this.destroyRef,
    );
  }

  // The arm stays above the last entry when it lifts, so it sets down there
  // again instead of sliding in from the first entry
  protected setEntryActive(index: number, active: boolean): void {
    if (active) {
      this.armIndex.set(index);
      this.armDown.set(true);
    } else if (index === this.armIndex()) {
      this.armDown.set(false);
    }
  }

  protected moveArm(index: number, progress: number): void {
    if (index === this.armIndex()) {
      this.arm().nativeElement.style.setProperty(
        '--navigation-arm-progress',
        `${progress}`,
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
