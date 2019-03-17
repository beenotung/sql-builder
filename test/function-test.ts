import { selectTable, sqlSelector } from '../src/select';
import { transaction } from './transaction';
import { timeToSql } from '../src/utils';
import { createConnection } from './db';

let startTime = new Date('2019-03-13').getTime();
let endTime = new Date('2019-03-20').getTime();

export let sumQuery = selectTable<transaction>('transaction')
  .and(sqlSelector('receiver_user_id', '=', 1))
  .and(sqlSelector('create_timestamp', '>=', timeToSql(startTime)))
  .and(sqlSelector('create_timestamp', '<', timeToSql(endTime)))
  .selectWithFunction('SUM', 'fee', 'sum');
// .toSqlString();
// sumSql = sumSql.replace('`fee`', 'SUM(`fee`)');
console.log(sumQuery.toSqlString());

async function test() {
  let conn = await createConnection();
  try {
    // let rows = await conn.query(sumQuery.toSqlString());
    let rows = await sumQuery.query(conn);
    console.log('sum rows:', rows);
    console.log('sum:', rows[0].sum);
  } finally {
    conn.end();
  }
}

test();
