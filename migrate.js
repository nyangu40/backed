const db = require('./db');

const statements = [
  `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
  ) ENGINE=INNODB;`,

  `CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_name VARCHAR(255),
    organizer VARCHAR(255),
    origin VARCHAR(255),
    destination VARCHAR(255),
    total_seats INT,
    price DECIMAL(10,2),
    airtel_number VARCHAR(50),
    image TEXT,
    admin_id INT,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
  ) ENGINE=INNODB;`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT,
    student_name VARCHAR(255),
    seat_number VARCHAR(50),
    payment_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payer_number VARCHAR(50),
    tx_ref VARCHAR(255),
    status VARCHAR(50),
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
  ) ENGINE=INNODB;`,

  `CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT,
    name VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
  ) ENGINE=INNODB;`,
];

async function run() {
  for (const s of statements) {
    await new Promise((resolve, reject) => {
      db.query(s, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  console.log('Migration complete');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
