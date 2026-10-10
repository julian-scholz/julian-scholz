import { Component, inject, OnInit } from '@angular/core';
import { NavService } from '../header/nav/nav.service';
import { NavEntryModel } from '../header/nav/models/nav-entry.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { ModalService } from '../modals/modal.service';

@Component({
  selector: 'app-footer',
  imports: [FaIconComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent implements OnInit {
  private readonly navService: NavService = inject(NavService);
  protected sortedFooterLinkEntries!: NavEntryModel[];

  private readonly modalService: ModalService = inject(ModalService);

  protected readonly faEnvelope: IconDefinition = faEnvelope;

  protected readonly currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
    this.sortedFooterLinkEntries = this.navService.sortedNavEntries;
  }

  protected openInspirationsModal(): void {
    this.modalService.openModal('inspirations');
  }

  protected openLegalNoticeModal(): void {
    this.modalService.openModal('legalNotice');
  }

  protected openPrivacyPolicyModal(): void {
    this.modalService.openModal('privacyPolicy');
  }
}
