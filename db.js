const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // default user XAMPP
  password: '',          // kosong kalau belum kamu ubah
  database: 'login_app'  // nama DB yang kita buat tadi
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error koneksi ke MySQL:', err);
  } else {
    console.log('✅ Terkoneksi ke MySQL Database');
  }
});

module.exports = connection;
