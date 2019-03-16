import { SqlBuilder } from './core';

export type SqlSelectorOpType = '=';

export interface SqlSelector<T, P extends keyof T> {
  field: P;
  op: SqlSelectorOpType;
  value: T[P];
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

function sqlSelectorToString(selector: SqlSelector<any, any>): string {
  const field = '`' + selector.field + '`';
  const value: string = JSON.stringify(selector.value);
  return `${field} ${selector.op} ${value}`;
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

  and<P extends keyof T>(selector: SqlSelector<T, P>): SqlWhere<T> {
    const o = this.clone();
    o.whereStr = `(${this.whereStr} AND ${sqlSelectorToString(selector)})`;
    return o;
  }

  or<P extends keyof T>(selector: SqlSelector<T, P>): SqlWhere<T> {
    const o = this.clone();
    o.whereStr = `(${this.whereStr} OR ${sqlSelectorToString(selector)})`;
    return o;
  }

  toSqlString(): string {
    return this.whereStr;
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
