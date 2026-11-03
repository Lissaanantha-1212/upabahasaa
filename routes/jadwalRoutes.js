const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET: Ambil Log Jadwal Resmi
router.get('/log-jadwal', async (req, res) => {
    try {
        const logs = await prisma.jadwalTes.findMany({
            include: {
                pesertaJadwal: {
                    include: {
                        mahasiswa: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        console.error('Error Fetch Log Jadwal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST: Kunci Sesi Ujian (Validasi Ketat Kapasitas Lab B < 30, Kelas Duplikat, & Bentrok Lab)
router.post('/kunci-sesi', async (req, res) => {
    try {
        const { namaKelas, jurusan, tanggal, sesi, lab, jenisTest, mahasiswa } = req.body;
        
        // Normalisasi tanggal agar aman masuk ke database MySQL
        const tglTarget = tanggal ? new Date(tanggal) : new Date();
        const namaKelasClean = (namaKelas || '').trim();
        const jumlahPeserta = Array.isArray(mahasiswa) ? mahasiswa.length : 0;

        // ATURAN KAPASITAS LAB B: Harus di bawah 30 mahasiswa (< 30)
        if (lab === 'Lab Komputer Bahasa B' && jumlahPeserta >= 30) {
            return res.status(400).json({
                success: false,
                error: `GAGAL KAPASITAS! Lab Komputer Bahasa B maksimal peserta harus DI BAWAH 30 mahasiswa. Kelas "${namaKelasClean}" memiliki ${jumlahPeserta} peserta.`
            });
        }

        // ATURAN KELAS DUPLIKAT: Kelas yang sama tidak boleh dijadwalkan ulang
        const existingKelas = await prisma.jadwalTes.findFirst({
            where: {
                kelas: namaKelasClean
            }
        });

        if (existingKelas) {
            return res.status(400).json({
                success: false,
                error: `GAGAL! Kelas "${namaKelasClean}" sudah pernah dijadwalkan sebelumnya dan tidak boleh diduplikasi.`
            });
        }

        // ATURAN BENTROK RUANGAN: Sesi & Lab yang sama di tanggal tersebut tidak boleh dipakai kelas lain
        const existingLabSesi = await prisma.jadwalTes.findFirst({
            where: {
                tanggal: tglTarget,
                sesi: sesi,
                lab: lab
            }
        });

        if (existingLabSesi) {
            return res.status(400).json({
                success: false,
                error: `BENTROK RUANGAN! ${lab} pada ${sesi} di tanggal ini sudah digunakan oleh kelas "${existingLabSesi.kelas}".`
            });
        }

        // Simpan Jadwal ke Database Aiven
        const newJadwal = await prisma.jadwalTes.create({
            data: {
                kelas: namaKelasClean,
                tanggal: tglTarget,
                sesi: sesi,
                lab: lab,
                jenisTes: jenisTest || 'TOEFL',
                isLocked: true,
                dibuatOleh: 'Staf UPA Bahasa'
            }
        });

        // Simpan peserta jika ada data mahasiswa
        if (mahasiswa && Array.isArray(mahasiswa) && mahasiswa.length > 0) {
            for (const mhs of mahasiswa) {
                if (!mhs || !mhs.nim) continue;
                
                const mhsRecord = await prisma.mahasiswa.upsert({
                    where: { nim: String(mhs.nim) },
                    update: { 
                        nama: mhs.nama || 'Tanpa Nama',
                        prodi: mhs.prodi || jurusan || 'TEKNIK INFORMATIKA',
                        jurusan: jurusan || 'TEKNIK INFORMATIKA'
                    },
                    create: {
                        nim: String(mhs.nim),
                        nama: mhs.nama || 'Tanpa Nama',
                        prodi: mhs.prodi || jurusan || 'TEKNIK INFORMATIKA',
                        jurusan: jurusan || 'TEKNIK INFORMATIKA',
                        angkatan: '2024',
                        semester: 1
                    }
                });

                await prisma.pesertaJadwal.create({
                    data: {
                        idJadwal: newJadwal.id,
                        nim: mhsRecord.nim,
                        idMeja: mhs.idMeja || `STUDENT${String(mhsRecord.id || 1).padStart(2, '0')}`
                    }
                });
            }
        }

        res.json({ success: true, message: 'Berhasil dikunci ke DB Aiven!', data: newJadwal });
    } catch (error) {
        console.error('Error Kunci Sesi:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE: Hapus Data Jadwal dari Database Aiven
router.delete('/hapus-jadwal/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Hapus relasi peserta terlebih dahulu agar tidak terkena Foreign Key Constraint Error
        await prisma.pesertaJadwal.deleteMany({
            where: { idJadwal: parseInt(id) }
        });

        // Hapus data jadwal utamanya
        await prisma.jadwalTes.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Jadwal berhasil dihapus dari Database Aiven.' });
    } catch (error) {
        console.error('Error Hapus Jadwal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;