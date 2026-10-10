import {
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { DatePipe, isPlatformBrowser, NgClass, NgStyle } from '@angular/common';
import {
  FavoritesOverlayEntryModel,
  FavoritesOverlayPageId,
  FavoritesOverlayTagListEntryModel
} from './models/favorites-overlay-entry.model';
import tagListData from '../../../tag-list.json';

@Component({
  selector: 'app-favorites-overlay',
  imports: [NgStyle, NgClass, DatePipe],
  templateUrl: './favorites-overlay.component.html',
})
export class FavoritesOverlayComponent {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected readonly firstPageNumber: number = 101;
  protected readonly dateFormat: string = $localize`:@@teletextDateFormat:dd.MM. HH:mm`;
  private readonly tagList = tagListData as FavoritesOverlayTagListEntryModel[];
  private readonly pageTitles: Record<FavoritesOverlayPageId, string> = {
    languages: $localize`:@@teletextLanguagesTitle:Sprachen`,
    frameworks: $localize`:@@teletextFrameworksTitle:Frameworks`,
    devOps: $localize`:@@teletextDevOpsTitle:DevOps`,
    tools: $localize`:@@teletextToolsTitle:Tools`,
    security: $localize`:@@teletextSecurityTitle:Security`,
    databases: $localize`:@@teletextDatabasesTitle:Datenbanken`,
  };
  protected readonly pages: FavoritesOverlayEntryModel[] = this.tagList.map(
    ({ id, tags }) => ({ title: this.pageTitles[id], tags }),
  );
  private readonly securityPageIndex: number = this.tagList.findIndex(
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

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const clockIntervalId = setInterval(() => this.now.set(new Date()), 30000);
      this.destroyRef.onDestroy(() => clearInterval(clockIntervalId));
    }
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
