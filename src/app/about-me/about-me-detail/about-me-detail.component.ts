import { Component, input, linkedSignal } from '@angular/core';
import { NgClass } from '@angular/common';
import { AboutMeDetailModel } from './models/about-me-detail.model';

@Component({
  selector: 'app-about-me-detail',
  imports: [NgClass],
  templateUrl: './about-me-detail.component.html',
})
export class AboutMeDetailComponent {
  public readonly scrolledDistance = input.required<number>();
  public readonly detail = input.required<AboutMeDetailModel>();
  public readonly ppc = input.required<number>();

  // The word lights up when scrolling down past its start and dims when
  // scrolling back up past its end. In between it keeps the state it had
  protected readonly active = linkedSignal<number, boolean>({
    source: this.scrolledDistance,
    computation: (distance, previous) => {
      const start = this.detail().start * this.ppc();
      const end = this.detail().end * this.ppc();
      if (distance <= start) {
        return false;
      }
      if (distance >= end) {
        return true;
      }
      if (!previous || previous.source <= start) {
        return true;
      }
      return previous.source >= end ? false : previous.value;
    },
  });
}
