import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
  DOCUMENT
} from '@angular/core';
import { BookRecommendationsShelfComponent } from './shelf/shelf.component';
import { BookModel } from './book/models/book.model';
import { isPlatformBrowser } from '@angular/common';
import { debounceTime, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { gsap } from '../lib/misc/gsap/gsap';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-book-recommendations',
  imports: [BookRecommendationsShelfComponent],
  templateUrl: './book-recommendations.component.html',
})
export class BookRecommendationsComponent implements AfterViewInit {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  private readonly section = viewChild.required<ElementRef<HTMLElement>>(
    'bookRecommendationsSection',
  );

  private readonly shelfMinFreeSpace: number = 100;
  protected readonly shelfMarginLeft: number = 40;
  protected readonly shelfMarginRight: number = 48;
  protected readonly bookWidth: number = 200;
  protected readonly bookGap: number = 64;
  protected readonly bookDetails: BookModel[] = [
    {
      url: 'https://www.schneier.com/books/a-hackers-mind/',
      backfaceColor: '#64c3c1',
      cover: {
        imagePath: `${environment.assetsUrl}/images/books/0`,
        height: 302,
      },
      details: {
        author: 'Bruce Schneier',
        title: "A Hacker's Mind",
        subtitle:
          "How the Powerful Bend Society's Rules, and How to Bend them Back",
        summary:
          'Bruce Schneier zeigt eindrucksvoll, welche mitunter gefährlichen Abhängigkeiten in den letzten Jahrzehnten zwischen der Computerwelt und unseren sozialen, wirtschaftlichen und politischen Systemen entstanden sind.',
      },
    },
    {
      url: 'https://www.andrewhoffman.me/web-application-security-oreilly/',
      backfaceColor: '#796052',
      cover: {
        imagePath: `${environment.assetsUrl}/images/books/1`,
        height: 262,
      },
      details: {
        author: 'Andrew Hoffman',
        title: 'Web Application Security',
        subtitle:
          'Exploitation and Countermeasures for Modern Web Applications',
        summary:
          'Andrew Hoffman gliedert Anwendungssicherheit in drei Säulen und zeigt aktuelle Angriffe und Gegenmaßnahmen im Rahmen eines sicheren Entwicklungsprozesses.',
      },
    },
    {
      url: 'https://a.co/d/hmiPrkS',
      backfaceColor: '#5c5440',
      cover: {
        imagePath: `${environment.assetsUrl}/images/books/2`,
        height: 308,
      },
      details: {
        author: 'Kim Zetter',
        title: 'Countdown to Zero Day',
        subtitle: "Stuxnet and the Launch of the World's First Digital Weapon",
        summary:
          'Mit Spannung erzählt Kim Zetter die Geschichte eines Virus, der Irans Nuklearprogramm sabotierte und eröffnet den Blick auf eine neue Ära der digitalen Kriegsführung, in der digitale Angriffe ungeahnte Zerstörung anrichten können.',
      },
    },
    {
      url: 'https://angular-buch.com/',
      backfaceColor: '#ca020a',
      cover: {
        imagePath: `${environment.assetsUrl}/images/books/3`,
        height: 291,
      },
      details: {
        author: 'Ferdinand Malcher, Danny Koppenhagen & Johannes Hoppe',
        title: 'Angular: Das große Praxisbuch',
        subtitle: 'Grundlagen, fortgeschrittene Themen und Best Practices',
        summary:
          'Die Autoren haben es mit diesem Buch geschafft, sowohl Einsteiger- als auch fortgeschrittenere Theorien klar und verständlich zu erklären. Die theoretischen Aspekte werden durch sehr gute Beispiele veranschaulicht.',
      },
    },
  ];
  protected shelveRows = signal<BookModel[][]>([]);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(this.angularDocument.defaultView!, 'resize')
        .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.recalculateShelves(false);
        });

      this.recalculateShelves(true);
    }
  }

  private recalculateShelves(shuffleBookOrder: boolean): void {
    const newShelveRows: BookModel[][] = [];

    const sectionStyle = this.angularDocument.defaultView!.getComputedStyle(
      this.section().nativeElement,
    );
    const availableSectionWidth =
      this.section().nativeElement.clientWidth -
      (parseFloat(sectionStyle.paddingLeft) +
        parseFloat(sectionStyle.paddingRight));

    const minNeededWidthForRow = this.shelfMarginLeft + this.shelfMarginRight;

    let currentBooksInRow: BookModel[] = [];
    let currentWidthForRow = minNeededWidthForRow;

    if (shuffleBookOrder) {
      gsap.utils.shuffle(this.bookDetails);
    }
    for (let i = 0; i < this.bookDetails.length; i++) {
      const widthForNewBook = this.bookWidth + (i === 0 ? 0 : this.bookGap);

      if (
        currentWidthForRow + widthForNewBook + this.shelfMinFreeSpace <=
        availableSectionWidth
      ) {
        currentBooksInRow.push(this.bookDetails[i]);
        currentWidthForRow += widthForNewBook;
      } else {
        if (currentBooksInRow.length > 0) {
          newShelveRows.push(currentBooksInRow);
        }
        currentBooksInRow = [this.bookDetails[i]];
        currentWidthForRow = minNeededWidthForRow + this.bookWidth;
      }
    }

    if (currentBooksInRow.length > 0) {
      newShelveRows.push(currentBooksInRow);
    }

    if (!this.isShelvesLengthEqual(this.shelveRows(), newShelveRows)) {
      this.shelveRows.set(newShelveRows);
    }
  }

  private isShelvesLengthEqual(
    currentShelveRows: BookModel[][],
    newShelveRows: BookModel[][],
  ): boolean {
    if (currentShelveRows.length !== newShelveRows.length) {
      return false;
    }

    for (let i = 0; i < currentShelveRows.length; i++) {
      if (currentShelveRows[i].length !== newShelveRows[i].length) {
        return false;
      }
    }

    return true;
  }
}
