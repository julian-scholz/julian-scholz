import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { gsap, ScrollTrigger } from '../lib/misc/gsap/gsap';
import { FavoritesOverlayComponent } from './favorites-overlay/favorites-overlay.component';
import { FooterComponent } from '../footer/footer.component';
import { environment } from '../../environment/environment';
import { ShelfComponent } from '../lib/shelf/shelf.component';
import { ThemeModeToggleService } from '../lib/theme-mode-toggle/theme-mode-toggle.service';
import { ThemeMode } from '../lib/theme-mode-toggle/utils/theme-mode-toggle.enum';

interface BackgroundImage {
  path: string;
  lightColor: string;
}

interface ZoomStep {
  tvScale: number;
  tvOffset: number;
  backgroundScale: number;
  backgroundOffset: number;
}

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
  protected readonly themeModeToggleService: ThemeModeToggleService = inject(
    ThemeModeToggleService,
  );

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
    '--favorites-tv-screen-width': 1 - this.tvScreen.left - this.tvScreen.right,
    '--favorites-tv-screen-height': 1 - this.tvScreen.top - this.tvScreen.bottom,
  };

  // Each picture with its average colour, brightened to full intensity, for
  // the light the screen casts on the shelf in dark mode
  private readonly backgroundImages: BackgroundImage[] = [
    '#ff7b79', '#ff7788', '#ff87a0', '#ff9d92', '#ffd1e1', '#ffb7d9',
    '#ffa486', '#ffa266', '#ffcdb3', '#ff9566', '#ff7e55', '#ff9598',
    '#ff7658', '#ffc7e7', '#ffa550', '#ffb79c', '#ff8162', '#ffd3b0',
    '#ff8e5b', '#ffeabf', '#ffecdf', '#ff87d2', '#ffd3ec', '#ffc7b7',
  ].map((lightColor, index) => ({
    path: `${environment.assetsUrl}/images/favorites/bg/${index}`,
    lightColor,
  }));
  private readonly testCardLightColor: string = '#d8d8f0';

  // The lamp on the lowboard is on in the dark and switches the theme mode
  protected readonly lampImagePath: string = `${environment.assetsUrl}/images/favorites/lamp/lamp`;
  protected readonly flowersImagePath: string = `${environment.assetsUrl}/images/favorites/flowers/flowers`;
  protected readonly lampSwitchLabel = computed(() =>
    this.themeModeToggleService.currentMode() === ThemeMode.DARK
      ? $localize`:@@favoritesLampOffLabel:Licht ausschalten`
      : $localize`:@@favoritesLampOnLabel:Licht einschalten`,
  );
  protected readonly backgroundImageAlt: string = $localize`:@@favoritesBackgroundImageAlt:Landschaft mit weitem Blick in die Ferne.`;

  // Two slots, so the inactive one can load the picture of the next channel
  protected readonly backgroundImageSlots = signal<BackgroundImage[]>([]);
  protected readonly activeBackgroundImageSlot = signal<number>(0);
  protected readonly tvLightColor = computed(() =>
    this.isOffAir()
      ? this.testCardLightColor
      : this.backgroundImageSlots()[this.activeBackgroundImageSlot()]?.lightColor,
  );

  // Share of the tv that has to be in view to switch it on, and share of the
  // zoom after which the channel with teletext and footer comes on
  private readonly tvOnVisibility: number = 0.6;
  private readonly channelOnProgress: number = 0.6;
  // The tv stays hidden until its image is there, otherwise its black screen
  // shows on its own first
  protected readonly isTvImageLoaded = signal<boolean>(false);
  protected readonly isTvOn = signal<boolean>(false);
  protected readonly isChannelOn = signal<boolean>(false);
  // After a minute without any input while the tv is on, the programme ends
  // with a test card. The next input brings it back on another channel
  protected readonly isOffAir = signal<boolean>(false);
  protected readonly isChannelShown = computed(
    () => this.isChannelOn() && !this.isOffAir(),
  );
  protected readonly isOffAirZoomedIn = computed(
    () => this.isChannelOn() && this.isOffAir(),
  );
  private readonly offAirDelay: number = 60_000;
  private readonly offAirInputEvents: string[] = [
    'scroll', 'wheel', 'pointermove', 'pointerdown', 'touchstart', 'keydown',
  ];
  private stopOffAirCountdown: (() => void) | undefined;
  private readonly channelSwitchId = signal<number>(0);
  // A new id renders a new static, so its animation plays again on every switch
  protected readonly channelSwitchIds = computed(() =>
    this.channelSwitchId() ? [this.channelSwitchId()] : [],
  );

  // The zoom imitates a 3d push towards the screen, so it speeds up at the
  // end. The browser plays it along the scroll from keyframes sampled in steps
  private readonly zoomScale: number = 2.7;
  private readonly zoomPerspective: number = 500;
  private readonly zoomDepth: number = 250;
  private readonly backgroundZoomScale: number = 1.4;
  private readonly zoomEase = gsap.parseEase('power1.inOut');
  private readonly zoomSteps: number = 20;
  private readonly finalApparentZoomScale: number = this.getApparentZoomScale(1);

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
      const firstImage = this.getRandomBackgroundImage();
      this.backgroundImageSlots.set([
        firstImage,
        this.getRandomBackgroundImage([firstImage]),
      ]);
      if ('ViewTimeline' in window) {
        this.observeZoomProgress();
      }
      this.observeTvVisibility();
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
          this.stopOffAirCountdown ??= this.startOffAirCountdown();
        } else if (!entry.isIntersecting && this.isTvOn()) {
          this.isTvOn.set(false);
          this.stopOffAirCountdown?.();
          this.stopOffAirCountdown = undefined;
          this.switchBackgroundImage();
        }
        if (!this.scrollTrigger) {
          this.setChannelOn(this.isTvOn());
        }
      },
      { threshold: [0, this.tvOnVisibility] },
    );
    observer.observe(this.zoomFrame().nativeElement);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      this.stopOffAirCountdown?.();
    });
  }

  // Every input restarts the countdown, the first one after the test card
  // also switches the channel back on
  private startOffAirCountdown(): () => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const onInput = (): void => {
      if (this.isOffAir()) {
        this.isOffAir.set(false);
        this.zapChannel();
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => this.isOffAir.set(true), this.offAirDelay);
    };
    this.offAirInputEvents.forEach((type) =>
      window.addEventListener(type, onInput, { passive: true }),
    );
    onInput();

    return () => {
      clearTimeout(timeoutId);
      this.offAirInputEvents.forEach((type) =>
        window.removeEventListener(type, onInput),
      );
      this.isOffAir.set(false);
    };
  }

  // The frame stays in view by css (sticky) while the track scrolls past, the
  // scroll trigger follows the same distance for the channel and rebuilds the
  // zoom whenever the layout changes
  private observeZoomProgress(): void {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.zoomTrack().nativeElement,
      start: 'top top',
      end: 'bottom bottom',
      onRefresh: () => this.animateZoom(),
      onUpdate: (self) =>
        this.setChannelOn(self.progress >= this.channelOnProgress),
    });
    this.destroyRef.onDestroy(() => {
      this.scrollTrigger?.kill();
      this.cancelZoomAnimations();
    });
  }

  private animateZoom(): void {
    this.cancelZoomAnimations();

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
      rangeStart: 'contain 0%',
      rangeEnd: 'contain 100%',
      fill: 'both',
    };
    const tvKeyframes = steps.map(({ tvOffset, tvScale }) =>
      this.getZoomKeyframe(tvOffset, tvScale),
    );
    const backgroundKeyframes = steps.map(
      ({ backgroundOffset, backgroundScale }) =>
        this.getZoomKeyframe(backgroundOffset, backgroundScale),
    );

    this.zoomAnimations = [
      ...this.tvLayers().map(({ nativeElement }) =>
        nativeElement.animate(tvKeyframes, options),
      ),
      this.backgroundLayer().nativeElement.animate(backgroundKeyframes, options),
    ];
  }

  private cancelZoomAnimations(): void {
    this.zoomAnimations.forEach((animation) => animation.cancel());
  }

  private getZoomKeyframe(offset: number, scale: number): Keyframe {
    return {
      '--favorites-zoom-offset': `${offset}px`,
      '--favorites-zoom-scale': scale,
    };
  }

  // Unless the view is short, the tv leaves room for the footer, so it can be
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
      finalTvScale: (this.finalApparentZoomScale * largestTvWidth) / tvWidth,
      tvCenteringOffset:
        (parseFloat(paddingBottom) - parseFloat(paddingTop)) / 2,
    };
  }

  // The background picture sits inside the tv, so it is scaled and moved
  // against the tv. That way it stays in the middle of the view and only
  // zooms in, much less than the tv
  private getZoomStep(
    progress: number,
    finalTvScale: number,
    tvCenteringOffset: number,
  ): ZoomStep {
    const zoom =
      (this.getApparentZoomScale(progress) - 1) /
      (this.finalApparentZoomScale - 1);
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
    this.backgroundImageSlots.update((images) =>
      images.map((image, slot) =>
        slot === previousSlot ? this.getRandomBackgroundImage(images) : image,
      ),
    );
  }

  private getRandomBackgroundImage(
    excludedImages: BackgroundImage[] = [],
  ): BackgroundImage {
    return gsap.utils.random(
      this.backgroundImages.filter((image) => !excludedImages.includes(image)),
    );
  }
}
