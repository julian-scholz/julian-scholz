import {
  AfterViewInit,
  Component,
  OnDestroy,
  input,
  signal,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, NgClass, NgStyle } from '@angular/common';
import { AboutMeDetailModel } from './models/about-me-detail.model';
import { ScrollTrigger } from '../../lib/misc/gsap/gsap';

@Component({
  selector: 'app-about-me-detail',
  imports: [NgStyle, NgClass],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './about-me-detail.component.html',
})
export class AboutMeDetailComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);

  public readonly scrollTrigger = input.required<HTMLElement>();
  public readonly detail = input.required<AboutMeDetailModel>();
  public readonly ppc = input.required<number>();

  protected active = signal<number>(0);

  private gsapScrollTrigger: ScrollTrigger | undefined;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.gsapScrollTrigger = ScrollTrigger.create({
        trigger: this.scrollTrigger(),
        start: `top top-=${this.detail().start * this.ppc()}`,
        end: `top top-=${this.detail().end * this.ppc()}`,
        scrub: true,
        onEnter: () => this.active.set(1),
        onEnterBack: () => this.active.set(0),
        onLeave: () => this.active.set(1),
        onLeaveBack: () => this.active.set(0),
      });
    }
  }

  ngOnDestroy(): void {
    this.gsapScrollTrigger?.kill();
  }
}
