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
import { listenToScroll } from '../lib/misc/scroll/listen-to-scroll';

interface RingSet {
  rings: RingModel[];
  mode: ThemeMode;
}

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
  private readonly ringArea =
    viewChild.required<ElementRef<HTMLElement>>('ringArea');
  private context!: CanvasRenderingContext2D;
  private dpi!: number;
  private origin!: { x: number; y: number };
  private textCanvas!: HTMLCanvasElement;
  private textContext!: CanvasRenderingContext2D;
  private ringCanvas!: HTMLCanvasElement;
  private ringContext!: CanvasRenderingContext2D;
  private lightGradientColorStops!: [string, string];
  private darkGradientColorStops!: [string, string];

  private readonly ringCount: number = 150;
  private ringSet: RingSet | undefined;

  // A tap on the rings spreads a new set of rings from the middle outwards
  private previousRingSet: RingSet | undefined;
  private ringWaveStart = 0;
  private readonly ringWaveDuration: number = 700;

  // The rings turn at 24 fps. Like a turntable they start at rest and spin
  // up, also after coming back to the tab. They slow down while the header
  // scrolls out of view and stand still once it is gone. A tap spins them
  // up faster for a moment
  private readonly ringFrameInterval: number = 1000 / 24;
  private ringFrameId: number | undefined;
  private nextRingFrameTime = 0;
  private lastRingFrameTime: number | undefined;
  private ringTime = 0;
  private ringAreaVisibleShare = 1;
  private ringSpeed = 0;
  private ringSpinStart = -Infinity;
  private readonly ringSpinDuration: number = 1200;
  private readonly ringSpinBoost: number = 5;

  // A theme switch changes the record: it brakes, the new colours are put
  // on while it stands, then it spins up again
  private pendingRingSet: RingSet | undefined;
  private ringChangeStart = -Infinity;
  private readonly ringChangeBrake: number = 350;
  private readonly ringChangePause: number = 250;

  // Dragging turns the rings by hand like a record, they stand still while
  // held. Let go, they keep the swing of the hand for a moment and spin up
  // again. A tap without dragging reshuffles
  private ringScratchAngle = 0;
  private scratch:
    | {
      pointerId: number;
      startX: number;
      startY: number;
      angle: number;
      isDragging: boolean;
      canvasRect: DOMRect;
      lastMoveTime: number;
      velocity: number;
    }
    | undefined;
  private readonly scratchDragDistance: number = 6;
  private ringFlingVelocity = 0;
  private readonly ringFlingDecay: number = 700;
  private readonly ringFlingLimit: number = 6 * Math.PI;

  // The record turns around the middle of the "c", where its label sits. The
  // label turns with the record, so a scratch shows on it
  private readonly labelTurnDuration: number = 8;
  private labelRadius!: number;
  private labelColors!: { label: string; half: string; spindle: string };

  private prefersReducedMotion = false;
  private isRingRedrawPending = false;

  protected readonly font: string = 'Geist Sans';
  protected readonly fontWeight: number = 900;

  protected readonly firstLine: string = 'julian';
  protected readonly secondLine: string = 'scholz.';
  protected showCanvas = signal<boolean>(false);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const angularWindow = this.angularDocument.defaultView!;
      const documentStyles = angularWindow.getComputedStyle(
        this.angularDocument.documentElement,
      );
      this.lightGradientColorStops = [
        documentStyles.getPropertyValue('--color-vanilla-extra-dark'),
        documentStyles.getPropertyValue('--color-dark-void-dark'),
      ];
      this.darkGradientColorStops = [
        documentStyles.getPropertyValue('--color-dark-void-light'),
        documentStyles.getPropertyValue('--color-vanilla-light'),
      ];
      this.labelColors = {
        label: documentStyles.getPropertyValue('--color-vanilla'),
        half: documentStyles.getPropertyValue('--color-vanilla-dark'),
        spindle: documentStyles.getPropertyValue('--color-dark-void'),
      };

      this.prefersReducedMotion = angularWindow.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      effect(
        () => {
          const mode = this.themeMode();
          // The view transition of the theme switch already reveals the
          // new colours, so they come without a wave of their own
          untracked(() => {
            if (!this.ringSet) {
              return;
            }
            const ringSet = {
              rings: this.createRings(mode, this.ringSet.rings),
              mode,
            };
            if (this.prefersReducedMotion) {
              this.ringSet = ringSet;
              this.isRingRedrawPending = true;
            } else {
              this.pendingRingSet = ringSet;
              this.ringChangeStart = performance.now();
            }
          });
        },
        { injector: this.injector },
      );

      fromEvent(this.angularDocument, 'visibilitychange')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.angularDocument.visibilityState === 'visible') {
            this.ringSpeed = 0;
            this.ringFlingVelocity = 0;
          }
        });

      fromEvent(angularWindow, 'resize')
        .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (
            typeof this.windowWidth === 'number' &&
            angularWindow.innerWidth !== this.windowWidth
          ) {
            this.initComponent();
          }
        });

      setTimeout(() => {
        this.initComponent();
        this.startRingAnimations();
        listenToScroll(() => this.measureRingArea(), this.destroyRef);
        this.showCanvas.set(true);
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.ringFrameId !== undefined) {
      cancelAnimationFrame(this.ringFrameId);
    }
  }

  protected startScratch(event: PointerEvent): void {
    if (!this.ringSet || event.button !== 0) {
      return;
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const canvasRect = this.canvas().nativeElement.getBoundingClientRect();
    this.scratch = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      angle: this.getPointerAngle(event, canvasRect),
      isDragging: false,
      canvasRect,
      lastMoveTime: event.timeStamp,
      velocity: 0,
    };
  }

  protected moveScratch(event: PointerEvent): void {
    const scratch = this.scratch;
    if (event.pointerId !== scratch?.pointerId) {
      return;
    }
    if (!scratch.isDragging) {
      scratch.isDragging =
        Math.hypot(event.clientX - scratch.startX, event.clientY - scratch.startY) >=
        this.scratchDragDistance;
      if (!scratch.isDragging) {
        return;
      }
      this.ringFlingVelocity = 0;
    }
    const angle = this.getPointerAngle(event, scratch.canvasRect);
    const turnAngle = angle - scratch.angle;
    const turn = Math.atan2(Math.sin(turnAngle), Math.cos(turnAngle));
    const seconds = (event.timeStamp - scratch.lastMoveTime) / 1000;
    if (seconds > 0) {
      scratch.velocity = 0.6 * scratch.velocity + 0.4 * (turn / seconds);
    }
    this.ringScratchAngle += turn;
    scratch.angle = angle;
    scratch.lastMoveTime = event.timeStamp;
    this.ringSpeed = 0;
    this.isRingRedrawPending = true;
  }

  protected endScratch(event: PointerEvent): void {
    const scratch = this.scratch;
    if (event.pointerId !== scratch?.pointerId) {
      return;
    }
    this.scratch = undefined;
    if (!scratch.isDragging) {
      this.reshuffleRings();
      return;
    }
    // A hand that rested before letting go gives no swing
    const isSwung = event.timeStamp - scratch.lastMoveTime < 80;
    if (isSwung && !this.prefersReducedMotion) {
      this.ringFlingVelocity = Math.min(
        Math.max(scratch.velocity, -this.ringFlingLimit),
        this.ringFlingLimit,
      );
    }
  }

  protected cancelScratch(): void {
    this.scratch = undefined;
  }

  private getPointerAngle(event: PointerEvent, canvasRect: DOMRect): number {
    return Math.atan2(
      (event.clientY - canvasRect.top) * this.dpi - this.origin.y,
      (event.clientX - canvasRect.left) * this.dpi - this.origin.x,
    );
  }

  private reshuffleRings(): void {
    this.startRingWave({
      rings: this.createRings(this.themeMode()),
      mode: this.themeMode(),
    });
    this.ringSpinStart = performance.now();
  }

  private initComponent() {
    const angularWindow = this.angularDocument.defaultView!;
    const canvas = this.canvas().nativeElement;
    this.windowWidth = angularWindow.innerWidth;

    const fontSize = parseFloat(angularWindow.getComputedStyle(canvas).fontSize);

    this.context = this.context || canvas.getContext('2d')!;

    this.textCanvas = this.textCanvas || this.renderer.createElement('canvas');
    this.textContext = this.textContext || this.textCanvas.getContext('2d')!;

    this.ringCanvas = this.ringCanvas || this.renderer.createElement('canvas');
    this.ringContext = this.ringContext || this.ringCanvas.getContext('2d')!;

    this.dpi = angularWindow.devicePixelRatio || 1;

    this.ringCanvas.height =
      this.textCanvas.height =
        canvas.height =
          canvas.offsetHeight * this.dpi;
    this.ringCanvas.width =
      this.textCanvas.width =
        canvas.width =
          canvas.offsetWidth * this.dpi;

    // Only the shape of the text matters, the rings are drawn into it
    this.textContext.fillStyle = '#000';
    this.textContext.textAlign = 'center';
    this.textContext.textBaseline = 'middle';
    this.textContext.font = `${this.fontWeight} ${fontSize * this.dpi}px ${this.font}`;
    this.textContext.fillText(
      this.secondLine,
      this.textCanvas.width / 2,
      this.textCanvas.height / 2,
    );

    this.measureRecordMiddle();

    this.context.globalCompositeOperation = 'source-over';
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    this.context.drawImage(this.textCanvas, 0, 0);
    this.context.globalCompositeOperation = 'source-in';

    this.ringSet = {
      rings: this.createRings(this.themeMode()),
      mode: this.themeMode(),
    };
    this.previousRingSet = undefined;
    this.ringTime = 0;
    this.isRingRedrawPending = true;
  }

  // The text is drawn centred around the middle of the canvas, so the "c"
  // starts after the "s" from there on, kerning included
  private measureRecordMiddle(): void {
    const textContext = this.textContext;
    const textWidth = textContext.measureText(this.secondLine).width;
    textContext.textAlign = 'left';
    const letterStart =
      this.textCanvas.width / 2 -
      textWidth / 2 +
      textContext.measureText('sc').width -
      textContext.measureText('c').width;
    const letter = textContext.measureText('c');
    textContext.textAlign = 'center';

    this.origin = {
      x:
        letterStart +
        (letter.actualBoundingBoxRight - letter.actualBoundingBoxLeft) / 2,
      y:
        this.textCanvas.height / 2 +
        (letter.actualBoundingBoxDescent - letter.actualBoundingBoxAscent) / 2,
    };
    this.labelRadius =
      ((letter.actualBoundingBoxAscent + letter.actualBoundingBoxDescent) / 2) *
      0.75;
  }

  // Without a template, all rings are new. With one, they keep its spread and
  // turning and only get new colours
  private createRings(mode: ThemeMode, template?: RingModel[]): RingModel[] {
    return Array.from({ length: this.ringCount }, (_, id) => ({
      id,
      saturation: getRandomNumber(0, 100, 1),
      lightness: getRandomNumber(0, mode !== ThemeMode.DARK ? 100 : 70, 1),
      spread: template?.[id].spread ?? getRandomNumber(75, 359, 1),
      duration: template?.[id].duration ?? getRandomNumber(5, 20, 0.2),
      timeOffset: template?.[id].timeOffset ?? getRandomNumber(1, 5, 0.1),
    }));
  }

  private startRingWave(ringSet: RingSet): void {
    this.previousRingSet = this.prefersReducedMotion ? undefined : this.ringSet;
    this.ringSet = ringSet;
    this.ringWaveStart = performance.now();
    this.isRingRedrawPending = true;
  }

  private measureRingArea(): void {
    const angularWindow = this.angularDocument.defaultView!;
    const { top, bottom, height } =
      this.ringArea().nativeElement.getBoundingClientRect();
    const visibleHeight =
      Math.min(bottom, angularWindow.innerHeight) - Math.max(top, 0);
    this.ringAreaVisibleShare = Math.min(
      Math.max(visibleHeight / Math.min(height, angularWindow.innerHeight), 0),
      1,
    );
  }

  private startRingAnimations() {
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

      if (this.previousRingSet && now - this.ringWaveStart >= this.ringWaveDuration) {
        this.previousRingSet = undefined;
        this.isRingRedrawPending = true;
      }

      const changeTime = now - this.ringChangeStart;
      if (this.pendingRingSet && changeTime >= this.ringChangeBrake) {
        this.ringSet = this.pendingRingSet;
        this.pendingRingSet = undefined;
        this.previousRingSet = undefined;
        this.isRingRedrawPending = true;
      }

      if (!this.prefersReducedMotion && !this.scratch?.isDragging) {
        // Spinning up takes longer than slowing down, braking for a record
        // change is quicker than both
        const isChangingRecord =
          changeTime < this.ringChangeBrake + this.ringChangePause;
        const targetSpeed = isChangingRecord ? 0 : this.ringAreaVisibleShare;
        const settleTime =
          targetSpeed > this.ringSpeed ? 400 : isChangingRecord ? 120 : 250;
        this.ringSpeed +=
          (targetSpeed - this.ringSpeed) *
          (1 - Math.exp(-elapsed / settleTime));
        const spin = Math.max(1 - (now - this.ringSpinStart) / this.ringSpinDuration, 0);
        this.ringTime +=
          (elapsed / 1000) * this.ringSpeed * (1 + this.ringSpinBoost * spin ** 2);

        if (this.ringFlingVelocity !== 0) {
          this.ringScratchAngle += this.ringFlingVelocity * (elapsed / 1000);
          this.ringFlingVelocity *= Math.exp(-elapsed / this.ringFlingDecay);
          if (Math.abs(this.ringFlingVelocity) < 0.05) {
            this.ringFlingVelocity = 0;
          }
        }
      }

      const isAnimating = !this.prefersReducedMotion || !!this.previousRingSet;
      if (
        this.ringAreaVisibleShare > 0 &&
        (isAnimating || this.isRingRedrawPending)
      ) {
        this.drawRings(now);
        this.isRingRedrawPending = false;
      }
    };
    this.ringFrameId = requestAnimationFrame(drawRingFrame);
  }

  private drawRings(now: number) {
    const ringSet = this.ringSet!;
    const { width, height } = this.ringCanvas;
    const origin = this.origin;

    let waveRadius = Infinity;
    if (this.previousRingSet) {
      const progress = Math.min((now - this.ringWaveStart) / this.ringWaveDuration, 1);
      const largestRadius = Math.hypot(
        Math.max(origin.x, width - origin.x),
        Math.max(origin.y, height - origin.y),
      );
      waveRadius = (1 - (1 - progress) ** 2) * largestRadius;
    }

    this.ringContext.clearRect(0, 0, width, height);
    if (this.previousRingSet) {
      this.fillGradient(this.previousRingSet.mode, origin);
      this.ringContext.save();
      this.ringContext.beginPath();
      this.ringContext.arc(origin.x, origin.y, waveRadius, 0, 2 * Math.PI);
      this.ringContext.clip();
      this.fillGradient(ringSet.mode, origin);
      this.ringContext.restore();
    } else {
      this.fillGradient(ringSet.mode, origin);
    }

    this.ringContext.lineWidth = this.dpi;
    this.ringContext.lineCap = 'round';
    for (let id = 0; id < this.ringCount; id++) {
      const radius = id * (4 * this.dpi);
      const { rings, mode } =
        radius <= waveRadius ? ringSet : this.previousRingSet!;
      const ring = rings[id];
      const angle =
        (((this.ringTime + ring.timeOffset) / ring.duration) % 1) * 2 * Math.PI +
        this.ringScratchAngle;

      this.ringContext.strokeStyle = `hsl(${mode !== ThemeMode.DARK ? '45' : '55'}, ${ring.saturation}%, ${ring.lightness}%)`;
      this.ringContext.beginPath();
      this.ringContext.arc(
        origin.x,
        origin.y,
        radius,
        angle,
        angle + (ring.spread * Math.PI) / 180,
      );
      this.ringContext.stroke();
    }

    this.drawLabel(origin);
    this.context.drawImage(this.ringCanvas, 0, 0);
  }

  private drawLabel(origin: { x: number; y: number }) {
    const radius = this.labelRadius;
    const angle =
      ((this.ringTime / this.labelTurnDuration) % 1) * 2 * Math.PI +
      this.ringScratchAngle;

    this.ringContext.save();
    this.ringContext.translate(origin.x, origin.y);
    this.ringContext.rotate(angle);
    this.ringContext.fillStyle = this.labelColors.label;
    this.ringContext.beginPath();
    this.ringContext.arc(0, 0, radius, 0, 2 * Math.PI);
    this.ringContext.fill();
    this.ringContext.fillStyle = this.labelColors.half;
    this.ringContext.beginPath();
    this.ringContext.arc(0, 0, radius, 0, Math.PI);
    this.ringContext.fill();
    this.ringContext.fillStyle = this.labelColors.spindle;
    this.ringContext.beginPath();
    this.ringContext.arc(0, 0, radius * 0.14, 0, 2 * Math.PI);
    this.ringContext.fill();
    this.ringContext.restore();
  }

  private fillGradient(mode: ThemeMode, origin: { x: number; y: number }) {
    const [innerColor, outerColor] =
      mode !== ThemeMode.DARK
        ? this.lightGradientColorStops
        : this.darkGradientColorStops;
    const gradient = this.ringContext.createRadialGradient(
      origin.x,
      origin.y,
      50,
      origin.x,
      origin.y,
      this.ringCanvas.width / 2,
    );
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.5, outerColor);
    this.ringContext.fillStyle = gradient;
    this.ringContext.fillRect(0, 0, this.ringCanvas.width, this.ringCanvas.height);
  }
}
