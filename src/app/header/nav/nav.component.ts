import {
  afterNextRender,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { NavEntryModel } from './models/nav-entry.model';
import { NavService } from './nav.service';
import { IconComponent } from '../../lib/icon/icon.component';
import { getRandomItem, getRandomNumber } from '../../lib/misc/random/random';

@Component({
  selector: 'app-header-nav',
  imports: [IconComponent],
  templateUrl: './nav.component.html',
})
export class HeaderNavComponent {
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly sortedNavEntries: NavEntryModel[] =
    inject(NavService).sortedNavEntries;

  // The singles drop into their stand one after another, from the back
  protected readonly sleeveDropDelay: number = 400;
  protected readonly sleeveDropStagger: number = 140;

  // Now and then a record is lifted a little, as if someone browsed the crate.
  // Not while the user does that themself
  protected readonly peekedSleeve = signal<number | null>(null);
  protected isBrowsedByUser = false;
  private readonly peekDuration: number = 900;

  constructor() {
    afterNextRender(() => {
      const reduceMotion = this.angularDocument.defaultView!.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (!reduceMotion) {
        this.browseCrate();
      }
    });
  }

  private browseCrate(): void {
    let isInView = false;
    const observer = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
    });
    observer.observe(this.hostElement);

    let peekTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let nextTimeoutId: ReturnType<typeof setTimeout> | undefined;
    const peek = (): void => {
      if (isInView && !this.isBrowsedByUser) {
        const indices = this.sortedNavEntries
          .map((_, index) => index)
          .filter((index) => index !== this.peekedSleeve());
        this.peekedSleeve.set(getRandomItem(indices));
        peekTimeoutId = setTimeout(
          () => this.peekedSleeve.set(null),
          this.peekDuration,
        );
      }
      nextTimeoutId = setTimeout(peek, getRandomNumber(2500, 6000, 100));
    };
    nextTimeoutId = setTimeout(peek, getRandomNumber(3000, 5000, 100));

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      clearTimeout(peekTimeoutId);
      clearTimeout(nextTimeoutId);
    });
  }
}
