import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
  DOCUMENT,
} from '@angular/core';
import {
  isPlatformBrowser,
  NgStyle,
  ViewportScroller,
} from '@angular/common';
import { NavigationEntryModel } from './models/navigation-entry.model';
import { listenToScroll } from '../../lib/misc/scroll/listen-to-scroll';

type SectionPosition = 'before' | 'inside' | 'after';

@Component({
  selector: 'app-navigation-entry',
  imports: [NgStyle],
  templateUrl: './navigation-entry.component.html',
})
export class NavigationEntryComponent implements AfterViewInit {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly viewportScroller: ViewportScroller =
    inject(ViewportScroller);

  public readonly navigationEntry = input.required<NavigationEntryModel>();
  public readonly navigationEntryIndex = input.required<number>();
  public readonly navigationLastEntry = input.required<boolean>();

  public readonly activeChange = output<boolean>();
  public readonly progressChange = output<number>();

  private readonly groove =
    viewChild.required<ElementRef<HTMLElement>>('groove');

  protected readonly active = signal<boolean>(false);

  // The entry is active while its section covers the top of the view, 5px
  // below the edge
  private readonly sectionOffset: number = 5;
  private sectionPosition: SectionPosition = 'before';

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const section = this.angularDocument.getElementById(
        this.navigationEntry().id,
      )!;
      listenToScroll(() => this.updateSectionPosition(section), this.destroyRef);
    }
  }

  private updateSectionPosition(section: HTMLElement): void {
    const { top, bottom } = section.getBoundingClientRect();
    // The last section ends with the page, before its bottom reaches the top
    const angularWindow = this.angularDocument.defaultView!;
    const scrollLeft =
      this.angularDocument.documentElement.scrollHeight -
      angularWindow.innerHeight -
      angularWindow.scrollY;
    const scrollRange =
      Math.min(bottom - this.sectionOffset, scrollLeft) +
      this.sectionOffset -
      top;
    const progress =
      scrollRange > 0
        ? Math.min(Math.max((this.sectionOffset - top) / scrollRange, 0), 1)
        : 0;
    this.groove().nativeElement.style.setProperty(
      '--navigation-entry-progress',
      `${progress}`,
    );

    const sectionPosition: SectionPosition =
      top >= this.sectionOffset
        ? 'before'
        : bottom > this.sectionOffset
          ? 'inside'
          : 'after';
    if (sectionPosition !== this.sectionPosition) {
      this.sectionPosition = sectionPosition;
      this.updateActive(sectionPosition);
    }
    if (this.active()) {
      this.progressChange.emit(progress);
    }
  }

  private updateActive(sectionPosition: SectionPosition): void {
    const location = this.angularDocument.defaultView!.location;
    const sectionHash = `#${this.navigationEntry().id}`;
    if (sectionPosition === 'inside') {
      this.setActive(true);
      this.replaceCurrentState(sectionHash);
    } else {
      this.setActive(sectionPosition === 'after' && this.navigationLastEntry());
      // A section that is entered next sets its own hash, also when its
      // listener ran first
      if (location.hash === sectionHash) {
        this.replaceCurrentState(location.pathname + location.search);
      }
    }
  }

  private setActive(active: boolean): void {
    if (active !== this.active()) {
      this.active.set(active);
      this.activeChange.emit(active);
    }
  }

  private replaceCurrentState(newUrl: string) {
    this.angularDocument.defaultView!.history.replaceState(null, '', newUrl);
  }

  // Modified clicks keep the link behavior, e.g. opening it in a new tab
  protected navigateTo(event: MouseEvent): void {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const elementId = this.navigationEntry().id;
    this.viewportScroller.scrollToAnchor(elementId);
    this.angularDocument
      .getElementById(elementId)!
      .focus({ preventScroll: true });
  }
}
