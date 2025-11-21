const db = require('./db');

const fixes = [
  "ALTER TABLE admins MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;",
  "ALTER TABLE buses MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;",
  "ALTER TABLE bookings MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;",
  "ALTER TABLE testimonials MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;",
];

async function run() {
  for (const q of fixes) {
    await new Promise((resolve) => {
      db.query(q, (err) => {
        if (err) {
          console.warn('Skipping/failed:', q, '\n->', err.message || err);
        } else {
          console.log('Applied:', q);
        }
        resolve();
      });
    });
  }
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to run fixes:', err);
  process.exit(1);
});
