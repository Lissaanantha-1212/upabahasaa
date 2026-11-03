const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Konfigurasi Multer untuk menyimpan file upload sementara di memori
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint POST untuk Upload & Simpan Rekap Excel ke Database
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file Excel yang di-upload.' });
    }

    const { tahunArsip, jenisTes } = req.body; // Contoh: tahunArsip = "2024", jenisTes = "sspect"

    // Membaca buffer file Excel menggunakan library xlsx
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const activeSheetName = workbook.SheetNames.includes('LAPORAN') ? 'LAPORAN' : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[activeSheetName];
    const excelRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let countInserted = 0;
    let activeProdiName = null;

    // Looping baris Excel untuk disimpan ke database via Prisma
    for (const row of excelRows) {
      const validRowCells = row.map((val, idx) => ({ val, idx })).filter(col => col.val !== null && col.val !== undefined && col.val !== '');
      if (validRowCells.length === 0) continue;

      // Deteksi Nama Program Studi
      for (let i = 0; i < validRowCells.length; i++) {
        const cellText = String(validRowCells[i].val).trim();
        if ((cellText.includes('D3 -') || cellText.includes('D4 -') || cellText.includes('DII -')) 
            && !cellText.includes('HASIL') && !cellText.includes('REKAP')) {
          activeProdiName = cellText;
          break;
        }
      }

      // Deteksi Data Mahasiswa & Simpan ke Database
      if (activeProdiName && validRowCells.length >= 6) {
        const rawValues = validRowCells.map(col => col.val);
        const rowNumber = rawValues[0];

        if (typeof rowNumber === 'number' && rowNumber >= 1 && rowNumber < 300) {
          const studentName = String(rawValues[1]).trim();
          const studentNim = String(rawValues[2]).trim();
          
          let extractedScore = 0;
          if (rawValues.length > 6 && typeof rawValues[6] === 'number') {
            extractedScore = Math.round(rawValues[6]);
          }

          if (isNaN(Number(studentName)) && studentNim.length >= 7) {
            // Tentukan Jurusan secara otomatis berdasarkan Prodi
            let jurusanName = 'TEKNOLOGI INFORMASI'; // Sesuaikan logika fungsi pemetaan jurusannyamu
            if (activeProdiName.includes('AKUNTANSI')) jurusanName = 'AKUNTANSI';
            else if (activeProdiName.includes('MESIN')) jurusanName = 'TEKNIK MESIN';
            // ... (tambahkan aturan pemetaan jurusan lainnya sesuai kebutuhan)

            // 1. Simpan atau Update data Mahasiswa ke tabel Mahasiswa
            await prisma.mahasiswa.upsert({
              where: { nim: studentNim },
              update: {
                nama: studentName,
                prodi: activeProdiName,
                jurusan: jurusanName,
              },
              create: {
                nim: studentNim,
                nama: studentName,
                prodi: activeProdiName,
                jurusan: jurusanName,
                angkatan: parseInt(tahunArsip) || 2024,
                semester: 1
              }
            });

            // 2. Simpan data nilai ke tabel HasilTes agar tersimpan permanen
            await prisma.hasilTes.create({
              data: {
                nim: studentNim,
                tahunArsip: tahunArsip || '2024',
                jenisTes: jenisTes || 'sspect',
                totalSkor: extractedScore,
                statusLulus: extractedScore >= 450
              }
            });

            countInserted++;
          }
        }
      }
    }

    res.status(200).json({ 
      message: 'Data rekapitulasi berhasil disimpan ke database!', 
      totalData: countInserted 
    });

  } catch (error) {
    console.error('Gagal memproses upload:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat memproses file.' });
  }
});

module.exports = router;