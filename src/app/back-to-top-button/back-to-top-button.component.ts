import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  DOCUMENT
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';
import {
  isPlatformBrowser,
  NgStyle,
  ViewportScroller
} from '@angular/common';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-back-to-top-button',
  imports: [FaIconComponent, NgStyle],
  templateUrl: './back-to-top-button.component.html',
})
export class BackToTopButtonComponent implements AfterViewInit {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly viewportScroller: ViewportScroller =
    inject(ViewportScroller);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected readonly faCaretUp: IconDefinition = faCaretUp;
  protected readonly radiusOuterCircle: number = 40;
  protected readonly offsetInnerCircle: number = 8;
  protected readonly radiusInnerCircle: number =
    this.radiusOuterCircle - this.offsetInnerCircle;

  protected readonly circumference: number =
    2 * Math.PI * this.radiusInnerCircle;

  private scrollPercentage = signal<number>(0);
  protected strokeDashoffset = computed(() =>
    this.calculateStrokeDashoffset(this.scrollPercentage()),
  );
  protected isVisible = computed(() => this.scrollPercentage() >= 5);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(this.angularDocument.defaultView!, 'scroll')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.calculateStrokeDashoffsetWithScrollPosition());
    }
  }

  protected navigateToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  private calculateStrokeDashoffset(scrollPercentage: number): number {
    return this.circumference - (this.circumference * scrollPercentage) / 100;
  }

  protected calculateStrokeDashoffsetWithScrollPosition(): void {
    const scrollTopHeight = this.angularDocument.defaultView!.scrollY;
    const totalHeight =
      this.angularDocument.documentElement.scrollHeight -
      this.angularDocument.defaultView!.innerHeight;
    const newScrollPercentage = Math.round(
      (scrollTopHeight / totalHeight) * 100,
    );
    this.scrollPercentage.set(Math.min(newScrollPercentage, 100));
  }
}
