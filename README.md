# AquaStudent

AquaStudent adalah aplikasi web sederhana untuk membantu mahasiswa mencatat konsumsi air dan mengingat minum secara berkala. Aplikasi dibuat dengan HTML, CSS, Bootstrap 5, dan JavaScript vanilla tanpa proses build.

## Struktur Proyek

```text
AquaStudent/
|-- index.html
|-- style.css
|-- script.js
`-- README.md
```

## Fitur

- Progres harian dengan target awal 2.000 ml. Target dapat diubah antara 250 dan 10.000 ml.
- Tombol tambah cepat untuk 250 ml dan 500 ml, serta input jumlah khusus.
- Riwayat jumlah dan waktu minum. Catatan dapat dihapus satu per satu atau direset sekaligus.
- Pengingat browser dengan pilihan interval 30 menit, 1 jam, atau 2 jam.
- Progres dan pengaturan tersimpan di `localStorage` browser. Riwayat otomatis dimulai ulang pada tanggal berikutnya.
- Tata letak responsif untuk layar ponsel dan desktop.

## Menjalankan Secara Lokal

1. Pastikan semua file proyek berada di folder yang sama.
2. Buka folder proyek di VS Code.
3. Cara yang disarankan: jalankan folder dengan ekstensi **Live Server**, lalu buka alamat lokal yang ditampilkan, biasanya `http://127.0.0.1:5500`.
4. Alternatif dengan Python, buka terminal di folder proyek dan jalankan:

   ```powershell
   py -m http.server 8000
   ```

   Buka `http://localhost:8000` di browser. Hentikan server dengan `Ctrl+C`.

Bootstrap dan Bootstrap Icons dimuat dari CDN, sehingga koneksi internet diperlukan untuk memuat styling dan ikon tersebut.

## Notifikasi Pengingat

Tekan **Aktifkan pengingat**, lalu izinkan notifikasi ketika browser meminta izin. Pengingat browser hanya dapat berjalan ketika halaman AquaStudent tetap terbuka; beberapa browser juga dapat menunda timer saat tab tidak aktif. Notifikasi memerlukan browser yang mendukung Web Notifications dan konteks aman, seperti `localhost` atau situs HTTPS. Browser atau sistem operasi dapat mengatur bunyi notifikasi sendiri; aplikasi tidak menjamin suara tertentu.

## Deploy ke Vercel lewat GitHub

1. Buat repository baru di GitHub, misalnya `aquastudent`. Untuk proyek baru, repository boleh dibuat kosong tanpa file tambahan.
2. Buka terminal pada folder proyek, lalu hubungkan folder dan kirim file ke GitHub. Ganti `USERNAME` dengan nama akun GitHub dan sesuaikan nama repository jika berbeda:

   ```powershell
   git init
   git add index.html style.css script.js README.md
   git commit -m "Buat aplikasi AquaStudent"
   git branch -M main
   git remote add origin https://github.com/USERNAME/aquastudent.git
   git push -u origin main
   ```

   Jika folder ini sudah merupakan repository Git, lewati `git init`. Jika remote `origin` sudah ada, periksa dengan `git remote -v` dan gunakan remote yang sesuai.
3. Masuk ke [vercel.com](https://vercel.com), lalu daftar atau masuk menggunakan akun GitHub.
4. Pilih **Add New...** > **Project**, lalu impor repository `aquastudent`. Beri Vercel akses ke repository jika diminta.
5. Pada konfigurasi proyek, pilih **Other** sebagai framework. Biarkan **Build Command** kosong dan isi **Output Directory** dengan `.` (folder root). Tidak diperlukan install command.
6. Pilih **Deploy**. Setelah proses selesai, Vercel memberikan URL HTTPS untuk aplikasi.
7. Setiap push baru ke branch `main` akan memicu deployment produksi otomatis. Branch lain dapat digunakan sebagai preview deployment.

## Penyimpanan dan Privasi

Data disimpan hanya di `localStorage` browser yang sedang digunakan. Data tidak tersinkron antarperangkat atau antarbrowser. Menghapus data situs dari pengaturan browser juga akan menghapus progres tersimpan.
