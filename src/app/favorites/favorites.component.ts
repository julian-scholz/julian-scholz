import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild
} from '@angular/core';
import { gsap } from '../lib/misc/gsap/gsap';
import {
  isPlatformBrowser,
  NgOptimizedImage,
  NgStyle
} from '@angular/common';
import { FavoritesOverlayComponent } from './favorites-overlay/favorites-overlay.component';
import { FooterComponent } from '../footer/footer.component';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-favorites',
  imports: [
    NgOptimizedImage,
    NgStyle,
    FavoritesOverlayComponent,
    FooterComponent,
  ],
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);

  protected readonly lightForegroundImagePath: string = `${environment.assetsUrl}/images/favorites/tv/tv_light`;
  protected readonly darkForegroundImagePath: string = `${environment.assetsUrl}/images/favorites/tv/tv_dark`;
  private readonly foregroundImageAspectRatio: number = 256 / 299;
  private readonly foregroundImageScreen = {
    top: 0.3,
    right: 0.25,
    bottom: 0.21,
    left: 0.09,
  };
  protected readonly foregroundImageStyles: Record<string, number> = {
    '--favorites-tv-aspect-ratio': this.foregroundImageAspectRatio,
    '--favorites-tv-screen-top': this.foregroundImageScreen.top,
    '--favorites-tv-screen-right': this.foregroundImageScreen.right,
    '--favorites-tv-screen-bottom': this.foregroundImageScreen.bottom,
    '--favorites-tv-screen-left': this.foregroundImageScreen.left,
  };
  private readonly backgroundImagesCount: number = 18;
  protected readonly backgroundImageAlt: string = $localize`:@@favoritesBackgroundImageAlt:Landschaft mit weitem Blick in die Ferne.`;
  protected backgroundImagePaths = signal<string[]>([]);
  protected activeBackgroundImageIndex = signal<number>(0);

  private readonly showFavoritesOverlayThreshold: number = 0.6;
  protected showFavoritesOverlay = signal<boolean>(false);
  protected channelSwitchId = signal<number>(0);

  private readonly showBackgroundImageThreshold: number = 0.6;
  private backgroundImageIntersectionObserver: IntersectionObserver | undefined;
  protected showBackgroundImage = signal<boolean | undefined>(undefined);

  private readonly favoritesScrollTrigger = viewChild.required<
    ElementRef<HTMLDivElement>
  >('favoritesScrollTrigger');

  private gsapTimeline: gsap.core.Timeline | undefined;

  private readonly zoomScale: number = 2.7;
  private readonly zoomPerspective: number = 500;
  private readonly zoomDepth: number = 250;
  private readonly backgroundZoomScale: number = 1.4;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const activePath = this.getRandomBackgroundImagePath([]);
      this.backgroundImagePaths.set([
        activePath,
        this.getRandomBackgroundImagePath([activePath]),
      ]);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.backgroundImageIntersectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio >= this.showBackgroundImageThreshold) {
            this.showBackgroundImage.set(true);
          } else if (this.showBackgroundImage()) {
            this.showBackgroundImage.set(false);
          }
        },
        { threshold: this.showBackgroundImageThreshold },
      );
      this.backgroundImageIntersectionObserver.observe(
        this.favoritesScrollTrigger().nativeElement,
      );

      this.initZoom();
    }
  }

  ngOnDestroy(): void {
    this.gsapTimeline?.kill();

    this.backgroundImageIntersectionObserver?.disconnect();
  }

  private initZoom(): void {
    const zoomEase = gsap.parseEase('power1.inOut');
    const finalZoomScale = this.getApparentZoomScale(1);
    const finalBackgroundCounterScale = this.getBackgroundCounterScale(1);

    this.gsapTimeline = gsap
      .timeline({
        scrollTrigger: {
          trigger: '#favorites-scroll-trigger',
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            const showFavoritesOverlay =
              self.progress >= this.showFavoritesOverlayThreshold;
            if (showFavoritesOverlay !== this.showFavoritesOverlay()) {
              this.showFavoritesOverlay.set(showFavoritesOverlay);
              this.channelSwitchId.update((id) => id + 1);
              this.switchBackgroundImage();
            }
          },
        },
      })
      .to('[data-favorites-tv]', {
        scale: finalZoomScale,
        transformOrigin: 'center center',
        ease: (time: number) =>
          (this.getApparentZoomScale(zoomEase(time)) - 1) /
          (finalZoomScale - 1),
      })
      .to(
        '#favorites-image-section',
        {
          scale: finalBackgroundCounterScale,
          transformOrigin: 'center center',
          ease: (time: number) =>
            (this.getBackgroundCounterScale(zoomEase(time)) - 1) /
            (finalBackgroundCounterScale - 1),
        },
        '<',
      );
  }

  // Teletext and footer are only visible once zoomed in, so keyboard focus
  // on them has to bring the zoom along
  protected zoomInForFocusedOverlay(): void {
    const scrollTrigger = this.gsapTimeline?.scrollTrigger;
    if (scrollTrigger && !this.showFavoritesOverlay()) {
      scrollTrigger.scroll(scrollTrigger.end);
    }
  }

  private switchBackgroundImage(): void {
    const previousIndex = this.activeBackgroundImageIndex();
    this.activeBackgroundImageIndex.set(1 - previousIndex);
    this.backgroundImagePaths.update((paths) =>
      paths.map((path, index) =>
        index === previousIndex
          ? this.getRandomBackgroundImagePath(paths)
          : path,
      ),
    );
  }

  private getRandomBackgroundImagePath(excludedPaths: string[]): string {
    const paths = Array.from(
      { length: this.backgroundImagesCount },
      (_, index) => `${environment.assetsUrl}/images/favorites/bg/${index}`,
    ).filter((path) => !excludedPaths.includes(path));

    return gsap.utils.random(paths);
  }

  private getApparentZoomScale(progress: number): number {
    return (
      (1 + (this.zoomScale - 1) * progress) *
      (this.zoomPerspective / (this.zoomPerspective - this.zoomDepth * progress))
    );
  }

  // The background image sits inside the scaled tv, so it is scaled against
  // it to end up at its own, much smaller zoom
  private getBackgroundCounterScale(progress: number): number {
    return (
      (1 + (this.backgroundZoomScale - 1) * progress) /
      this.getApparentZoomScale(progress)
    );
  }
}
