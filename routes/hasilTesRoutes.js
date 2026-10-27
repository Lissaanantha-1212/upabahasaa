const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. POST: Simpan Hasil Tes Auto Mapping / Manual Bind (TOEFL & SSPECT)
router.post('/simpan-hasil', async (req, res) => {
  const { jenisTes, idJadwal, dataNilai } = req.body;

  try {
    const records = [];
    for (const item of dataNilai) {
      const record = await prisma.hasilTes.create({
        data: {
          nim: item.nim,
          idJadwal: idJadwal || null,
          jenisTes: jenisTes,
          idMeja: item.idMeja,
          sec1Listening: item.sec1 || null,
          sec2Structure: item.sec2 || null,
          sec3Reading: item.sec3 || null,
          totalSkor: item.totalScore || item.score || 0,
          statusLulus: (item.totalScore || item.score || 0) >= 450
        }
      });
      records.push(record);
    }

    res.json({ success: true, message: 'Hasil tes berhasil disimpan!', data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST: Publikasi Pengumuman TOEIC (Oleh Staf)
router.post('/publish-toeic', async (req, res) => {
  const { deskripsiStaf, dataMahasiswaLulus } = req.body;

  try {
    const records = [];
    for (const mhs of dataMahasiswaLulus) {
      // Upsert mahasiswa jika belum terdaftar di DB
      await prisma.mahasiswa.upsert({
        where: { nim: mhs.nim },
        update: { nama: mhs.nama, prodi: mhs.prodi },
        create: { nim: mhs.nim, nama: mhs.nama, prodi: mhs.prodi, jurusan: mhs.prodi, angkatan: 2024 }
      });

      const record = await prisma.hasilTes.create({
        data: {
          nim: mhs.nim,
          jenisTes: 'TOEIC',
          totalSkor: Number(mhs.skor),
          statusLulus: true,
          deskripsiStaf: deskripsiStaf
        }
      });
      records.push(record);
    }

    res.json({ success: true, message: 'Pengumuman TOEIC berhasil dipublikasikan ke portal utama!', data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;