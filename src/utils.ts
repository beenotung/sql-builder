export function assertNonEmpty<T>(xs: T[]): [T, ...T[]] {
  if (xs.length === 0) {
    throw new Error('expect at least one element');
  }
  return xs as any;
}

/**
 * format time in UTC format for sql
 * */
export function timeToSql(time: number | Date): string {
  return new Date(time).toISOString().slice(0, 19).replace('T', ' ');
}
