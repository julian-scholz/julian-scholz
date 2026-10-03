import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
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
  private shelfIntersectionObserver: IntersectionObserver | undefined;
  private readonly shelfElement =
    viewChild.required<ElementRef<HTMLDivElement>>('shelfElement');

  public readonly shelfMarginLeft = input.required<number>();
  public readonly shelfMarginRight = input.required<number>();
  public readonly bookWidth = input.required<number>();
  public readonly bookGap = input.required<number>();
  public readonly bookDetails = input.required<BookModel[]>();

  protected isShelfLit = signal<boolean>(false);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.shelfIntersectionObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.isShelfLit.set(true);
            this.shelfIntersectionObserver?.disconnect();
          }
        },
        { threshold: 0.5 },
      );
      this.shelfIntersectionObserver.observe(this.shelfElement().nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.shelfIntersectionObserver?.disconnect();
  }
}
