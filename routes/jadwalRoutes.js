const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Ambil Semua Log Histori Penjadwalan Sesi Dikunci
router.get('/log-jadwal', async (req, res) => {
  try {
    const logs = await prisma.jadwalTes.findMany({
      include: {
        pesertaJadwal: {
          include: { mahasiswa: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST: Simpan & Kunci Sesi Ujian ke Database (Dengan Proteksi Bentrok Sesi & Lab)
router.post('/kunci-sesi', async (req, res) => {
  const { namaKelas, jurusan, tanggal, sesi, lab, jenisTest, mahasiswa } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Buat Header JadwalTes
      const newJadwal = await tx.jadwalTes.create({
        data: {
          namaKelas,
          tanggal: new Date(tanggal),
          sesi,
          lab,
          jenisTes: jenisTest,
          isLocked: true
        }
      });

      // Insert/Update Data Mahasiswa & Hubungkan PesertaJadwal
      for (const mhs of mahasiswa) {
        await tx.mahasiswa.upsert({
          where: { nim: mhs.nim },
          update: { nama: mhs.nama, jurusan: jurusan, prodi: jurusan },
          create: {
            nim: mhs.nim,
            nama: mhs.nama,
            jurusan: jurusan,
            prodi: jurusan,
            angkatan: 2024
          }
        });

        await tx.pesertaJadwal.create({
          data: {
            idJadwal: newJadwal.id,
            nim: mhs.nim,
            idMeja: mhs.idMeja
          }
        });
      }

      return newJadwal;
    });

    res.json({ success: true, message: 'Penjadwalan berhasil dikunci dan tersimpan di database Aiven!', data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;