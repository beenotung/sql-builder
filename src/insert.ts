import { Connection } from 'promise-mysql';
import { SqlBuilder } from './core';
import { OkPacket, toPromise } from './lib';
import { flatten } from './utils';

export class InsertSqlBuilder<T> implements SqlBuilder {
  tableName: string;
  records: Array<Partial<T>> = [];

  clone<T>(): InsertSqlBuilder<T> {
    const o = new InsertSqlBuilder();
    o.tableName = this.tableName;
    o.records = this.records.map(x => x);
    return o;
  }

  setTableName(name: string): InsertSqlBuilder<T> {
    const o = this.clone();
    o.tableName = name;
    return o;
  }

  insert<R extends Partial<T>>(record: R): InsertSqlBuilder<R> {
    const o = this.clone();
    o.records.push(record);
    return o;
  }

  insertAll<R extends Partial<T>>(records: R[]): InsertSqlBuilder<R> {
    const o = this.clone();
    o.records.push(...records);
    return o;
  }

  toSqlString(): string {
    if (this.records.length === 0) {
      return '';
    }
    const fields: string[] = flatten(
      this.records.map(record =>
        Object.keys(record).filter(field => record[field] !== undefined),
      ),
    );

    let sql = `INSERT INTO \`${this.tableName}\` (`;
    sql += fields.map(s => '`' + s + '`').join(', ');
    sql += ') VALUES\n';
    sql += this.records
      .map(record =>
        fields
          .map(field => {
            let value = record[field];
            if (value === undefined) {
              value = null;
            }
            return JSON.stringify(value);
          })
          .join(', '),
      )
      .map(s => '(' + s + ')')
      .join(',\n');
    return sql + ';';
  }

  query(conn: Connection): Promise<OkPacket> {
    return toPromise(conn.query(this.toSqlString()));
  }
}

export function insertTable<T>(tableName: string): InsertSqlBuilder<T> {
  return new InsertSqlBuilder<T>().setTableName(tableName);
}
