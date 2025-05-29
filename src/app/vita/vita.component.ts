import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  RendererStyleFlags2,
  viewChild,
  DOCUMENT
} from '@angular/core';
import {
  faComputer,
  faGraduationCap,
  faLocationDot,
  faSchool,
  faShield,
  faTerminal,
} from '@fortawesome/free-solid-svg-icons';
import { VitaEntryModel } from './models/vita-entry.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  isPlatformBrowser,
  NgStyle,
  UpperCasePipe
} from '@angular/common';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { gsap } from '../lib/misc/gsap/gsap';

@Component({
  selector: 'app-vita',
  imports: [FaIconComponent, UpperCasePipe, NgStyle],
  templateUrl: './vita.component.html',
})
export class VitaComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private markerIntersectionObserver: IntersectionObserver | undefined;
  private readonly vitaEntriesElement =
    viewChild.required<ElementRef<HTMLDivElement>>('vitaEntriesElement');

  protected readonly faLocationDot: IconDefinition = faLocationDot;
  protected readonly vitaEntries: VitaEntryModel[] = [
    {
      iconDefinition: faShield,
      title: 'Leitung Taskforce Application Security',
      location: 'BEIT GmbH (MERKUR GROUP)',
      titleDescription: 'Latest',
      timePeriod: 'Seit März 2024',
      description: `Neben meiner privaten Leidenschaft für das Lösen von CTFs auf Plattformen wie Hack The Box und beruflichen Fort- und Weiterbildungen zu Security-Themen leite ich die Taskforce Application Security. Ziel dieser ist die <mark>kontinuierliche Verbesserung der Sicherheit</mark> von bestehenden und neuen Anwendungen, die innerhalb der Unternehmensgruppe entwickelt und betrieben werden. Inhaltlich konzentriert sich die Arbeit der Taskforce unter anderem auf die Begleitung von <mark>Penetrationstests</mark>, die Evaluierung der Sicherheit verschiedenster <mark>System- und Softwarearchitekturen</mark> sowie die Ausgestaltung von <mark>sicheren Programmierpraktiken</mark>.`,
    },
    {
      iconDefinition: faTerminal,
      title: 'Webentwickler und -Berater',
      location: 'BEIT GmbH (MERKUR GROUP)',
      titleDescription: 'Latest',
      timePeriod: 'Seit August 2020',
      description: `In meiner Tätigkeit als Full-Stack-Entwickler liegt mein Schwerpunkt auf der Arbeit mit <mark>Java, Node.js</mark> und verschiedenen Webtechnologien wie <mark>TypeScript, JavaScript und PHP</mark>. Im Zuge dessen beschäftige ich mich mit dem Content-Management-System <mark>FirstSpirit</mark> und der Portalsoftware <mark>Liferay</mark>. Dabei betreue ich im Rahmen dieser beiden Systemumgebungen eine Vielzahl von zentralen Webseiten und -Anwendungen der MERKUR GROUP (früher Gauselmann Gruppe). Zudem entwickelte ich unter Verwendung moderner Frameworks wie <mark>Angular</mark> und <mark>NestJS</mark> eine <mark>Plattform zur Steuerung, Planung und Durchführung von Rollout-Prozessen</mark>.`,
    },
    {
      iconDefinition: faGraduationCap,
      title: 'Duales Studium - Bachelor of Science (B.Sc.)',
      location: 'Campus Lingen - HS Osnabrück',
      timePeriod: 'August 2017 - Juli 2020',
      description: `Während meines Studiums der Wirtschaftsinformatik beschäftigte ich mich neben vielen theoretischen Aspekten im Rahmen einiger Module intensiv mit praktischen Projekten. Dazu gehören unter anderem die Programmierung einer prototypischen iOS-App mit einem Backend zur Steuerung einer DJI-Drohne für eine <mark>automatisierte Lagerverwaltung</mark>, die <mark>Entwicklung eines Chatbots</mark> sowie die <mark>Programmierung eines Alexa-Skills</mark>. Diese Projekte ermöglichten es mir, mein theoretisch erlerntes Wissen anzuwenden und oftmals im Rahmen von Gruppenarbeiten innovative Lösungen zu entwickeln. In den späteren Semestern wählte ich den <mark>Schwerpunkt E-Business</mark>.<br> Meine Bachelorarbeit umfasste die Konzeption, den Entwurf und die Java-Implementierung einer <mark>Erweiterung für ein Content-Management-System</mark>.`,
    },
    {
      iconDefinition: faComputer,
      title: 'Duales Studium - Fachinformatiker für Systemintegration (FiSi)',
      location: 'BEIT GmbH (MERKUR GROUP)',
      timePeriod: 'August 2017 - Juni 2019',
      description: `Im Rahmen meines Dualen Studiums bei der MERKUR GROUP (früher Gauselmann Gruppe) absolvierte ich eine Ausbildung als Fachinformatiker für Systemintegration. Nach jeder Theoriephase an der Hochschule wechselte ich innerhalb des Unternehmens die Abteilung. So konnte ich vielfältige Einblicke in sowohl administrative Aufgaben als auch in Softwareentwicklungsprozesse gewinnen. Dabei sammelte ich unter anderem Erfahrung mit <mark>Datenbanken</mark>, <mark>Virtualisierungstechnologien</mark> und der <mark>Individualentwicklung</mark>.<br> In meinem Abschlussprojekt beschäftigte ich mich mit der Konzeption und Implementierung einer Lösung für ein <mark>Ende-zu-Ende-Monitoring von E-Mail-Infrastrukturen</mark>.`,
    },
    {
      iconDefinition: faSchool,
      title: 'Abitur',
      location: 'Gymnasium Petershagen',
      timePeriod: 'August 2009 - Juli 2017',
      description: `Schon während meiner Schulzeit entdeckte ich meine Leidenschaft für Informatik, die sich durch einen <mark>Informatik-Differenzierungskurs</mark> in der Mittelstufe entwickelte und durch ein <mark>Praktikum im Bereich der Automatisierungstechnik</mark> weiter gefestigt wurde. Zusätzlich war ich neben dem normalen Schulalltag als Administrator im Selbstlernzentrum des Gymnasiums tätig, was mir bereits damals erste wertvolle praktische Erfahrungen einbrachte. In der Oberstufe belegte ich die beiden <mark>Leistungskurse Mathematik und Sozialwissenschaften</mark>. Insbesondere die Kombination aus meinem Interesse an Zahlen und Logik sowie meinem Verständnis von wirtschaftlichen Zusammenhängen führte dazu, dass ich mich schon während des Abiturs für ein Studium der Wirtschaftsinformatik entschied.`,
    },
  ];

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyles = this.angularDocument.defaultView!.getComputedStyle(
        this.angularDocument.documentElement,
      );
      const highlightColors = [
        documentStyles.getPropertyValue('--color-vanilla-light'),
        documentStyles.getPropertyValue('--color-vanilla'),
        documentStyles.getPropertyValue('--color-vanilla-dark'),
        documentStyles.getPropertyValue('--color-vanilla-darker'),
        documentStyles.getPropertyValue('--color-vanilla-extra-dark'),
      ];
      const getRandomHighlightColorIndex: () => number = gsap.utils.random(
        0,
        highlightColors.length - 1,
        1,
        true,
      );

      this.markerIntersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const newHighlightColor =
                highlightColors[getRandomHighlightColorIndex()];
              this.renderer.setStyle(
                entry.target,
                '--vita-entry-mark-highlight-color-light',
                `${newHighlightColor}80`,
                RendererStyleFlags2.DashCase,
              );
              this.renderer.setStyle(
                entry.target,
                '--vita-entry-mark-highlight-color-dark',
                `${newHighlightColor}59`,
                RendererStyleFlags2.DashCase,
              );
            }

            this.renderer.setStyle(
              entry.target,
              '--vita-entry-mark-highlighted',
              entry.isIntersecting ? 1 : 0,
              RendererStyleFlags2.DashCase,
            );
          }
        },
        { threshold: 1.0 },
      );
      this.vitaEntriesElement()
        .nativeElement.querySelectorAll('mark')
        .forEach((markEntry: HTMLElement) =>
          this.markerIntersectionObserver?.observe(markEntry),
        );
    }
  }

  ngOnDestroy(): void {
    this.markerIntersectionObserver?.disconnect();
  }
}
