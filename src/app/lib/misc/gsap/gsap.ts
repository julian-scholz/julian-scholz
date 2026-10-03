import { gsap } from 'gsap';
export { gsap } from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
export { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
export { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
