import { ranking } from './ranking.types';
import { selectTable } from '../src/select';
import { insertTable } from '../src/insert';

let insertSql = insertTable<ranking>('ranking')
  .insertAll([{ user_id: 1, rank: 10 }, { raw_id: 2, rank: 23 }])
  .toSqlString();
console.log(insertSql);
