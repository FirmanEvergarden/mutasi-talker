// server.js (atau app.js)

const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Bisa digunakan untuk menyajikan file statis, opsional

const app = express();
// Koyeb akan otomatis memberikan nilai untuk PORT, jadi kita gunakan process.env.PORT
// Jika tidak ada, fallback ke 3000 untuk pengembangan lokal
const PORT = process.env.PORT || 3000;

// Middleware untuk mengurai body dari request yang datang.
// Tasker akan mengirim data dalam format URL-encoded.
app.use(express.urlencoded({ extended: true }));
// Jika suatu saat kamu ingin Tasker mengirim data dalam format JSON, kamu juga bisa pakai ini:
// app.use(express.json());

// --- Konfigurasi MongoDB ---
// PENTING: Ganti dengan connection string MongoDB kamu!
// Untuk Koyeb, kamu akan mengatur ini sebagai Environment Variable.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mutasievgr:MannID@mutasi.og3hih7.mongodb.net/?retryWrites=true&w=majority&appName=mutasi';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Berhasil terhubung ke MongoDB'))
  .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// --- Definisi Skema dan Model MongoDB ---
// Ini akan mendefinisikan struktur data notifikasi di database kamu
const notificationSchema = new mongoose.Schema({
  amount: { type: Number, required: true }, // Jumlah dana yang masuk
  taskerTimestamp: { type: Number, required: false }, // Timestamp dari Tasker
  rawText: { type: String, required: false }, // (Opsional) Teks notifikasi asli dari Tasker
  createdAt: { type: Date, default: Date.now } // Timestamp otomatis dari MongoDB kapan data disimpan
});

const Notification = mongoose.model('Notification', notificationSchema);

// --- API Endpoint untuk Menerima Notifikasi dari Tasker ---
// Ini adalah alamat yang akan di-POST oleh Tasker
app.post('/api/catat_mutasi', async (req, res) => {
  // Data yang dikirim dari Tasker akan ada di req.body
  // Kita akan menerima 'amount' (dari %jumlah1) dan 'timestamp' (dari %TIMES)
  const { amount, timestamp, raw_text } = req.body;
  console.log('Menerima data dari Tasker:', req.body);

  // Validasi sederhana
  if (!amount) {
    return res.status(400).send('Nilai "amount" diperlukan.');
  }

  // Konversi 'amount' ke tipe Number (karena datangnya sebagai string dari URL-encoded)
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return res.status(400).send('Format "amount" tidak valid.');
  }

  try {
    // Buat dokumen notifikasi baru berdasarkan skema
    const newNotification = new Notification({
      amount: parsedAmount,
      taskerTimestamp: timestamp ? parseInt(timestamp) : undefined, // Konversi ke number jika ada
      rawText: raw_text || undefined // Simpan jika disediakan dari Tasker
    });

    // Simpan dokumen ke database
    await newNotification.save();
    console.log('Notifikasi berhasil disimpan:', newNotification);
    res.status(200).send('Notifikasi berhasil disimpan!');
  } catch (error) {
    console.error('Error saat menyimpan notifikasi:', error);
    res.status(500).send('Error saat menyimpan notifikasi: ' + error.message);
  }
});

// --- Rute Dasar (Opsional) ---
// Rute ini hanya untuk memastikan server berjalan saat diakses dari browser
app.get('/', (req, res) => {
  res.send('API Notifikasi Tasker berjalan dengan baik!');
});

// --- Menjalankan Server ---
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});