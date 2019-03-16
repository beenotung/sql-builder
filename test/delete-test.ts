import { ranking } from './ranking.types';
import { andAll, ensureMkSqlSelectors, sqlSelector } from '../src/select';
import { deleteTable } from '../src/delete';

let deleteSql = deleteTable<ranking>('ranking')
  .setWhere(
    andAll(
      ...ensureMkSqlSelectors<ranking>({
        raw_id: 1,
        user_id: 2,
        step: 3,
      }),
    ),
  )
  .and(sqlSelector('score', '=', 1))
  .and(sqlSelector('rank', '=', 2))
  .toSqlString();
console.log(deleteSql);
