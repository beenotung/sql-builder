import { sqlSelector } from '../src/select';
import { updateTable } from '../src/update';
import { createConnection } from './db';
import { transaction } from './transaction';
import { timeToSql } from '../src/utils';

let updateQuery = updateTable<transaction>('transaction')
  .and(sqlSelector('sender_user_id', '=', 1))
  .and(sqlSelector('receiver_user_id', '=', 2))
  .set('create_timestamp', timeToSql(Date.now()));
console.log(updateQuery.toSqlString());

async function test() {
  let conn = await createConnection();
  try {
    let res = await updateQuery.query(conn);
    console.log('update res:', res);
  } finally {
    conn.end();
  }
}

test();
