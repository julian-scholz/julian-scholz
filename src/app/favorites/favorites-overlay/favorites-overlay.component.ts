import {ChangeDetectorRef, Component, inject} from "@angular/core";
import {KeyValuePipe, NgStyle} from "@angular/common";
import {FavoritesOverlayEntryModel} from "./models/favorites-overlay-entry.model";
import tagListData from "../../../tag-list.json";
import {gsap} from "../../lib/misc/gsap/gsap";

@Component({
  selector: 'app-favorites-overlay',
  standalone: true,
  imports: [
    KeyValuePipe,
    NgStyle
  ],
  templateUrl: './favorites-overlay.component.html'
})
export class FavoritesOverlayComponent {
  private readonly changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);

  private readonly duration: number = 15000;
  private readonly durationSpread: number = 5000;

  private readonly minBorderRadiusValue: number = 18;
  private readonly maxBorderRadiusValue: number = 82;
  private readonly randomBorderRadius: () => number = gsap.utils.random(this.minBorderRadiusValue, this.maxBorderRadiusValue, 1, true);
  protected borderRadius!: string;
  protected readonly tagList: FavoritesOverlayEntryModel[] = tagListData;

  protected getRandomDuration(): string {
    const min = this.duration - this.durationSpread;
    const max = this.duration + this.durationSpread;
    return `${gsap.utils.random(min, max, 1)}ms`;
  }

  constructor() {
    this.processOverlayChanges(false);

    Object.values(this.tagList).forEach(entry => {
      entry.duration = this.getRandomDuration();
    });
  }

  protected processOverlayChanges(withAnimation: boolean): void {
    if (withAnimation) {
      this.generateNewBorderRadius();
      gsap.to('.favorites-overlay-tag-list-item', {
        opacity: 0,
        duration: 0.5,
        stagger: {
          from: 'random',
          each: 0.1
        },
        ease: "power1.in",
        onComplete: () => {
          gsap.utils.shuffle(this.tagList);
          this.changeDetectorRef.detectChanges();

          gsap.to('.favorites-overlay-tag-list-item', {
            opacity: 1,
            duration: 0.6,
            stagger: {
              from: 'random',
              each: 0.1
            },
            ease: "power1.out"
          });
        }
      });
    } else {
      this.generateNewBorderRadius();
      gsap.utils.shuffle(this.tagList);
    }
  }

  private generateNewBorderRadius(): void {
    const fourRandomNumbers = Array.from({length: 4}, () => this.randomBorderRadius());
    this.borderRadius = `${fourRandomNumbers[0]}% ${100 - fourRandomNumbers[0]}% ${fourRandomNumbers[1]}% ${100 - fourRandomNumbers[1]}% /
    ${fourRandomNumbers[2]}% ${fourRandomNumbers[3]}% ${100 - fourRandomNumbers[3]}% ${100 - fourRandomNumbers[2]}%`;
  }

}
