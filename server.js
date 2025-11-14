// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =================== UPLOAD CONFIG ===================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// =================== JWT MIDDLEWARE ===================
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: "Unauthorized" });

  const token = header.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
}

// =================== ROOT ===================
app.get("/", (_, res) => res.send("Backend running..."));

// =================== AUTH ===================
app.post("/register", (req, res) => {
  const { full_name, username, password } = req.body;
  if (!full_name || !username || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (rows.length) return res.json({ success: false, message: "Email already registered" });

    db.query(
      "INSERT INTO admins (full_name, username, password) VALUES (?, ?, ?)",
      [full_name, username, password],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "Database error" });
        res.json({ success: true, message: "Registration successful!" });
      }
    );
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM admins WHERE username = ? AND password = ?",
    [username, password],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      if (!rows.length) return res.json({ success: false, message: "Invalid credentials" });

      const user = rows[0];

      const token = jwt.sign(
        { admin_id: user.id, username: user.username },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "4h" }
      );

      res.json({
        success: true,
        token,
        admin_id: user.id,
        username: user.username,
      });
    }
  );
});

// =================== BUSES ===================

// Add bus
app.post("/buses", verifyToken, upload.single("image"), (req, res) => {
  const { bus_name, organizer, origin, destination, total_seats, price, airtel_number } = req.body;

  const admin_id = req.user.admin_id;
  const imagePath = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO buses (bus_name, organizer, origin, destination, total_seats, price, airtel_number, image, admin_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [bus_name, organizer, origin, destination, total_seats, price, airtel_number, imagePath, admin_id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Database error", err });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Public bus list
app.get("/buses", (_, res) => {
  db.query("SELECT * FROM buses ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json(rows);
  });
});

// Admin buses
app.get("/admin/buses", verifyToken, (req, res) => {
  db.query("SELECT * FROM buses WHERE admin_id = ?", [req.user.admin_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json(rows);
  });
});

// =================== BOOKINGS ===================
app.post("/bookings", (req, res) => {
  const { bus_id, student_name, seat_number, payment_amount, payment_method, payer_number, tx_ref } =
    req.body;

  if (!bus_id || !student_name)
    return res.status(400).json({ success: false, message: "Missing fields" });

  db.query(
    `INSERT INTO bookings 
     (bus_id, student_name, seat_number, payment_amount, payment_method, payer_number, tx_ref, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [bus_id, student_name, seat_number, payment_amount, payment_method, payer_number, tx_ref],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});

// Admin bookings
app.get("/admin/bookings", verifyToken, (req, res) => {
  const sql = `
    SELECT bookings.*, buses.bus_name, buses.organizer, buses.origin, buses.destination
    FROM bookings
    JOIN buses ON bookings.bus_id = buses.id
    WHERE buses.admin_id = ?
    ORDER BY bookings.id DESC
  `;

  db.query(sql, [req.user.admin_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json(rows);
  });
});

// =================== PAYMENT (unchanged) ===================
app.post("/initiatePayment", async (req, res) => {
  const { amount, phone, method, tx_ref } = req.body;

  try {
    const OPERATOR_REF = {
      airtel: "20be6c20-adeb-4b5b-a7ba-0769820df4fb",
      tnm: "27494cb5-ba9e-437f-a114-4e7a7686bcca",
    };

    const provider = method.toLowerCase();
    const ref_id = OPERATOR_REF[provider];

    const airtelRegex = /^(\+?265)?(99)\d{7}$/;
    const tnmRegex = /^(\+?265)?(88|89)\d{7}$/;

    if (provider === "airtel" && !airtelRegex.test(phone))
      return res.status(400).json({ success: false, message: "Invalid Airtel number" });

    if (provider === "tnm" && !tnmRegex.test(phone))
      return res.status(400).json({ success: false, message: "Invalid TNM number" });

    const payload = {
      mobile_money_operator_ref_id: ref_id,
      mobile: phone,
      amount: amount.toString(),
      charge_id: tx_ref,
      email: "customer@example.com",
      first_name: "Student",
      last_name: "Booking",
    };

    const response = await axios.post(
      `${process.env.PAYCHANGU_BASE_URL}/mobile-money/payments/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    if (data.status === "success" || data.message?.includes("initiated")) {
      res.json({ success: true, reference: tx_ref });
    } else {
      res.json({ success: false, message: data.message });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.response?.data?.message || "Payment failed",
    });
  }
});

// Webhook
app.post("/payment-callback", (req, res) => {
  const { ref_id, status } = req.body;

  db.query(
    "UPDATE bookings SET status = ? WHERE tx_ref = ?",
    [status === "success" ? "Paid" : "Failed", ref_id],
    () => res.sendStatus(200)
  );
});

// =================== START SERVER ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
