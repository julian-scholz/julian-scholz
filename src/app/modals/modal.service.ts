import { Injectable, ViewContainerRef } from '@angular/core';
import { ModalContainerComponent } from './utils/modal-container/modal-container.component';
import { ModalTemplate } from './utils/modal-container/utils/modal-template.model';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private viewContainerRef: ViewContainerRef | undefined;

  public setViewContainerRef(viewContainerRef: ViewContainerRef): void {
    this.viewContainerRef = viewContainerRef;
  }

  public openModal(template: ModalTemplate): void {
    if (!this.viewContainerRef) {
      throw new Error('ViewContainerRef must be defined');
    }

    this.viewContainerRef.clear();

    const modalContainerRef = this.viewContainerRef.createComponent(
      ModalContainerComponent,
    );
    modalContainerRef.instance.setParentViewContainerRef(this.viewContainerRef);
    modalContainerRef.instance.setTemplate(template);
  }
}
