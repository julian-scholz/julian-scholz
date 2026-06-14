import {
  AfterViewInit,
  Component,
  inject,
  viewChild,
  ViewContainerRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BackToTopButtonComponent } from './back-to-top-button/back-to-top-button.component';
import { ModalService } from './modals/modal.service';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { AboutMeComponent } from './about-me/about-me.component';
import { BookRecommendationsComponent } from './book-recommendations/book-recommendations.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { VitaComponent } from './vita/vita.component';
import { navigationEntries } from './app.routes';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    NavigationComponent,
    BackToTopButtonComponent,
    AboutMeComponent,
    BookRecommendationsComponent,
    FavoritesComponent,
    VitaComponent,
  ],
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        if (config.loaderParams?.['dynamicWidth']) {
          return `${config.src}-${config.width ? config.width : '1920'}w.${config.loaderParams?.['imageFormat']}`;
        } else {
          return `${config.src}.${config.loaderParams?.['imageFormat']}`;
        }
      },
    },
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  private readonly modalService: ModalService = inject(ModalService);
  private readonly modalContainer = viewChild.required('modalContainer', {
    read: ViewContainerRef,
  });

  protected readonly navigationEntries = navigationEntries;

  ngAfterViewInit(): void {
    this.modalService.setViewContainerRef(this.modalContainer());
  }
}
