import { selectTable, sqlSelector } from '../src/select';
import { transaction } from './transaction';
import { timeToSql } from '../src/utils';
import { createConnection } from './db';

let startTime = Date.now();
let endTime = startTime - 3600;

export let sumSql = selectTable<transaction>('transaction')
  .and(sqlSelector('receiver_user_id', '=', 1))
  .and(sqlSelector('create_timestamp', '>=', timeToSql(startTime)))
  .and(sqlSelector('create_timestamp', '<', timeToSql(endTime)))
  .select('fee')
  .toSqlString();
sumSql = sumSql.replace('`fee`', 'SUM(`fee`)');
console.log(sumSql);

async function test() {
  let conn = await createConnection();
  try {
    let rows = await conn.query(sumSql);
    console.log('rows:', rows);
  } finally {
    conn.end();
  }
}

test();
