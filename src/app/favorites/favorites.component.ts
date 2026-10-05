import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
  DOCUMENT,
  ChangeDetectionStrategy
} from '@angular/core';
import { gsap } from '../lib/misc/gsap/gsap';
import {
  isPlatformBrowser,
  NgOptimizedImage,
  NgStyle
} from '@angular/common';
import { FavoritesOverlayComponent } from './favorites-overlay/favorites-overlay.component';
import { FooterComponent } from '../footer/footer.component';
import { ThemeModeToggleService } from '../lib/theme-mode-toggle/theme-mode-toggle.service';
import { ThemeMode } from '../lib/theme-mode-toggle/utils/theme-mode-toggle.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-favorites',
  imports: [
    NgOptimizedImage,
    NgStyle,
    FavoritesOverlayComponent,
    FooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly themeModeToggleService: ThemeModeToggleService = inject(
    ThemeModeToggleService,
  );
  private readonly changeDetectorRef: ChangeDetectorRef =
    inject(ChangeDetectorRef);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  private readonly lightForegroundImagePath: string = `${environment.assetsUrl}/images/favorites/tv/tv_light`;
  private readonly darkForegroundImagePath: string = `${environment.assetsUrl}/images/favorites/tv/tv_dark`;
  private readonly backgroundImagesCount: number = 18;
  protected selectedForegroundImage: string | undefined;
  protected notSelectedForegroundImage: string | undefined;
  private foregroundImageResizeObserver: ResizeObserver | undefined;
  protected selectedBackgroundImagePath: string | undefined;
  protected readonly outlineOffset: number = 3;
  protected outlineWidth = signal<number>(0);

  private readonly showFavoritesOverlayThreshold: number = 0.6;
  private showFavoritesOverlayInitialisationDone = false;
  protected showFavoritesOverlay = signal<boolean>(false);

  private readonly showBackgroundImageThreshold: number = 0.6;
  private backgroundImageIntersectionObserver: IntersectionObserver | undefined;
  protected showBackgroundImage = signal<boolean>(false);

  private readonly scrollImage =
    viewChild.required<ElementRef<HTMLImageElement>>('scrollImage');
  private readonly favoritesScrollTrigger = viewChild.required<
    ElementRef<HTMLDivElement>
  >('favoritesScrollTrigger');

  private gsapTimeline: gsap.core.Timeline | undefined;

  private readonly zoomScale: number = 2.7;
  private readonly zoomPerspective: number = 500;
  private readonly zoomDepth: number = 250;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.selectedBackgroundImagePath = `${environment.assetsUrl}/images/favorites/bg/${gsap.utils.random(0, this.backgroundImagesCount - 1, 1)}`;
    }

    this.themeModeToggleService.modeChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (themeMode) => {
          this.selectedForegroundImage =
            themeMode !== ThemeMode.DARK
              ? this.lightForegroundImagePath
              : this.darkForegroundImagePath;
          this.notSelectedForegroundImage =
            themeMode !== ThemeMode.DARK
              ? this.darkForegroundImagePath
              : this.lightForegroundImagePath;

          this.changeDetectorRef.detectChanges();
        },
        error: (error) => console.error(error),
      });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.backgroundImageIntersectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio >= this.showBackgroundImageThreshold) {
            this.showBackgroundImage.set(true);
          } else if (!entry.isIntersecting) {
            this.showBackgroundImage.set(false);
          }
        },
        { threshold: [0, this.showBackgroundImageThreshold] },
      );
      this.backgroundImageIntersectionObserver.observe(
        this.favoritesScrollTrigger().nativeElement,
      );
    }
  }

  protected afterForegroundImageLoad(): void {
    if (!this.gsapTimeline) {
      this.updateScrollImageSpacerWidth(
        this.scrollImage().nativeElement.getBoundingClientRect().height,
        this.scrollImage().nativeElement.getBoundingClientRect().width,
      );

      this.foregroundImageResizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { height, width } = entry.contentRect;
          this.updateScrollImageSpacerWidth(height, width);
        }
      });
      this.foregroundImageResizeObserver.observe(
        this.scrollImage().nativeElement,
      );

      const zoomEase = gsap.parseEase('power1.inOut');
      const finalZoomScale = this.getApparentZoomScale(1);

      this.gsapTimeline = gsap
        .timeline({
          scrollTrigger: {
            trigger: '#favorites-scroll-trigger',
            start: 'top top',
            end: '+=200%',
            pin: true,
            scrub: true,
            onUpdate: (self) => {
              if (typeof self?.progress === 'number') {
                this.showFavoritesOverlay.set(
                  self.progress >= this.showFavoritesOverlayThreshold,
                );

                if (!this.showFavoritesOverlayInitialisationDone) {
                  self.update(true, false, false);
                  this.showFavoritesOverlayInitialisationDone = true;
                  this.changeDetectorRef.detectChanges();
                }
              }
            },
          },
        })
        .to('#favorites-image-overlay', {
          scale: finalZoomScale,
          transformOrigin: 'center center',
          ease: (time: number) =>
            (this.getApparentZoomScale(zoomEase(time)) - 1) /
            (finalZoomScale - 1),
        })
        .to(
          '#favorites-image-section',
          {
            scale: 1.4,
            transformOrigin: 'center center',
            ease: 'power1.inOut',
          },
          '<',
        );
    }
  }

  ngOnDestroy(): void {
    this.gsapTimeline?.kill();

    this.foregroundImageResizeObserver?.disconnect();
    this.backgroundImageIntersectionObserver?.disconnect();
  }

  private getApparentZoomScale(progress: number): number {
    return (
      (1 + (this.zoomScale - 1) * progress) *
      (this.zoomPerspective / (this.zoomPerspective - this.zoomDepth * progress))
    );
  }

  protected updateScrollImageSpacerWidth(
    scrollImageHeight: number,
    scrollImageWidth: number,
  ): void {
    let xSpacerWidth =
      (this.angularDocument.defaultView!.innerWidth - scrollImageWidth) / 2;
    if (xSpacerWidth <= 0) {
      xSpacerWidth = 0;
    } else {
      xSpacerWidth += this.outlineOffset;
    }
    let ySpacerHeight =
      (this.angularDocument.defaultView!.innerHeight - scrollImageHeight) / 2;
    if (ySpacerHeight <= 0) {
      ySpacerHeight = 0;
    } else {
      ySpacerHeight += this.outlineOffset;
    }
    this.outlineWidth.set(
      Math.round(Math.max(xSpacerWidth, ySpacerHeight) + 100),
    );
  }
}
