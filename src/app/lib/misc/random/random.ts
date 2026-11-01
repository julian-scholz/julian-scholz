// A random multiple of the increment between min and max, both included
export function getRandomNumber(
  min: number,
  max: number,
  increment: number,
): number {
  const steps = Math.floor((max - min) / increment);

  return min + Math.floor(Math.random() * (steps + 1)) * increment;
}

export function getRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Fisher-Yates, in place
export function shuffle<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
