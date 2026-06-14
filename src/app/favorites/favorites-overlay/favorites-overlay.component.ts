import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FavoritesOverlayEntryModel } from './models/favorites-overlay-entry.model';
import tagListData from '../../../tag-list.json';
import { gsap } from '../../lib/misc/gsap/gsap';

@Component({
  selector: 'app-favorites-overlay',
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './favorites-overlay.component.html',
})
export class FavoritesOverlayComponent {
  private readonly duration: number = 15000;
  private readonly durationSpread: number = 5000;

  private readonly minBorderRadiusValue: number = 18;
  private readonly maxBorderRadiusValue: number = 82;
  private readonly getRandomBorderRadius: () => number = gsap.utils.random(
    this.minBorderRadiusValue,
    this.maxBorderRadiusValue,
    1,
    true,
  );

  protected borderRadius = signal<string>('');
  protected readonly tagList = signal<FavoritesOverlayEntryModel[]>([
    ...tagListData,
  ]);

  constructor() {
    this.tagList.update((list) => {
      list.forEach((entry) => {
        entry.duration = this.getRandomDuration();
      });
      return list;
    });

    this.processOverlayChanges(false);
  }

  protected getRandomDuration(): string {
    const min = this.duration - this.durationSpread;
    const max = this.duration + this.durationSpread;
    return `${gsap.utils.random(min, max, 1)}ms`;
  }

  protected processOverlayChanges(withAnimation: boolean): void {
    this.generateNewBorderRadius();

    if (withAnimation) {
      this.animateOverlayChanges();
    } else {
      this.shuffleTagList();
    }
  }

  private generateNewBorderRadius(): void {
    const fourRandomNumbers = Array.from({ length: 4 }, () =>
      this.getRandomBorderRadius(),
    );
    this.borderRadius.set(
      `${fourRandomNumbers[0]}% ${100 - fourRandomNumbers[0]}% ${fourRandomNumbers[1]}% ${100 - fourRandomNumbers[1]}% / ${fourRandomNumbers[2]}% ${fourRandomNumbers[3]}% ${100 - fourRandomNumbers[3]}% ${100 - fourRandomNumbers[2]}%`,
    );
  }

  private shuffleTagList(): void {
    const shuffledList = gsap.utils.shuffle([...this.tagList()]);
    this.tagList.set(shuffledList);
  }

  private animateOverlayChanges(): void {
    gsap.to('.favorites-overlay-tag-list-item', {
      opacity: 0,
      duration: 0.5,
      stagger: {
        from: 'random',
        each: 0.1,
      },
      ease: 'power1.in',
      onComplete: () => {
        this.shuffleTagList();

        gsap.to('.favorites-overlay-tag-list-item', {
          opacity: 1,
          duration: 0.6,
          stagger: {
            from: 'random',
            each: 0.1,
          },
          ease: 'power1.out',
        });
      },
    });
  }
}
