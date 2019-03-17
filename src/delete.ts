import { SqlBuilder } from './core';
import { SqlSelector, SqlWhere } from './select';

export class DeleteSqlBuilder<T> implements SqlBuilder {
  tableName: string;
  where: SqlWhere<T>;

  clone(): DeleteSqlBuilder<T> {
    const o = new DeleteSqlBuilder();
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

  andAll(selectors: Array<SqlSelector<T>>): DeleteSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.and(c), this);
  }

  orAll(selectors: Array<SqlSelector<T>>): DeleteSqlBuilder<T> {
    return selectors.reduce((acc, c) => acc.or(c), this);
  }

  toSqlString(): string {
    let sql = `DELETE FROM \`${this.tableName}\``;
    if (this.where) {
      sql += ' WHERE ' + this.where.toSqlString();
    }
    return sql + ';';
  }
}

export function deleteTable<T>(tableName: string): DeleteSqlBuilder<T> {
  return new DeleteSqlBuilder<T>().setTableName(tableName);
}
