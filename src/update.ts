import { Connection } from 'promise-mysql';
import { SqlBuilder } from './core';
import { OkPacket, toPromise } from './lib';
import { SqlSelector, SqlWhere } from './select';

export interface SqlSet<T, P extends keyof T> {
  field: P & string;
  value: T[P];
}

export class UpdateSqlBuilder<T> implements SqlBuilder {
  tableName: string;
  updateFields: Array<SqlSet<T, keyof T>> = [];
  where: SqlWhere<T>;

  clone(): UpdateSqlBuilder<T> {
    const o = new UpdateSqlBuilder<T>();
    o.tableName = this.tableName;
    o.updateFields = this.updateFields.map(x => x as any);
    if (this.where) {
      o.where = this.where.clone();
    }
    return o;
  }

  setTableName(name: string): UpdateSqlBuilder<T> {
    const o = this.clone();
    o.tableName = name;
    return o;
  }

  set<P extends keyof T>(
    field: string & keyof T,
    value: T[P],
  ): UpdateSqlBuilder<T> {
    const o = this.clone();
    o.updateFields.push({ field, value });
    return o;
  }

  setWhere(where: SqlWhere<T>): UpdateSqlBuilder<T> {
    const o = this.clone();
    o.where = where;
    return o;
  }

  and<P extends keyof T>(selector: SqlSelector<T, P>): UpdateSqlBuilder<T> {
    const o = this.clone();
    if (o.where) {
      o.where = o.where.and(selector);
    } else {
      o.where = new SqlWhere<T>(selector);
    }
    return o;
  }

  or<P extends keyof T>(selector: SqlSelector<T, P>): UpdateSqlBuilder<T> {
    const o = this.clone();
    if (o.where) {
      o.where = o.where.or(selector);
    } else {
      o.where = new SqlWhere<T>(selector);
    }
    return o;
  }

  andAll(selectors: Array<SqlSelector<T>>): UpdateSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.and(c), this);
  }

  orAll(selectors: Array<SqlSelector<T>>): UpdateSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.or(c), this);
  }

  toSqlString(): string {
    if (this.updateFields.length === 0) {
      return '';
    }
    let sql = `UPDATE \`${this.tableName}\` SET`;
    this.updateFields.forEach(update => {
      const field = '`' + update.field + '`';
      const value = JSON.stringify(update.value);
      sql += ` ${field} = ${value}`;
    });
    if (this.where) {
      sql += ' WHERE ' + this.where.toSqlString();
    }
    return sql + ';';
  }

  query(conn: Connection): Promise<OkPacket> {
    return toPromise(conn.query(this.toSqlString()));
  }
}

export function updateTable<T>(tableName: string): UpdateSqlBuilder<T> {
  return new UpdateSqlBuilder<T>().setTableName(tableName);
}
