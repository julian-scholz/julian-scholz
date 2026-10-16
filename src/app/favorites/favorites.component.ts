import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { gsap, ScrollTrigger } from '../lib/misc/gsap/gsap';
import { FavoritesOverlayComponent } from './favorites-overlay/favorites-overlay.component';
import { FooterComponent } from '../footer/footer.component';
import { environment } from '../../environment/environment';
import { ShelfComponent } from '../lib/shelf/shelf.component';

@Component({
  selector: 'app-favorites',
  imports: [
    NgOptimizedImage,
    FavoritesOverlayComponent,
    FooterComponent,
    ShelfComponent,
  ],
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected readonly tvImagePath: string = `${environment.assetsUrl}/images/favorites/tv/tv`;
  private readonly tvAspectRatio: number = 256 / 299;
  // Transparent screen of the tv image, as fractions of its size
  private readonly tvScreen = { top: 0.3, right: 0.25, bottom: 0.21, left: 0.09 };
  protected readonly tvStyles: Record<string, number> = {
    '--favorites-tv-aspect-ratio': this.tvAspectRatio,
    '--favorites-tv-screen-top': this.tvScreen.top,
    '--favorites-tv-screen-right': this.tvScreen.right,
    '--favorites-tv-screen-bottom': this.tvScreen.bottom,
    '--favorites-tv-screen-left': this.tvScreen.left,
  };

  private readonly backgroundImagePaths: string[] = Array.from(
    { length: 24 },
    (_, index) => `${environment.assetsUrl}/images/favorites/bg/${index}`,
  );
  protected readonly backgroundImageAlt: string = $localize`:@@favoritesBackgroundImageAlt:Landschaft mit weitem Blick in die Ferne.`;

  // Two slots, so the inactive one can load the picture of the next channel
  protected readonly backgroundImageSlots = signal<string[]>([]);
  protected readonly activeBackgroundImageSlot = signal<number>(0);

  // Share of the tv that has to be in view to switch it on, and share of the
  // zoom after which the channel with teletext and footer comes on
  private readonly tvOnVisibility: number = 0.6;
  private readonly channelOnProgress: number = 0.6;
  protected readonly isTvOn = signal<boolean>(false);
  protected readonly isChannelOn = signal<boolean>(false);
  protected readonly channelSwitchId = signal<number>(0);

  // The zoom imitates a 3d push towards the screen, so it speeds up at the
  // end. The browser plays it along the scroll from keyframes sampled in steps
  private readonly zoomScale: number = 2.7;
  private readonly zoomPerspective: number = 500;
  private readonly zoomDepth: number = 250;
  private readonly backgroundZoomScale: number = 1.4;
  private readonly zoomEase = gsap.parseEase('power1.inOut');
  private readonly zoomSteps: number = 20;

  private readonly zoomTrack =
    viewChild.required<ElementRef<HTMLElement>>('zoomTrack');
  private readonly zoomFrame =
    viewChild.required<ElementRef<HTMLElement>>('zoomFrame');
  private readonly tvWrapper =
    viewChild.required<ElementRef<HTMLElement>>('tvWrapper');
  private readonly tvLayers = viewChildren<ElementRef<HTMLElement>>('tvLayer');
  private readonly backgroundLayer =
    viewChild.required<ElementRef<HTMLElement>>('backgroundLayer');

  private scrollTrigger: ScrollTrigger | undefined;
  private zoomAnimations: Animation[] = [];

  constructor() {
    afterNextRender(() => {
      const firstPath = this.getRandomBackgroundImagePath([]);
      this.backgroundImageSlots.set([
        firstPath,
        this.getRandomBackgroundImagePath([firstPath]),
      ]);
      this.observeTvVisibility();
      if ('ViewTimeline' in window) {
        this.observeZoomProgress();
      }
    });
  }

  // Teletext and footer are only visible once zoomed in, so keyboard focus
  // on them has to bring the zoom along. Clicks are left alone, they can only
  // reach what is already visible
  protected zoomInForFocusedOverlay(event: FocusEvent): void {
    const isKeyboardFocus = (event.target as Element).matches(':focus-visible');
    if (this.scrollTrigger && isKeyboardFocus && !this.isChannelOn()) {
      this.scrollTrigger.scroll(this.scrollTrigger.end);
    }
  }

  protected zapChannel(): void {
    this.channelSwitchId.update((id) => id + 1);
    this.switchBackgroundImage();
  }

  // The tv switches on once it is mostly in view and off once it has left it,
  // the next time it comes on it shows another channel. Browsers without
  // scroll-driven animations get no zoom, there the channel comes on with the tv
  private observeTvVisibility(): void {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= this.tvOnVisibility) {
          this.isTvOn.set(true);
        } else if (!entry.isIntersecting && this.isTvOn()) {
          this.isTvOn.set(false);
          this.switchBackgroundImage();
        }
        if (!this.scrollTrigger) {
          this.setChannelOn(this.isTvOn());
        }
      },
      { threshold: [0, this.tvOnVisibility] },
    );
    observer.observe(this.zoomFrame().nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  // The frame stays in view by css (sticky) while the track scrolls past, the
  // scroll trigger follows the same distance for the channel and rebuilds the
  // zoom whenever the layout changes
  private observeZoomProgress(): void {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.zoomTrack().nativeElement,
      start: 'top top',
      end: () => `+=${this.getZoomDistance()}`,
      onRefresh: () => this.animateZoom(),
      onUpdate: (self) =>
        this.setChannelOn(self.progress >= this.channelOnProgress),
    });
    this.destroyRef.onDestroy(() => {
      this.scrollTrigger?.kill();
      this.zoomAnimations.forEach((animation) => animation.cancel());
    });
  }

  private animateZoom(): void {
    this.zoomAnimations.forEach((animation) => animation.cancel());

    const { finalTvScale, tvCenteringOffset } = this.measureTvLayout();
    const steps = Array.from({ length: this.zoomSteps + 1 }, (_, step) =>
      this.getZoomStep(
        this.zoomEase(step / this.zoomSteps),
        finalTvScale,
        tvCenteringOffset,
      ),
    );
    const options: KeyframeAnimationOptions = {
      timeline: new ViewTimeline({ subject: this.zoomTrack().nativeElement }),
      rangeStart: 'contain 0px',
      rangeEnd: `contain ${this.getZoomDistance()}px`,
      fill: 'both',
    };

    this.zoomAnimations = [
      ...this.tvLayers().map(({ nativeElement }) =>
        nativeElement.animate(
          steps.map(({ tvScale, tvOffset }) => ({
            transform: `translateY(${tvOffset}px) scale(${tvScale})`,
          })),
          options,
        ),
      ),
      this.backgroundLayer().nativeElement.animate(
        steps.map(({ backgroundScale, backgroundOffset }) => ({
          transform: `translateY(${backgroundOffset}px) scale(${backgroundScale})`,
        })),
        options,
      ),
    ];
  }

  // Scrolling distance during which the frame sticks, so the remaining track
  // height. Measured from the start instead of the end of the view, it stays
  // the same when a mobile address bar shows or hides
  private getZoomDistance(): number {
    return (
      this.zoomTrack().nativeElement.offsetHeight -
      this.zoomFrame().nativeElement.offsetHeight
    );
  }

  // On portrait screens the tv leaves room for the footer, so it can be
  // smaller than the view allows and above the middle. The zoom makes up for
  // both, it zooms further by that ratio and moves the tv back to the middle
  private measureTvLayout(): { finalTvScale: number; tvCenteringOffset: number } {
    const tvWrapper = this.tvWrapper().nativeElement;
    const { paddingTop, paddingBottom } = getComputedStyle(tvWrapper);
    const largestTvWidth = Math.min(
      tvWrapper.clientWidth,
      tvWrapper.clientHeight * this.tvAspectRatio,
    );
    const tvWidth = this.tvLayers()[0].nativeElement.offsetWidth;

    return {
      finalTvScale: (this.getApparentZoomScale(1) * largestTvWidth) / tvWidth,
      tvCenteringOffset:
        (parseFloat(paddingBottom) - parseFloat(paddingTop)) / 2,
    };
  }

  // The background picture sits inside the tv, so it is scaled and moved
  // against the tv. That way it stays in the middle of the view and only
  // zooms in, much less than the tv
  private getZoomStep(progress: number, finalTvScale: number, tvCenteringOffset: number) {
    const zoom =
      (this.getApparentZoomScale(progress) - 1) /
      (this.getApparentZoomScale(1) - 1);
    const tvScale = 1 + (finalTvScale - 1) * zoom;
    const tvOffset = tvCenteringOffset * zoom;

    return {
      tvScale,
      tvOffset,
      backgroundScale:
        (1 + (this.backgroundZoomScale - 1) * progress) / tvScale,
      backgroundOffset: (tvCenteringOffset - tvOffset) / tvScale,
    };
  }

  private getApparentZoomScale(progress: number): number {
    return (
      (1 + (this.zoomScale - 1) * progress) *
      (this.zoomPerspective /
        (this.zoomPerspective - this.zoomDepth * progress))
    );
  }

  private setChannelOn(isChannelOn: boolean): void {
    if (isChannelOn !== this.isChannelOn()) {
      this.isChannelOn.set(isChannelOn);
      this.channelSwitchId.update((id) => id + 1);
    }
  }

  private switchBackgroundImage(): void {
    const previousSlot = this.activeBackgroundImageSlot();
    this.activeBackgroundImageSlot.set(1 - previousSlot);
    this.backgroundImageSlots.update((paths) =>
      paths.map((path, slot) =>
        slot === previousSlot ? this.getRandomBackgroundImagePath(paths) : path,
      ),
    );
  }

  private getRandomBackgroundImagePath(excludedPaths: string[]): string {
    return gsap.utils.random(
      this.backgroundImagePaths.filter((path) => !excludedPaths.includes(path)),
    );
  }
}
