import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  RendererStyleFlags2,
  signal,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, NgStyle } from '@angular/common';
import { BookRecommendationsBookComponent } from '../book/book.component';
import { BookModel } from '../book/models/book.model';

@Component({
  selector: 'app-book-recommendations-shelf',
  imports: [NgStyle, BookRecommendationsBookComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './shelf.component.html',
})
export class BookRecommendationsShelfComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private shelfIntersectionObserver: IntersectionObserver | undefined;
  private readonly shelfLightListenerCleanups: (() => void)[] = [];
  private readonly shelfElement =
    viewChild.required<ElementRef<HTMLDivElement>>('shelfElement');

  public readonly shelfMarginLeft = input.required<number>();
  public readonly shelfMarginRight = input.required<number>();
  public readonly bookWidth = input.required<number>();
  public readonly bookGap = input.required<number>();
  public readonly bookDetails = input.required<BookModel[]>();

  protected isShelfLit = signal<boolean>(false);
  protected readonly dustParticles: {
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
  }[] = [
    { left: 8, top: 35, size: 2, duration: 9, delay: -1 },
    { left: 18, top: 60, size: 1.5, duration: 12, delay: -6 },
    { left: 31, top: 25, size: 2.5, duration: 10, delay: -3 },
    { left: 44, top: 70, size: 1.5, duration: 14, delay: -9 },
    { left: 56, top: 40, size: 2, duration: 11, delay: -4 },
    { left: 67, top: 65, size: 1, duration: 8, delay: -2 },
    { left: 79, top: 30, size: 2, duration: 13, delay: -7 },
    { left: 90, top: 55, size: 1.5, duration: 10, delay: -5 },
  ];

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const shelfElement = this.shelfElement().nativeElement;

      this.shelfIntersectionObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.isShelfLit.set(true);
            this.shelfIntersectionObserver?.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      this.shelfIntersectionObserver.observe(shelfElement);

      this.shelfLightListenerCleanups.push(
        this.renderer.listen(shelfElement, 'pointermove', (event: PointerEvent) => {
          const shelfRect = shelfElement.getBoundingClientRect();
          const lightX = ((event.clientX - shelfRect.left) / shelfRect.width) * 100;
          this.setShelfLightX(Math.min(Math.max(lightX, 10), 90));
        }),
        this.renderer.listen(shelfElement, 'pointerleave', () =>
          this.setShelfLightX(50),
        ),
      );
    }
  }

  ngOnDestroy(): void {
    this.shelfIntersectionObserver?.disconnect();
    this.shelfLightListenerCleanups.forEach((cleanup) => cleanup());
  }

  private setShelfLightX(lightX: number): void {
    this.renderer.setStyle(
      this.shelfElement().nativeElement,
      '--shelf-light-x',
      `${lightX}%`,
      RendererStyleFlags2.DashCase,
    );
  }
}
