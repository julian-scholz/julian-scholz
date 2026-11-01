export interface RingModel {
  id: number;
  saturation: number;
  lightness: number;
  spread: number;
  // Seconds per turn, and how far into its first turn the ring starts
  duration: number;
  timeOffset: number;
}
