// login-app-backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Email setup (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testproyeklogin@gmail.com',      // ← Ganti
    pass: 'qbpt xkoz hwnx fqbr'           // ← Ganti (Gunakan App Password Gmail)
  }
});

const isEmail = val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isPhone = val => /^(\+62|0)[0-9]{9,14}$/.test(val);

// Register
app.post('/register', async (req, res) => {
  const { identifier, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const token = uuidv4();

  db.query(
    'SELECT * FROM users WHERE email_or_phone = ?',
    [identifier],
    (err, result) => {
      if (result.length > 0) {
        return res.json({ success: false, message: '❌ Akun sudah terdaftar' });
      }

      db.query(
        'INSERT INTO users (email_or_phone, password, verified, token) VALUES (?, ?, 0, ?)',
        [identifier, hashed, token],
        (err2) => {
          if (err2) return res.status(500).json({ message: '❌ Gagal daftar' });

          sendVerification(identifier, token);
          res.json({ success: true, message: '📨 Verifikasi dikirim!' });
        }
      );
    }
  );
});

// Login
app.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email_or_phone = ?',
    [identifier],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false, message: '❌ User tidak ditemukan' });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.json({ success: false, message: '❌ Password salah' });
      }

      if (!user.verified) {
        sendVerification(identifier, user.token);
        return res.json({ success: true, message: '📨 Verifikasi dikirim ulang!' });
      }

      return res.json({ success: true, message: '✅ Login berhasil', identifier });
    }
  );
});

// Verifikasi Token
app.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  db.query(
    'UPDATE users SET verified = 1 WHERE token = ?',
    [token],
    (err, result) => {
      if (result.affectedRows === 0) {
        return res.send('❌ Token tidak valid atau sudah digunakan.');
      }
      res.send('<h2>✅ Verifikasi berhasil! Silakan kembali ke aplikasi.</h2>');
    }
  );
});

// Simulasi kirim link
function sendVerification(identifier, token) {
  const link = `http://localhost:5000/verify/${token}`;
  if (isEmail(identifier)) {
    transporter.sendMail({
      from: 'Login App <youremail@gmail.com>',
      to: identifier,
      subject: 'Verifikasi Akun Login App',
      html: `<p>Klik link berikut untuk verifikasi: <a href="${link}">${link}</a></p>`,
    });
  } else if (isPhone(identifier)) {
    console.log(`📱 Kirim WA/SMS ke ${identifier}: ${link}`); // Ganti dengan API WA kalau dibutuhkan
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
