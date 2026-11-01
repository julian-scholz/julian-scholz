import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { AboutMeDetailModel } from './about-me-detail/models/about-me-detail.model';
import { AboutMeDetailComponent } from './about-me-detail/about-me-detail.component';
import { listenToScroll } from '../lib/misc/scroll/listen-to-scroll';

@Component({
  selector: 'app-about-me',
  imports: [NgStyle, AboutMeDetailComponent],
  templateUrl: './about-me.component.html',
})
export class AboutMeComponent {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected readonly buffer: number = 40;
  protected readonly ppc: number = 10;
  protected readonly pad: number = 8;

  protected readonly firstSplitText: string =
    '"Innovation distinguishes between a leader and a follower." (Steve Jobs)';
  protected readonly secondSplitText: string = $localize`:@@aboutMeSecondLine:Entwickler.`;
  protected readonly thirdSplitText: string = $localize`:@@aboutMeThirdLine:Aus Leidenschaft.`;
  protected readonly fourthSplitText: string = $localize`:@@aboutMeFourthLine:Mit Sicherheit.`;

  protected readonly splitTexts: string[] = [
    this.firstSplitText,
    this.secondSplitText,
    this.thirdSplitText,
    this.fourthSplitText,
  ];
  protected readonly contentLength: number = this.splitTexts.reduce(
    (sum, str) => sum + str.length,
    0,
  );

  protected readonly detailList: AboutMeDetailModel[];

  private readonly scrollTrack =
    viewChild.required<ElementRef<HTMLElement>>('scrollTrack');
  // How far the top of the track has been scrolled past the top of the view
  protected readonly scrolledDistance = signal<number>(-Infinity);

  constructor() {
    this.detailList = [];

    let wordSum = 10;
    this.splitTexts.forEach((splitText, splitTextIndex) => {
      const words = splitText.split(' ');
      words.forEach((word, wordIndex, wordArray) => {
        this.detailList.push({
          text: `${word} `,
          italic: splitTextIndex === 0,
          start: wordSum,
          end: wordSum + word.length,
          endOfLine:
            (splitTextIndex === 1 || splitTextIndex === 2) &&
            wordIndex === wordArray.length - 1,
          endOfSection:
            splitTextIndex === 0 && wordIndex === wordArray.length - 1,
        });

        wordSum += word.length + 1;
      });
    });

    afterNextRender(() => {
      const scrollTrack = this.scrollTrack().nativeElement;
      listenToScroll(
        () =>
          this.scrolledDistance.set(-scrollTrack.getBoundingClientRect().top),
        this.destroyRef,
      );
    });
  }
}
