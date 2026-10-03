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
  DOCUMENT,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cursor-grid',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './cursor-grid.component.html',
})
export class CursorGridComponent implements AfterViewInit, OnDestroy {
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly angularDocument: Document = inject(DOCUMENT);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private readonly cursorGridElement =
    viewChild.required<ElementRef<HTMLDivElement>>('cursorGridElement');
  private readonly listenerCleanups: (() => void)[] = [];
  private animationFrameId: number | undefined;

  ngAfterViewInit(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.angularDocument.defaultView!.matchMedia('(pointer: fine)').matches
    ) {
      return;
    }

    this.listenerCleanups.push(
      this.renderer.listen(
        this.angularDocument,
        'pointermove',
        (event: PointerEvent) => this.moveCursorGrid(event.clientX, event.clientY),
      ),
      this.renderer.listen(
        this.angularDocument.documentElement,
        'pointerleave',
        () =>
          this.renderer.removeAttribute(
            this.cursorGridElement().nativeElement,
            'data-active',
          ),
      ),
    );
  }

  ngOnDestroy(): void {
    this.listenerCleanups.forEach((cleanup) => cleanup());
    if (this.animationFrameId !== undefined) {
      this.angularDocument.defaultView?.cancelAnimationFrame(
        this.animationFrameId,
      );
    }
  }

  private moveCursorGrid(x: number, y: number): void {
    if (this.animationFrameId !== undefined) {
      this.angularDocument.defaultView!.cancelAnimationFrame(
        this.animationFrameId,
      );
    }

    this.animationFrameId =
      this.angularDocument.defaultView!.requestAnimationFrame(() => {
        const cursorGridElement = this.cursorGridElement().nativeElement;
        this.animationFrameId = undefined;

        this.renderer.setStyle(
          cursorGridElement,
          '--cursor-grid-x',
          `${x}px`,
          RendererStyleFlags2.DashCase,
        );
        this.renderer.setStyle(
          cursorGridElement,
          '--cursor-grid-y',
          `${y}px`,
          RendererStyleFlags2.DashCase,
        );
        this.renderer.setAttribute(cursorGridElement, 'data-active', '');
      });
  }
}
