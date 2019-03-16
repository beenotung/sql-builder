export function assertNonEmpty<T>(xs: T[]): [T, ...T[]] {
  if (xs.length === 0) {
    throw new Error('expect at least one element');
  }
  return xs as any;
}
