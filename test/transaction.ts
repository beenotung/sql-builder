import { datetime, int } from './types';

export interface transaction {
  raw_id: int;
  receiver_user_id: int;
  sender_user_id: int;
  fee: int;
  create_timestamp: datetime;
}
