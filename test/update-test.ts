import { ranking } from './ranking.types';
import { sqlSelector } from '../src/select';
import { updateTable } from '../src/update';

let updateSql = updateTable<ranking>('ranking')
  .and(sqlSelector('user_id', '=', 1))
  .and(sqlSelector('step', '=', 2))
  .set('score', 3)
  .toSqlString();
console.log(updateSql);
