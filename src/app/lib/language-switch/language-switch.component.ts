import { Component, DOCUMENT, inject, LOCALE_ID } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-language-switch',
  imports: [UpperCasePipe],
  templateUrl: './language-switch.component.html',
})
export class LanguageSwitchComponent {
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly isEnglish: boolean = inject(LOCALE_ID).startsWith('en');

  // Every language is its own prerendered build below its own path
  protected readonly targetLanguage: string = this.isEnglish ? 'de' : 'en';
  protected readonly targetUrl: string = this.isEnglish ? '/' : '/en/';
  // Written in the target language, as it addresses its readers
  protected readonly description: string = this.isEnglish
    ? 'deutsche Version'
    : 'English version';

  protected keepCurrentSection(event: MouseEvent): void {
    (event.currentTarget as HTMLAnchorElement).href =
      this.targetUrl + (this.angularDocument.defaultView?.location.hash ?? '');
  }
}
