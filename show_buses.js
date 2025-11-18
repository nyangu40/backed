const db = require('./db');

db.query('SHOW CREATE TABLE buses', (err, rows) => {
  if (err) {
    console.error('ERROR', err.code, err.sqlMessage);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
