import { gsap } from 'gsap';
export { gsap } from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
export { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// On touch-only devices ScrollTrigger handles the touch scrolling
// itself, so the favorites pin starts and ends in step with the scroll
// position instead of after it
if (typeof window !== 'undefined' && ScrollTrigger.isTouch === 1) {
  ScrollTrigger.normalizeScroll(true);
}

// ScrollTrigger scrolls to the top to measure when it refreshes on
// DOMContentLoaded and load. In most page loads that undoes or prevents the
// browser's jump to the section named in the url, so the jump is repeated
// once ScrollTrigger is done. Registered after the plugin, this listener runs
// after ScrollTrigger's own
if (typeof window !== 'undefined') {
  window.addEventListener(
    'load',
    () =>
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView(),
    { once: true },
  );
}
