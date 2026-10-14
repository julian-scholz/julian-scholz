import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { DatePipe, isPlatformBrowser, NgClass, NgStyle } from '@angular/common';
import {
  FavoritesOverlayEntryModel,
  FavoritesOverlayPageId
} from './models/favorites-overlay-entry.model';
import { tagList } from '../../../tag-list';

@Component({
  selector: 'app-favorites-overlay',
  imports: [NgStyle, NgClass, DatePipe],
  templateUrl: './favorites-overlay.component.html',
  host: {
    '(document:keydown)': 'enterPageNumberDigit($event)',
  },
})
export class FavoritesOverlayComponent {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  public readonly isChannelOn = input<boolean>(false);

  protected readonly firstPageNumber: number = 101;
  protected readonly dateFormat: string = $localize`:@@teletextDateFormat:dd.MM. HH:mm`;
  private readonly pageTitles: Record<FavoritesOverlayPageId, string> = {
    languages: $localize`:@@teletextLanguagesTitle:Sprachen`,
    frameworks: $localize`:@@teletextFrameworksTitle:Frameworks`,
    devOps: $localize`:@@teletextDevOpsTitle:DevOps`,
    tools: $localize`:@@teletextToolsTitle:Tools`,
    security: $localize`:@@teletextSecurityTitle:Security`,
    databases: $localize`:@@teletextDatabasesTitle:Datenbanken`,
  };
  protected readonly pages: FavoritesOverlayEntryModel[] = tagList.map(
    ({ id, tags }) => ({ title: this.pageTitles[id], tags }),
  );
  private readonly securityPageIndex: number = tagList.findIndex(
    ({ id }) => id === 'security',
  );

  protected readonly currentPageIndex = signal<number>(0);
  protected readonly now = signal<Date>(new Date());

  private readonly pageViewId = signal<number>(0);
  protected readonly pageViews = computed(() => [
    {
      id: this.pageViewId(),
      pageNumber: this.firstPageNumber + this.currentPageIndex(),
      page: this.pages[this.currentPageIndex()],
    },
  ]);

  private readonly pageNumberLength: number = 3;
  private readonly pageNumberInputTimeout: number = 2000;
  private pageNumberInputTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private readonly enteredPageNumber = signal<string>('');
  protected readonly displayedPageNumber = computed(() =>
    this.enteredPageNumber()
      ? this.enteredPageNumber().padEnd(this.pageNumberLength, '-')
      : String(this.pageViews()[0].pageNumber),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const clockIntervalId = setInterval(() => this.now.set(new Date()), 30000);
      this.destroyRef.onDestroy(() => {
        clearInterval(clockIntervalId);
        clearTimeout(this.pageNumberInputTimeoutId);
      });
    }
  }

  protected enterPageNumberDigit(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (
      !this.isChannelOn() ||
      !/^\d$/.test(event.key) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      target.isContentEditable ||
      target.closest('input, textarea, select, dialog')
    ) {
      return;
    }

    const previousInput =
      this.enteredPageNumber().length < this.pageNumberLength
        ? this.enteredPageNumber()
        : '';
    const enteredPageNumber = previousInput + event.key;
    this.enteredPageNumber.set(enteredPageNumber);
    clearTimeout(this.pageNumberInputTimeoutId);

    if (enteredPageNumber.length === this.pageNumberLength) {
      const pageIndex = Number(enteredPageNumber) - this.firstPageNumber;
      if (pageIndex >= 0 && pageIndex < this.pages.length) {
        this.enteredPageNumber.set('');
        this.showPage(pageIndex);
        return;
      }
    }

    this.pageNumberInputTimeoutId = setTimeout(
      () => this.enteredPageNumber.set(''),
      this.pageNumberInputTimeout,
    );
  }

  protected showPage(index: number): void {
    this.currentPageIndex.set(
      (index + this.pages.length) % this.pages.length,
    );
    this.pageViewId.update((id) => id + 1);
  }

  protected showPreviousPage(): void {
    this.showPage(this.currentPageIndex() - 1);
  }

  protected showNextPage(): void {
    this.showPage(this.currentPageIndex() + 1);
  }

  protected showSecurityPage(): void {
    this.showPage(this.securityPageIndex);
  }

  protected showRandomPage(): void {
    const otherPageIndexes = this.pages
      .map((_, index) => index)
      .filter((index) => index !== this.currentPageIndex());

    this.showPage(
      otherPageIndexes[Math.floor(Math.random() * otherPageIndexes.length)],
    );
  }
}
