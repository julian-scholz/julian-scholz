import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AboutMeTrackModel } from './models/about-me-track.model';
import { listenToScroll } from '../lib/misc/scroll/listen-to-scroll';
import { shuffle } from '../lib/misc/random/random';

@Component({
  selector: 'app-about-me',
  templateUrl: './about-me.component.html',
})
export class AboutMeComponent {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly angularDocument: Document = inject(DOCUMENT);

  protected readonly quote: string =
    '"Innovation distinguishes between a leader and a follower."';
  protected readonly quoteAuthor: string = 'Steve Jobs';
  protected readonly secondLine: string = $localize`:@@aboutMeSecondLine:Entwickler.`;
  protected readonly thirdLine: string = $localize`:@@aboutMeThirdLine:Aus Leidenschaft.`;
  protected readonly fourthLine: string = $localize`:@@aboutMeFourthLine:Mit Sicherheit.`;

  // The record slides out of its sleeve while the section scrolls by, the
  // tracks on the back of the sleeve light up one after another
  protected readonly tracks: AboutMeTrackModel[] = [
    {
      number: 'A1',
      title: this.secondLine,
      length: '3:41',
      litAt: 0.2,
      side: $localize`:@@aboutMeSideA:Seite A`,
    },
    { number: 'A2', title: this.thirdLine, length: '4:12', litAt: 0.42 },
    {
      number: 'B1',
      title: this.fourthLine,
      length: '5:03',
      litAt: 0.64,
      side: $localize`:@@aboutMeSideB:Seite B`,
      encrypted: true,
    },
  ];
  // The record peeks out of the sleeve from the start, so it reads as one
  private readonly recordPeek: number = 0.2;
  private readonly recordOutStart: number = 0.05;
  private readonly recordOutEnd: number = 0.8;

  private readonly scrollTrack =
    viewChild.required<ElementRef<HTMLElement>>('scrollTrack');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  // Share of the scroll track that has been scrolled past
  private readonly progress = signal<number>(0);
  protected readonly litTrackCount = computed(
    () => this.tracks.filter(({ litAt }) => this.progress() >= litAt).length,
  );

  // The record shows the side of the track that lit up last
  private readonly sideBTrackIndex: number = this.tracks
    .map(({ side }) => Boolean(side))
    .lastIndexOf(true);
  protected readonly isSideBPlaying = computed(
    () => this.litTrackCount() > this.sideBTrackIndex,
  );
  protected readonly recordSides: { label: string; isBack: boolean }[] = [
    { label: this.tracks[0].side!, isBack: false },
    { label: this.tracks[this.sideBTrackIndex].side!, isBack: true },
  ];

  private readonly decryptStep: number = 70;
  protected readonly encryptedTitle = signal<string>('');

  constructor() {
    const encryptedTrackIndex = this.tracks.findIndex(
      ({ encrypted }) => encrypted,
    );
    const encryptedTitle = this.tracks[encryptedTrackIndex].title;
    this.encryptedTitle.set(this.encrypt(encryptedTitle, 0));
    // Only its own track changes the title, not the ones lighting up before
    const isEncryptedTrackLit = computed(
      () => this.litTrackCount() > encryptedTrackIndex,
    );

    // Tracks only light up from scrolling, so this only decrypts in the browser
    effect((onCleanup) => {
      if (!isEncryptedTrackLit()) {
        this.encryptedTitle.set(this.encrypt(encryptedTitle, 0));
        return;
      }
      const reduceMotion = this.angularDocument.defaultView!.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (reduceMotion) {
        this.encryptedTitle.set(encryptedTitle);
        return;
      }
      let decryptedLength = 0;
      const intervalId = setInterval(() => {
        decryptedLength++;
        this.encryptedTitle.set(this.encrypt(encryptedTitle, decryptedLength));
        if (decryptedLength >= encryptedTitle.length) {
          clearInterval(intervalId);
        }
      }, this.decryptStep);
      onCleanup(() => clearInterval(intervalId));
    });

    afterNextRender(() => {
      const angularWindow = this.angularDocument.defaultView!;
      const scrollTrack = this.scrollTrack().nativeElement;
      const stage = this.stage().nativeElement;
      listenToScroll(() => {
        const { top, height } = scrollTrack.getBoundingClientRect();
        const progress = this.clamp(-top / (height - angularWindow.innerHeight));
        this.progress.set(progress);
        const recordOut =
          this.recordPeek +
          (1 - this.recordPeek) *
          this.clamp(
            (progress - this.recordOutStart) /
            (this.recordOutEnd - this.recordOutStart),
          );
        stage.style.setProperty('--about-me-record-out', `${recordOut}`);
      }, this.destroyRef);
    });
  }

  private clamp(value: number): number {
    return Math.min(Math.max(value, 0), 1);
  }

  // Shuffles the letters from the given index on among themselves. Built from
  // the same letters, the scrambled title keeps about the width of the real one
  private encrypt(text: string, decryptedLength: number): string {
    const characters = [...text];
    const isScrambled = (character: string, index: number): boolean =>
      index >= decryptedLength && /\p{L}/u.test(character);
    const letters = characters.filter(isScrambled);
    shuffle(letters);

    return characters
      .map((character, index) =>
        isScrambled(character, index) ? letters.pop()! : character,
      )
      .join('');
  }
}
