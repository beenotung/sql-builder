import { insertTable } from '../src/insert';
import { transaction } from './transaction';
import { createConnection } from './db';

export let insertSql = insertTable<transaction>('transaction')
  .insertAll([
    {
      sender_user_id: 1,
      receiver_user_id: 2,
      fee: 3,
    },
    {
      sender_user_id: 2,
      receiver_user_id: 1,
      fee: 1.5,
    },
  ])
  .toSqlString();
console.log(insertSql);

async function test() {
  let conn = await createConnection();
  try {
    let res = await conn.query(insertSql);
    console.log('insert res:', res);
  } finally {
    conn.end();
  }
}

test();
