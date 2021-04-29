import { Connection } from 'promise-mysql';
import { SqlBuilder } from './core';
import { toPromise } from './lib';
import { Field, fieldToSql } from './utils';

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
  return Object.keys(partial)
    .filter(field => partial[field] !== undefined)
    .map(field => ({
      field: field as keyof T,
      op,
      value: partial[field],
    }));
}

export function ensureMkSqlSelectors<T>(
  partial: Partial<T>,
  op: SqlSelectorOpType = '=',
): [SqlSelector<T>, ...Array<SqlSelector<T>>] {
  const keys = Object.keys(partial).filter(
    field => partial[field] !== undefined,
  );
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

export type SqlSelectFuncType = 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN';

export interface SqlFuncSelector<T> {
  func: SqlSelectFuncType;
  field: '*' | (string & keyof T);
  as?: string;
}

function funcToSql<K extends string>(
  func: SqlSelectFuncType,
  field: Field<any>,
): K {
  const s = `${func}(${fieldToSql(field)})`;
  return s as K;
}

export class SelectSqlBuilder<T> implements SqlBuilder {
  tableName: string;
  selects: string[] = [];
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

  select<K extends keyof T>(field: K): SelectSqlBuilder<Pick<T, K>> {
    const o = this.clone();
    o.selects = ['`' + field + '`'];
    return o as any;
  }

  selectFields<K extends keyof T>(fields: K[]): SelectSqlBuilder<Pick<T, K>> {
    const o = this.clone();
    o.selects = fields.map(s => '`' + s + '`');
    return o as any;
  }

  selectWithFunction<K extends string, R = number>(
    func: SqlSelectFuncType,
    field: Field<T>,
    as: K = funcToSql(func, field),
  ): SelectSqlBuilder<Record<K, R>> {
    const o: SelectSqlBuilder<Record<K, R>> = this.clone() as SelectSqlBuilder<
      any
    >;
    o.selects = [`${funcToSql(func, field)} as ${as}`];
    return o;
  }

  selectFieldsWithFunctions<K extends keyof T>(
    selectors: Array<SqlFuncSelector<T>>,
  ): SelectSqlBuilder<Pick<T, K>> {
    const o = this.clone();
    o.selects = selectors.map(x => {
      const as = x.as || funcToSql(x.func, x.field);
      return `${funcToSql(x.func, x.field)} as ${as}`;
    });
    return o as any;
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
      sql += this.selects.join(', ');
    }
    sql += ` FROM \`${this.tableName}\``;
    if (this.where) {
      sql += ` WHERE ` + this.where.toSqlString();
    }
    return sql + ';';
  }

  query(conn: Connection): Promise<T[]> {
    return toPromise(conn.query(this.toSqlString()));
  }
}

export function selectTable<T>(tableName: string): SelectSqlBuilder<T> {
  return new SelectSqlBuilder<T>().setTableName(tableName);
}
