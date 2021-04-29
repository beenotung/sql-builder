import { Connection } from 'promise-mysql';
import { SqlBuilder } from './core';
import { OkPacket, toPromise } from './lib';
import { SqlSelector, SqlWhere } from './select';

export class DeleteSqlBuilder<T> implements SqlBuilder {
  tableName: string;
  where: SqlWhere<T>;

  clone(): DeleteSqlBuilder<T> {
    const o = new DeleteSqlBuilder<T>();
    o.tableName = this.tableName;
    if (this.where) {
      o.where = this.where.clone();
    }
    return o;
  }

  setTableName(name: string): DeleteSqlBuilder<T> {
    const o = this.clone();
    o.tableName = name;
    return o;
  }

  setWhere(where: SqlWhere<T>): DeleteSqlBuilder<T> {
    const o = this.clone();
    o.where = where;
    return o;
  }

  and<P extends keyof T>(selector: SqlSelector<T, P>): DeleteSqlBuilder<T> {
    const o = this.clone();
    if (o.where) {
      o.where = o.where.and(selector);
    } else {
      o.where = new SqlWhere<T>(selector);
    }
    return o;
  }

  or<P extends keyof T>(selector: SqlSelector<T, P>): DeleteSqlBuilder<T> {
    const o = this.clone();
    if (o.where) {
      o.where = o.where.or(selector);
    } else {
      o.where = new SqlWhere<T>(selector);
    }
    return o;
  }

  andAll<P extends keyof T>(selectors: Array<SqlSelector<T, P>>): DeleteSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.and(c), this);
  }

  orAll<P extends keyof T>(selectors: Array<SqlSelector<T, P>>): DeleteSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.or(c), this);
  }

  toSqlString(): string {
    let sql = `DELETE FROM \`${this.tableName}\``;
    if (this.where) {
      sql += ' WHERE ' + this.where.toSqlString();
    }
    return sql + ';';
  }
  query(conn: Connection): Promise<OkPacket> {
    return toPromise(conn.query(this.toSqlString()));
  }
}

export function deleteTable<T>(tableName: string): DeleteSqlBuilder<T> {
  return new DeleteSqlBuilder<T>().setTableName(tableName);
}
