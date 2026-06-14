import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgStyle } from '@angular/common';
import { BookRecommendationsBookComponent } from '../book/book.component';
import { BookModel } from '../book/models/book.model';

@Component({
  selector: 'app-book-recommendations-shelf',
  imports: [NgStyle, BookRecommendationsBookComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './shelf.component.html',
})
export class BookRecommendationsShelfComponent {
  public readonly shelfMarginLeft = input.required<number>();
  public readonly shelfMarginRight = input.required<number>();
  public readonly bookWidth = input.required<number>();
  public readonly bookGap = input.required<number>();
  public readonly bookDetails = input.required<BookModel[]>();
}
