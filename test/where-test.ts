import { sqlSelector, SqlWhere } from '../src/select';
import { ranking } from './ranking.types';

let whereSql = new SqlWhere<ranking>(sqlSelector('user_id', '=', 1))
  .and(sqlSelector('step', '=', 2))
  .or(sqlSelector('raw_id', '=', 3))
  .toSqlString();
console.log(whereSql);
