import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  signal,
  viewChild,
  DOCUMENT
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderNavComponent } from './nav/nav.component';
import { ThemeMode } from '../lib/theme-mode-toggle/utils/theme-mode-toggle.enum';
import { RingModel } from './models/ring.model';
import { ThemeModeToggleService } from '../lib/theme-mode-toggle/theme-mode-toggle.service';
import { debounceTime, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { gsap } from '../lib/misc/gsap/gsap';

@Component({
  selector: 'app-header',
  imports: [CommonModule, HeaderNavComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private readonly changeDetectorRef: ChangeDetectorRef =
    inject(ChangeDetectorRef);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly themeModeToggleService: ThemeModeToggleService = inject(
    ThemeModeToggleService,
  );

  private themeMode: ThemeMode | undefined;
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

  private gsapAnimations: gsap.core.Tween[] = [];
  private gsapTickerCallback: gsap.Callback | undefined;

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

      this.themeModeToggleService.modeChanged$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (themeMode) => {
            this.themeMode = themeMode;
            if (this.gsapAnimations.length > 0) {
              this.initComponent(documentStyles);
            }
          },
          error: (error) => console.error(error),
        });

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

        this.showCanvas.set(true);
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.gsapTickerCallback) {
      gsap.ticker.remove(this.gsapTickerCallback);
    }
    this.resetGsapAnimations();
  }

  private resetGsapAnimations() {
    this.gsapAnimations.forEach((animation) => animation.kill());
    this.gsapAnimations = [];
  }

  private initComponent(documentStyles: CSSStyleDeclaration) {
    if (!this.themeMode) {
      return;
    }

    this.windowWidth = this.angularDocument.defaultView!.innerWidth;

    const getFontSize = (): number => {
      const rem = 16;
      const vw = this.angularDocument.defaultView!.innerWidth / 100;
      const px = gsap.utils.clamp(2 * rem, 12 * rem, 6 * vw + 5 * rem);
      return Math.round(px);
    };

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
      this.themeMode !== ThemeMode.DARK
        ? documentStyles.getPropertyValue('--color-snow')
        : documentStyles.getPropertyValue('--color-dark-void');
    this.textContext.textAlign = 'center';
    this.textContext.textBaseline = 'middle';
    this.textContext.font = `${this.fontWeight} ${getFontSize() * this.dpi}px ${this.font}`;
    this.textContext.fillText(
      this.secondLine,
      this.textCanvas.width / 2,
      this.textCanvas.height / 2,
    );

    this.rings = [];
    for (let i = 0; i < 150; i++) {
      this.rings.push({
        id: i,
        saturation: gsap.utils.random(0, 100, 1),
        lightness: gsap.utils.random(
          0,
          this.themeMode !== ThemeMode.DARK ? 100 : 70,
          1,
        ),
        spread: gsap.utils.random(75, 359, 1),
        angle: 0,
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

    this.resetGsapAnimations();
    this.gsapAnimations = this.rings.map((ring) =>
      gsap.to(ring, {
        angle: 360,
        repeat: -1,
        ease: 'none',
        duration: () => gsap.utils.random(5, 20, 0.2),
        delay: () => gsap.utils.random(-5, -1, 0.1),
      }),
    );
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
    if (this.themeMode !== ThemeMode.DARK) {
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
      this.ringContext.strokeStyle = `hsl(${this.themeMode !== ThemeMode.DARK ? '45' : '55'}, ${ring.saturation}%, ${ring.lightness}%)`;
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
    if (!this.themeMode) {
      return;
    }

    const lightGradientColorStops: [string, string] = [
      documentStyles.getPropertyValue('--color-vanilla-extra-dark'),
      documentStyles.getPropertyValue('--color-dark-void-dark'),
    ];

    const darkGradientFirstColorStops: [string, string] = [
      documentStyles.getPropertyValue('--color-dark-void-light'),
      documentStyles.getPropertyValue('--color-vanilla-light'),
    ];

    gsap.ticker.fps(24);
    this.gsapTickerCallback = gsap.ticker.add(() =>
      this.initRingAnimations(
        lightGradientColorStops,
        darkGradientFirstColorStops,
      ),
    );

    this.changeDetectorRef.detectChanges();
  }
}
