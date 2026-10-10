import { Component, input, signal } from '@angular/core';
import { NgClass, NgOptimizedImage, NgStyle } from '@angular/common';
import { BookModel } from './models/book.model';

@Component({
  selector: 'app-book-recommendations-book',
  imports: [NgStyle, NgClass, NgOptimizedImage],
  templateUrl: './book.component.html',
})
export class BookRecommendationsBookComponent {
  public readonly bookIndex = input.required<number>();
  public readonly bookWidth = input.required<number>();
  public readonly bookDetails = input.required<BookModel>();

  protected isBookCoverOpen = signal<boolean>(false);

  protected toggleCoverOpen(): void {
    this.isBookCoverOpen.update((current) => !current);
  }
}
