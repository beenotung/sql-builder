import Bluebird = require('bluebird');

type InsertMessage = '&Records: 2  Duplicates: 0  Warnings: 0' | string;
type UpdateMessage = '(Rows matched: 2  Changed: 2  Warnings: 0' | string;
type DeleteMessage = '' | string;

export interface OkPacket {
  fieldCount: 0 | number;
  affectedRows: 2 | number;
  insertId: 1 | number;
  serverStatus: 2 | number;
  warningCount: 0 | number;
  message: InsertMessage | UpdateMessage | DeleteMessage;
  protocol41: true | boolean;
  changedRows: 0 | number;
}

export function toPromise<T>(p: Bluebird<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => p.then(resolve).catch(reject));
}
