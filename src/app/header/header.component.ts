import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  signal,
  untracked,
  viewChild,
  DOCUMENT,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderNavComponent } from './nav/nav.component';
import { ThemeMode } from '../lib/theme-mode-toggle/utils/theme-mode-toggle.enum';
import { RingModel } from './models/ring.model';
import { ThemeModeToggleService } from '../lib/theme-mode-toggle/theme-mode-toggle.service';
import { debounceTime, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getRandomNumber } from '../lib/misc/random/random';

@Component({
  selector: 'app-header',
  imports: [CommonModule, HeaderNavComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly injector: Injector = inject(Injector);
  private readonly themeModeToggleService: ThemeModeToggleService = inject(
    ThemeModeToggleService,
  );
  private readonly themeMode = this.themeModeToggleService.currentMode;

  private windowWidth: number | undefined;

  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private context!: CanvasRenderingContext2D;
  private rings!: RingModel[];
  private dpi!: number;
  private origin!: { x: number; y: number };
  private textCanvas!: HTMLCanvasElement;
  private textContext!: CanvasRenderingContext2D;
  private ringCanvas!: HTMLCanvasElement;
  private ringContext!: CanvasRenderingContext2D;

  // The rings turn at 24 fps, their time only runs while the canvas is visible
  private readonly ringFrameInterval: number = 1000 / 24;
  private ringFrameId: number | undefined;
  private nextRingFrameTime = 0;
  private lastRingFrameTime: number | undefined;
  private ringTime = 0;
  private canvasIntersectionObserver: IntersectionObserver | undefined;
  private isCanvasVisible = true;
  private prefersReducedMotion = false;
  private isRingRedrawPending = false;

  protected readonly font: string = 'Geist Sans';
  protected readonly fontWeight: number = 900;

  protected readonly firstLine: string = 'julian';
  protected readonly secondLine: string = 'scholz.';
  protected showCanvas = signal<boolean>(false);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyles = this.angularDocument.defaultView!.getComputedStyle(
        this.angularDocument.documentElement,
      );

      this.prefersReducedMotion = this.angularDocument.defaultView!.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      effect(
        () => {
          this.themeMode();
          if (this.rings) {
            untracked(() => this.initComponent(documentStyles));
          }
        },
        { injector: this.injector },
      );

      fromEvent(this.angularDocument.defaultView!, 'resize')
        .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (
            typeof this.windowWidth === 'number' &&
            this.angularDocument.defaultView!.innerWidth !== this.windowWidth
          ) {
            this.initComponent(documentStyles);
          }
        });

      setTimeout(() => {
        this.initComponent(documentStyles);

        this.startRingAnimations(documentStyles);

        this.canvasIntersectionObserver = new IntersectionObserver(
          ([entry]) => (this.isCanvasVisible = entry.isIntersecting),
        );
        this.canvasIntersectionObserver.observe(this.canvas().nativeElement);

        this.showCanvas.set(true);
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.ringFrameId !== undefined) {
      cancelAnimationFrame(this.ringFrameId);
    }
    this.canvasIntersectionObserver?.disconnect();
  }

  private initComponent(documentStyles: CSSStyleDeclaration) {
    this.windowWidth = this.angularDocument.defaultView!.innerWidth;

    const fontSize = parseFloat(
      this.angularDocument.defaultView!.getComputedStyle(
        this.canvas().nativeElement,
      ).fontSize,
    );

    this.context =
      this.context || this.canvas().nativeElement.getContext('2d')!;

    this.textCanvas = this.textCanvas || this.renderer.createElement('canvas');
    this.textContext = this.textContext || this.textCanvas.getContext('2d')!;

    this.ringCanvas = this.ringCanvas || this.renderer.createElement('canvas');
    this.ringContext = this.ringContext || this.ringCanvas.getContext('2d')!;

    this.dpi = this.angularDocument.defaultView!.devicePixelRatio || 1;

    this.ringCanvas.height =
      this.textCanvas.height =
        this.canvas().nativeElement.height =
          this.canvas().nativeElement.offsetHeight * this.dpi;
    this.ringCanvas.width =
      this.textCanvas.width =
        this.canvas().nativeElement.width =
          this.canvas().nativeElement.offsetWidth * this.dpi;

    this.textContext.fillStyle =
      this.themeMode() !== ThemeMode.DARK
        ? documentStyles.getPropertyValue('--color-snow')
        : documentStyles.getPropertyValue('--color-dark-void');
    this.textContext.textAlign = 'center';
    this.textContext.textBaseline = 'middle';
    this.textContext.font = `${this.fontWeight} ${fontSize * this.dpi}px ${this.font}`;
    this.textContext.fillText(
      this.secondLine,
      this.textCanvas.width / 2,
      this.textCanvas.height / 2,
    );

    this.rings = [];
    for (let i = 0; i < 150; i++) {
      this.rings.push({
        id: i,
        saturation: getRandomNumber(0, 100, 1),
        lightness: getRandomNumber(
          0,
          this.themeMode() !== ThemeMode.DARK ? 100 : 70,
          1,
        ),
        spread: getRandomNumber(75, 359, 1),
        angle: this.prefersReducedMotion ? getRandomNumber(0, 359, 1) : 0,
        duration: getRandomNumber(5, 20, 0.2),
        timeOffset: getRandomNumber(1, 5, 0.1),
      });
    }

    this.origin = {
      x: this.canvas().nativeElement.width * 0.25,
      y: this.canvas().nativeElement.height * 0.525,
    };

    this.context.globalCompositeOperation = 'source-over';
    this.context.clearRect(
      0,
      0,
      this.canvas().nativeElement.width,
      this.canvas().nativeElement.height,
    );
    this.context.drawImage(this.textCanvas, 0, 0);
    this.context.globalCompositeOperation = 'source-in';

    this.ringTime = 0;
    this.isRingRedrawPending = true;
  }

  private initRingAnimations(
    lightGradientColorStops: [string, string],
    darkGradientColorStops: [string, string],
  ) {
    this.ringContext.clearRect(
      0,
      0,
      this.ringCanvas.width,
      this.ringCanvas.height,
    );

    const gradient = this.ringContext.createRadialGradient(
      this.origin.x,
      this.origin.y,
      50,
      this.origin.x,
      this.origin.y,
      this.ringCanvas.width / 2,
    );
    if (this.themeMode() !== ThemeMode.DARK) {
      gradient.addColorStop(0, lightGradientColorStops[0]);
      gradient.addColorStop(0.5, lightGradientColorStops[1]);
    } else {
      gradient.addColorStop(0, darkGradientColorStops[0]);
      gradient.addColorStop(0.5, darkGradientColorStops[1]);
    }
    this.ringContext.fillStyle = gradient;

    this.ringContext.fillRect(
      0,
      0,
      this.canvas().nativeElement.width,
      this.canvas().nativeElement.height,
    );
    this.ringContext.lineWidth = this.dpi;
    this.ringContext.lineCap = 'round';

    for (const ring of this.rings) {
      this.ringContext.strokeStyle = `hsl(${this.themeMode() !== ThemeMode.DARK ? '45' : '55'}, ${ring.saturation}%, ${ring.lightness}%)`;
      this.ringContext.save();
      this.ringContext.translate(this.origin.x, this.origin.y);
      this.ringContext.rotate((ring.angle * Math.PI) / 180);
      this.ringContext.translate(this.origin.x * -1, this.origin.y * -1);
      this.ringContext.beginPath();
      this.ringContext.arc(
        this.origin.x,
        this.origin.y,
        ring.id * (4 * this.dpi),
        0,
        (ring.spread * Math.PI) / 180,
      );
      this.ringContext.stroke();
      this.ringContext.restore();
    }
    this.context.drawImage(this.ringCanvas, 0, 0);
  }

  private startRingAnimations(documentStyles: CSSStyleDeclaration) {
    const lightGradientColorStops: [string, string] = [
      documentStyles.getPropertyValue('--color-vanilla-extra-dark'),
      documentStyles.getPropertyValue('--color-dark-void-dark'),
    ];

    const darkGradientFirstColorStops: [string, string] = [
      documentStyles.getPropertyValue('--color-dark-void-light'),
      documentStyles.getPropertyValue('--color-vanilla-light'),
    ];

    const drawRingFrame = (now: number): void => {
      this.ringFrameId = requestAnimationFrame(drawRingFrame);
      if (now < this.nextRingFrameTime) {
        return;
      }
      this.nextRingFrameTime = Math.max(
        this.nextRingFrameTime + this.ringFrameInterval,
        now,
      );
      // A long gap, e.g. from a hidden tab, counts as one frame
      const elapsed = Math.min(
        now - (this.lastRingFrameTime ?? now),
        2 * this.ringFrameInterval,
      );
      this.lastRingFrameTime = now;

      if (
        !this.isCanvasVisible ||
        (this.prefersReducedMotion && !this.isRingRedrawPending)
      ) {
        return;
      }
      if (!this.prefersReducedMotion) {
        this.ringTime += elapsed / 1000;
        for (const ring of this.rings) {
          ring.angle =
            (((this.ringTime + ring.timeOffset) / ring.duration) % 1) * 360;
        }
      }
      this.initRingAnimations(
        lightGradientColorStops,
        darkGradientFirstColorStops,
      );
      this.isRingRedrawPending = false;
    };
    this.ringFrameId = requestAnimationFrame(drawRingFrame);
  }
}
