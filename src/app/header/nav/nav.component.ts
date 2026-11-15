import {
  afterNextRender,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NavEntryModel } from './models/nav-entry.model';
import { NavService } from './nav.service';
import { IconComponent } from '../../lib/icon/icon.component';

interface WaveBar {
  x: number;
  distance: number;
  noise: number;
}

@Component({
  selector: 'app-header-nav',
  imports: [IconComponent],
  templateUrl: './nav.component.html',
})
export class HeaderNavComponent {
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;

  private readonly wave = viewChild.required<ElementRef<HTMLElement>>('wave');
  private readonly barElements = viewChildren<ElementRef<HTMLElement>>('bar');
  private readonly records = viewChildren<ElementRef<HTMLElement>>('record');

  protected readonly sortedNavEntries: NavEntryModel[] =
    inject(NavService).sortedNavEntries;

  // A fixed, uneven level per bar. Phones show every other bar
  private readonly barCount: number = 160;
  protected readonly bars: WaveBar[] = Array.from(
    { length: this.barCount },
    (_, index) => {
      const x = index / (this.barCount - 1);
      return {
        x,
        distance: Math.abs(x - 0.5),
        noise:
          Math.abs(Math.sin(index * 0.73) * Math.sin(index * 0.19 + 1.3)) *
          0.8 +
          0.2,
      };
    },
  );

  // The records drop onto the line, then the waveform spreads out from them
  protected readonly recordDropDelay: number = 400;
  protected readonly recordDropStagger: number = 120;
  protected readonly barRiseDelay: number = 700;
  protected readonly barRiseSpread: number = 1400;

  // Each record plays over the whole waveform, then its color fades out and
  // the next one starts. The bars jump around the playhead
  protected readonly playingRecord = signal<number | null>(null);
  private readonly playbackDelay: number = 2200;
  private readonly trackDuration: number = 7000;
  private readonly trackFadeOut: number = 1200;
  private readonly playheadWidth: number = 0.035;
  private readonly playheadBoost: number = 1.3;

  // Hovering or focusing a record swells the level around it by up to this
  // factor, eased in and out on every frame
  private readonly maxSwell: number = 1.2;
  private readonly swellReachInRecords: number = 1.4;
  private readonly swellEasing: number = 0.12;
  private swellTargets: number[] = this.bars.map(() => 0);
  private readonly swells: number[] = this.bars.map(() => 0);
  private readonly writtenScales: string[] = this.bars.map(() => '');

  private reduceMotion = false;

  constructor() {
    afterNextRender(() => {
      this.reduceMotion = this.angularDocument.defaultView!.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (this.reduceMotion) {
        this.wave().nativeElement.style.setProperty(
          '--header-nav-progress',
          '1',
        );
      } else {
        this.play();
      }
    });
  }

  protected swell(recordIndex: number | null): void {
    if (recordIndex === null) {
      this.swellTargets = this.bars.map(() => 0);
      return;
    }
    const wave = this.wave().nativeElement.getBoundingClientRect();
    const record =
      this.records()[recordIndex].nativeElement.getBoundingClientRect();
    const center = (record.left + record.width / 2 - wave.left) / wave.width;
    const reach = (record.width / wave.width) * this.swellReachInRecords;
    this.swellTargets = this.bars.map(
      (bar) =>
        Math.max(0, 1 - Math.abs(bar.x - center) / reach) * this.maxSwell,
    );
  }

  // Plays only while the header is in view and pauses where it left off
  private play(): void {
    const view = this.angularDocument.defaultView!;
    let isInView = false;
    let frameId: number | undefined;
    let elapsed = 0;
    let lastFrame: number | undefined;

    const frame = (now: number): void => {
      if (!isInView) {
        frameId = undefined;
        return;
      }
      elapsed += lastFrame === undefined ? 0 : now - lastFrame;
      lastFrame = now;
      this.renderPlayback(elapsed, now);
      frameId = view.requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      if (isInView && frameId === undefined) {
        lastFrame = undefined;
        frameId = view.requestAnimationFrame(frame);
      }
    });
    observer.observe(this.hostElement);

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      if (frameId !== undefined) {
        view.cancelAnimationFrame(frameId);
      }
    });
  }

  private renderPlayback(elapsed: number, now: number): void {
    const time = elapsed - this.playbackDelay;
    const cycle = this.trackDuration + this.trackFadeOut;
    let progress = 0;
    let fade = 1;
    let isPlaying = false;
    if (time >= 0) {
      const timeInCycle = time % cycle;
      isPlaying = timeInCycle < this.trackDuration;
      progress = Math.min(1, timeInCycle / this.trackDuration);
      fade = isPlaying
        ? 1
        : 1 - (timeInCycle - this.trackDuration) / this.trackFadeOut;
      this.playingRecord.set(
        isPlaying
          ? Math.floor(time / cycle) % this.sortedNavEntries.length
          : null,
      );
    }

    const wave = this.wave().nativeElement;
    wave.style.setProperty('--header-nav-progress', progress.toFixed(4));
    wave.style.setProperty('--header-nav-fade', fade.toFixed(3));

    const barElements = this.barElements();
    this.bars.forEach((bar, index) => {
      let jump = 0;
      const distanceToPlayhead = Math.abs(bar.x - progress);
      if (isPlaying && distanceToPlayhead < this.playheadWidth) {
        const flicker = 0.75 + 0.5 * Math.abs(Math.sin(now * 0.013 + index));
        jump =
          (1 - distanceToPlayhead / this.playheadWidth) *
          this.playheadBoost *
          flicker;
      }
      this.swells[index] +=
        (this.swellTargets[index] - this.swells[index]) * this.swellEasing;
      const scale = ((1 + jump) * (1 + this.swells[index])).toFixed(3);
      if (scale !== this.writtenScales[index]) {
        this.writtenScales[index] = scale;
        barElements[index].nativeElement.style.transform = `scaleY(${scale})`;
      }
    });
  }
}
