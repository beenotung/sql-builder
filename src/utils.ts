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
  return new Date(time)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

export type Field<T> = '*' | (string & keyof T);

export function fieldToSql<T>(field: Field<T>): string {
  if (field === '*') {
    return '*';
  }
  return `\`${field}\``;
}

/**
 * only flatten one level
 * */
export function flatten<A>(xss: A[][]): A[] {
  const ys: A[] = [];
  xss.forEach(xs => ys.push(...xs));
  return ys;
}
