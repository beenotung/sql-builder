const mysql = require('promise-mysql');

export function createConnection() {
  return mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'test',
  });
}
