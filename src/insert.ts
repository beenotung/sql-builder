import { SqlBuilder } from './core';

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
    o.records.push();
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
    const fields = new Set<string>();
    this.records.forEach(record =>
      Object.keys(record).forEach(s => fields.add(s)),
    );
    const fs = Array.from(fields);

    let sql = `INSERT INTO \`${this.tableName}\` (`;
    sql += fs.map(s => '`' + s + '`').join(', ');
    sql += ') VALUES\n';
    sql += this.records
      .map(record =>
        fs
          .map(field => {
            let value = record[field];
            if (!(field in record)) {
              value = 'null';
            }
            return value;
          })
          .join(', '),
      )
      .map(s => '(' + s + ')')
      .join(',\n');
    return sql + ';';
  }
}

export function insertTable<T>(tableName: string): InsertSqlBuilder<T> {
  return new InsertSqlBuilder<T>().setTableName(tableName);
}
