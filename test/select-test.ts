import { ranking } from './ranking.types';
import { selectTable } from '../src/select';
import { insertTable } from '../src/insert';

export let selectSql = selectTable<ranking>('ranking')
  .and({ field: 'user_id', op: '=', value: 12 })
  .and({ field: 'step', op: '=', value: 34 })
  .selectFields(['rank', 'user_id'])
  .toSqlString();
console.log(selectSql);
