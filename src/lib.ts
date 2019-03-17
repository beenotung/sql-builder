import Bluebird = require('bluebird');

export interface OkPacket {
  fieldCount: 0 | number;
  affectedRows: 2 | number;
  insertId: 1 | number;
  serverStatus: 2 | number;
  warningCount: 0 | number;
  message: '&Records: 2  Duplicates: 0  Warnings: 0' | string;
  protocol41: true | boolean;
  changedRows: 0 | number;
}

export type InsertResult = OkPacket;

export function toPromise<T>(p: Bluebird<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => p.then(resolve).catch(reject));
}
