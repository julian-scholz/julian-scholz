import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  LOCALE_ID,
  viewChild,
  ViewContainerRef
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { NgTemplateOutlet } from '@angular/common';
import { ModalTemplate } from './utils/modal-template.model';
import { LegalNoticeDeComponent } from '../../contents/legal-notice.de.component';
import { LegalNoticeEnComponent } from '../../contents/legal-notice.en.component';
import { PrivacyPolicyDeComponent } from '../../contents/privacy-policy.de.component';
import { PrivacyPolicyEnComponent } from '../../contents/privacy-policy.en.component';

@Component({
  selector: 'app-modal-container',
  imports: [
    FaIconComponent,
    NgTemplateOutlet,
    LegalNoticeDeComponent,
    LegalNoticeEnComponent,
    PrivacyPolicyDeComponent,
    PrivacyPolicyEnComponent,
  ],
  templateUrl: './modal-container.component.html',
})
export class ModalContainerComponent {
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly faClose: IconDefinition = faClose;
  protected readonly titles: Record<ModalTemplate, string> = {
    inspirations: $localize`:@@inspirationsTitle:Impulse & Credits`,
    legalNotice: $localize`:@@legalNoticeTitle:Impressum`,
    privacyPolicy: $localize`:@@privacyPolicyTitle:Datenschutzerklärung`,
  };
  // The legal texts are whole documents and have one template per language
  protected readonly isEnglish: boolean = inject(LOCALE_ID).startsWith('en');
  protected shownTemplate: ModalTemplate | undefined;
  protected parentViewContainerRef: ViewContainerRef | undefined;

  constructor() {
    afterNextRender(() => this.dialog()?.nativeElement.showModal());
  }

  public setTemplate(template: ModalTemplate): void {
    this.shownTemplate = template;
  }

  public setParentViewContainerRef(viewContainerRef: ViewContainerRef): void {
    this.parentViewContainerRef = viewContainerRef;
  }

  protected closeModal(): void {
    this.dialog()?.nativeElement.close();
  }

  protected removeModal(): void {
    this.parentViewContainerRef?.clear();
  }
}
