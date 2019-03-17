import { selectTable, sqlSelector } from '../src/select';
import { createConnection } from './db';
import { transaction } from './transaction';

export let selectSql = selectTable<transaction>('transaction')
  .and(sqlSelector('receiver_user_id', '=', 1))
  .and(sqlSelector('sender_user_id', '=', 2))
  .selectFields(['raw_id', 'fee', 'create_timestamp'])
  .toSqlString();
console.log(selectSql);

async function test() {
  let conn = await createConnection();
  try {
    let res = await conn.query(selectSql);
    console.log('select res:', res);
  } finally {
    conn.end();
  }
}

test();
