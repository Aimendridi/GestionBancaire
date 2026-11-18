const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: false,
  dateStrings: ['DATE'],
});

module.exports = pool;
