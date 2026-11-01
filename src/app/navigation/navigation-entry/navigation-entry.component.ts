import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
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

  protected opacity = signal<number>(0);

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
    const sectionPosition: SectionPosition =
      top >= this.sectionOffset
        ? 'before'
        : bottom > this.sectionOffset
          ? 'inside'
          : 'after';
    if (sectionPosition === this.sectionPosition) {
      return;
    }
    this.sectionPosition = sectionPosition;

    const location = this.angularDocument.defaultView!.location;
    const sectionHash = `#${this.navigationEntry().id}`;
    if (sectionPosition === 'inside') {
      this.opacity.set(1);
      this.replaceCurrentState(sectionHash);
    } else {
      this.opacity.set(
        sectionPosition === 'after' && this.navigationLastEntry() ? 1 : 0,
      );
      // A section that is entered next sets its own hash, also when its
      // listener ran first
      if (location.hash === sectionHash) {
        this.replaceCurrentState(location.pathname + location.search);
      }
    }
  }

  private replaceCurrentState(newUrl: string) {
    this.angularDocument.defaultView!.history.replaceState(null, '', newUrl);
  }

  protected navigateTo(elementId: string) {
    this.viewportScroller.scrollToAnchor(elementId);
  }
}
