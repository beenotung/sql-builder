import { mkSqlSelectors, sqlSelector } from '../src/select';
import { deleteTable } from '../src/delete';
import { createConnection } from './db';
import { transaction } from './transaction';

let deleteQuery = deleteTable<transaction>('transaction')
  .andAll(
    mkSqlSelectors({
      raw_id: 4,
      sender_user_id: 2,
    }),
  )
  .and(sqlSelector('fee', '=', 3));
console.log(deleteQuery.toSqlString());

async function test() {
  let conn = await createConnection();
  try {
    let res = await deleteQuery.query(conn);
    console.log('delete res:', res);
  } finally {
    conn.end();
  }
}

test();
