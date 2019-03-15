import { ranking } from './ranking.types';
import { selectTable } from '../src/select';
import { insertTable } from '../src/insert';

let sql = selectTable<ranking>('ranking')
  .and({ field: 'user_id', op: '=', value: 12 })
  .and({ field: 'step', op: '=', value: 34 })
  .selectFields(['rank', 'user_id'])
  .toSqlString();
console.log(sql);

sql = insertTable<ranking>('ranking')
  .insertAll([{ user_id: 1, rank: 10 }, { raw_id: 2, rank: 23 }])
  .toSqlString();
console.log(sql);
