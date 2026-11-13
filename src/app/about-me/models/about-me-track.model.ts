export interface AboutMeTrackModel {
  number: string;
  title: string;
  length: string;
  // Share of the scroll track after which the track lights up
  litAt: number;
  // Label of the record side, on the first track of each side
  side?: string;
  // Shows random characters until it lights up, then decrypts letter by letter
  encrypted?: boolean;
}
