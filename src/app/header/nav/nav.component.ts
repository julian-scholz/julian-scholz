import { Component, inject, OnInit } from '@angular/core';
import { NavEntryModel } from './models/nav-entry.model';
import { NavService } from './nav.service';
import { IconComponent } from '../../lib/icon/icon.component';

@Component({
  selector: 'app-header-nav',
  imports: [IconComponent],
  templateUrl: './nav.component.html',
})
export class HeaderNavComponent implements OnInit {
  private readonly navService: NavService = inject(NavService);
  protected sortedNavEntries!: NavEntryModel[];

  ngOnInit(): void {
    this.sortedNavEntries = this.navService.sortedNavEntries;
  }
}
