import { SqlBuilder } from './core';

export type SqlSelectorOpType = '=' | '<>' | '<' | '>' | '>=' | '<=';

export interface SqlOpSelector<T, P extends keyof T = keyof T> {
  field: P;
  op: SqlSelectorOpType;
  value: T[P];
}

export interface SqlInSelector<T, P extends keyof T = keyof T> {
  field: P;
  in: Array<T[P]>;
}

export type SqlSelector<T, P extends keyof T = keyof T> =
  | SqlOpSelector<T, P>
  | SqlInSelector<T, P>;

export function sqlSelector<T, P extends keyof T = keyof T>(
  field: P,
  op: SqlSelectorOpType,
  value: T[P],
): SqlSelector<T, P> {
  return { field, op, value };
}

export function mkSqlSelectors<T>(
  partial: Partial<T>,
  op: SqlSelectorOpType = '=',
): Array<SqlSelector<T, keyof T>> {
  return Object.keys(partial).map(key => ({
    field: key as keyof T,
    op,
    value: partial[key],
  }));
}

export function ensureMkSqlSelectors<T>(
  partial: Partial<T>,
  op: SqlSelectorOpType = '=',
): [SqlSelector<T>, ...Array<SqlSelector<T>>] {
  const keys = Object.keys(partial);
  if (keys.length === 0) {
    throw new Error('expect at least one field');
  }
  return (keys.map(key => ({
    field: key as keyof T,
    op,
    value: partial[key],
  })) as Array<SqlSelector<T>>) as any;
}

function sqlSelectorToString(selector: SqlSelector<any, any>): string {
  const field = '`' + selector.field + '`';
  if ('op' in selector) {
    const value: string = JSON.stringify(selector.value);
    return `${field} ${selector.op} ${value}`;
  }
  if ('in' in selector) {
    let sql = `${field} in (`;
    sql += selector.in.map(x => JSON.stringify(x)).join(', ');
    return sql + ')';
  }
  console.error('unknown type of selector:', selector);
  throw new Error('not_impl');
}

export class SqlWhere<T> implements SqlBuilder {
  whereStr: string;

  constructor(selector: SqlSelector<T, any> | string) {
    if (typeof selector === 'string') {
      this.whereStr = selector;
    } else {
      this.whereStr = sqlSelectorToString(selector);
    }
  }

  clone(): SqlWhere<T> {
    const o = new SqlWhere<T>(this.whereStr);
    return o;
  }

  and(selector: SqlSelector<T, keyof T>): SqlWhere<T> {
    const o = this.clone();
    o.whereStr = `(${this.whereStr} AND ${sqlSelectorToString(selector)})`;
    return o;
  }

  andAll(selectors: Array<SqlSelector<T>>): SqlWhere<T> {
    return selectors.reduce((acc, c) => acc.and(c), this);
  }

  or(selector: SqlSelector<T, keyof T>): SqlWhere<T> {
    const o = this.clone();
    o.whereStr = `(${this.whereStr} OR ${sqlSelectorToString(selector)})`;
    return o;
  }

  orAll(selectors: Array<SqlSelector<T>>): SqlWhere<T> {
    return selectors.reduce((acc, c) => acc.and(c), this);
  }

  toSqlString(): string {
    return this.whereStr;
  }
}

export function andAll<T>(
  selector: SqlSelector<T>,
  ...selectors: Array<SqlSelector<T>>
) {
  return new SqlWhere(selector).andAll(selectors);
}

export function orAll<T>(
  selector: SqlSelector<T>,
  ...selectors: Array<SqlSelector<T>>
) {
  return new SqlWhere(selector).orAll(selectors);
}

export function whereAll<T>(
  op: 'and' | 'or',
  selector: SqlSelector<T>,
  ...selectors: Array<SqlSelector<T>>
) {
  if (op === 'and') {
    return andAll(selector, ...selectors);
  } else if (op === 'or') {
    return orAll(selector, ...selectors);
  } else {
    throw new Error('unknown op: ' + op);
  }
}

export class SelectSqlBuilder<T> implements SqlBuilder {
  tableName: string;
  selects: Array<keyof T> = [];
  where: SqlWhere<T>;

  clone(): SelectSqlBuilder<T> {
    const o = new SelectSqlBuilder<T>();
    o.tableName = this.tableName;
    o.selects = this.selects.map(x => x);
    if (this.where) {
      o.where = this.where.clone();
    }
    return o;
  }

  setTableName(name: string): SelectSqlBuilder<T> {
    const o = this.clone();
    o.tableName = name;
    return o;
  }

  select(field: keyof T): SelectSqlBuilder<T> {
    const o = this.clone();
    o.selects.push(field);
    return o;
  }

  selectFields<K extends keyof T>(fields: K[]): SelectSqlBuilder<Pick<T, K>> {
    const o = this.clone();
    o.selects.push(...fields);
    return o;
  }

  setWhere(where: SqlWhere<T>): SelectSqlBuilder<T> {
    const o = this.clone();
    o.where = where;
    return o;
  }

  and<P extends keyof T>(selector: SqlSelector<T, P>): SelectSqlBuilder<T> {
    const o = this.clone();
    if (o.where) {
      o.where = o.where.and(selector);
    } else {
      o.where = new SqlWhere<T>(selector);
    }
    return o;
  }

  or<P extends keyof T>(selector: SqlSelector<T, P>): SelectSqlBuilder<T> {
    const o = this.clone();
    if (o.where) {
      o.where = o.where.or(selector);
    } else {
      o.where = new SqlWhere<T>(selector);
    }
    return o;
  }

  andAll(selectors: Array<SqlSelector<T>>): SelectSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.and(c), this);
  }

  orAll(selectors: Array<SqlSelector<T>>): SelectSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.or(c), this);
  }

  toSqlString(): string {
    let sql = `SELECT `;
    if (this.selects.length === 0) {
      sql += '*';
    } else {
      sql += this.selects.map(s => '`' + s + '`').join(', ');
    }
    sql += ` FROM \`${this.tableName}\``;
    if (this.where) {
      sql += ` WHERE ` + this.where.toSqlString();
    }
    return sql + ';';
  }
}

export function selectTable<T>(tableName: string): SelectSqlBuilder<T> {
  return new SelectSqlBuilder().setTableName(tableName);
}
