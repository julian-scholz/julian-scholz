import { Component, inject, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NavEntryModel } from './models/nav-entry.model';
import { NavService } from './nav.service';

@Component({
  selector: 'app-header-nav',
  imports: [FontAwesomeModule],
  templateUrl: './nav.component.html',
})
export class HeaderNavComponent implements OnInit {
  private readonly navService: NavService = inject(NavService);
  protected sortedNavEntries!: NavEntryModel[];

  ngOnInit(): void {
    this.sortedNavEntries = this.navService.sortedNavEntries;
  }
}
