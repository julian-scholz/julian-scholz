import { Component, ViewContainerRef } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { NgTemplateOutlet } from '@angular/common';
import { ModalTemplate } from './utils/modal-template.enum';

@Component({
  selector: 'app-modal-container',
  imports: [FaIconComponent, NgTemplateOutlet],
  templateUrl: './modal-container.component.html',
})
export class ModalContainerComponent {
  protected readonly faClose: IconDefinition = faClose;
  protected shownTemplate: ModalTemplate | undefined;
  protected parentViewContainerRef: ViewContainerRef | undefined;

  protected get templateModel(): typeof ModalTemplate {
    return ModalTemplate;
  }

  public setTemplate(template: ModalTemplate): void {
    this.shownTemplate = template;
  }

  public setParentViewContainerRef(viewContainerRef: ViewContainerRef): void {
    this.parentViewContainerRef = viewContainerRef;
  }

  protected closeModal(): void {
    this.parentViewContainerRef?.clear();
  }
}
