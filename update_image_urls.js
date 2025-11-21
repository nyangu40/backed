// update_image_urls.js
// Scans `buses` table and updates any `image` values that are relative paths
// (like 'uploads/...' or '/uploads/...') to absolute URLs using the BACKEND_URL
// environment variable or the current host. Run this on your deployed host or
// locally with the production DB env vars set.

const db = require('./db');

const BACKEND_URL = process.env.BACKEND_URL || process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;

function normalizeImageUrl(img) {
  if (!img) return img;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const path = img.startsWith('/') ? img : '/' + img;
  return `${BACKEND_URL}${path}`;
}

async function run() {
  db.query('SELECT id, image FROM buses', (err, rows) => {
    if (err) {
      console.error('Failed to read buses:', err.message || err);
      process.exit(1);
    }

    let updates = 0;
    rows.forEach((r) => {
      if (!r.image) return;
      if (r.image.startsWith('http://') || r.image.startsWith('https://')) return;
      const newUrl = normalizeImageUrl(r.image);
      db.query('UPDATE buses SET image = ? WHERE id = ?', [newUrl, r.id], (uErr) => {
        if (uErr) console.error('Failed to update bus', r.id, uErr.message || uErr);
        else {
          updates++;
          console.log('Updated', r.id, '->', newUrl);
        }
      });
    });

    // wait a small moment for pending updates to finish
    setTimeout(() => {
      console.log('Done. Total updates:', updates);
      process.exit(0);
    }, 1500);
  });
}

run();
