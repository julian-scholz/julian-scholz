import { DestroyRef } from '@angular/core';

// Calls back right away and on every scroll and resize. Callers measure the
// layout live on each call, so nothing has to be refreshed when content above
// them changes its height
export function listenToScroll(
  callback: () => void,
  destroyRef: DestroyRef,
): void {
  window.addEventListener('scroll', callback, { passive: true });
  window.addEventListener('resize', callback, { passive: true });
  callback();
  destroyRef.onDestroy(() => {
    window.removeEventListener('scroll', callback);
    window.removeEventListener('resize', callback);
  });
}
