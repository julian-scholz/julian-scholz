import { DOCUMENT, inject, Injectable, LOCALE_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import tagListData from '../../../tag-list.json';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly title: Title = inject(Title);
  private readonly meta: Meta = inject(Meta);
  private readonly isEnglish: boolean = inject(LOCALE_ID).startsWith('en');

  private readonly siteUrl: string = 'https://julian-scholz.dev';
  private readonly pageUrl: string = this.isEnglish
    ? `${this.siteUrl}/en/`
    : this.siteUrl;
  private readonly tags: string[] = tagListData.flatMap(({ tags }) => tags);

  // Runs while prerendering, so the metadata ends up in the static html of
  // every language
  public applyMetadata(): void {
    this.applyMetaTags();
    this.applyCanonicalLink();
    this.applyStructuredData();
  }

  private applyMetaTags(): void {
    const pageTitle = $localize`:@@metaTitle:julian scholz. | Entwickler. Aus Leidenschaft.`;
    const description = $localize`:@@metaDescription:Website von Julian Scholz. Buchtipps, Vita und Favoriten. Eine Übersicht über Fähigkeiten, berufliche Stationen und Projekte.`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: this.tags.join(', ') });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: this.pageUrl });
    this.meta.updateTag({
      property: 'og:locale',
      content: this.isEnglish ? 'en_US' : 'de_DE',
    });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: $localize`:@@metaImageAlt:Die Überschrift 'Julian Scholz' zwischen einem Navigationsbereich für Links in soziale Netzwerke.`,
    });
  }

  private applyCanonicalLink(): void {
    const canonicalLink =
      this.angularDocument.head.querySelector('link[rel="canonical"]') ??
      this.angularDocument.head.appendChild(
        this.angularDocument.createElement('link'),
      );
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', this.pageUrl);
  }

  private applyStructuredData(): void {
    const structuredDataType = 'application/ld+json';
    const structuredDataScript =
      this.angularDocument.head.querySelector(
        `script[type="${structuredDataType}"]`,
      ) ??
      this.angularDocument.head.appendChild(
        this.angularDocument.createElement('script'),
      );
    structuredDataScript.setAttribute('type', structuredDataType);
    structuredDataScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      givenName: 'Julian',
      familyName: 'Scholz',
      name: 'Julian Scholz',
      birthDate: '1998-10-07',
      gender: 'Male',
      nationality: 'German',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DE',
        addressLocality: 'Osnabrück',
        addressRegion: 'NI',
        postalCode: '49086',
        streetAddress: 'Stadtweg 35a',
      },
      image: 'https://assets.julian-scholz.dev/images/julian_scholz.jpg',
      description: $localize`:@@structuredDataDescription:Entwickler`,
      disambiguatingDescription: $localize`:@@structuredDataDisambiguatingDescription:Entwickler mit Security-Schwerpunkt`,
      email: 'mail@julian-scholz.dev',
      alumniOf: [
        {
          '@type': 'OrganizationRole',
          startDate: '2017-08',
          endDate: '2020-07',
          alumniOf: {
            '@type': 'CollegeOrUniversity',
            name: 'Hochschule Osnabrück - Campus Lingen',
            sameAs: 'https://www.hs-osnabrueck.de',
          },
        },
      ],
      honorificSuffix: 'B.Sc.',
      award: [
        'FirstSpirit Developer Tranining Basic',
        'HACKATTACK: HACKING WEB APPS',
      ],
      knowsAbout: this.tags,
      knowsLanguage: ['de-DE', 'en-US'],
      jobTitle: $localize`:@@structuredDataJobTitle:Entwickler & Berater`,
      url: this.siteUrl,
      sameAs: [
        'https://www.linkedin.com/in/julian-scholz',
        'https://www.xing.com/profile/Julian_Scholz2103',
        'https://github.com/julian-scholz',
        'https://www.instagram.com/juuuulian98',
      ],
    });
  }
}
