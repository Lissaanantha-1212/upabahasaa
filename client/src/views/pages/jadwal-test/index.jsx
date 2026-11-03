import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Button, Paper, Box, Alert, 
  Checkbox, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import MainCard from 'ui-component/cards/MainCard';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:3000/api';

const JadwalTest = () => {
  const [namaKelasInput, setNamaKelasInput] = useState('');

  const [kelolaKelas, setKelolaKelas] = useState(() => {
    const saved = localStorage.getItem('antrean_kelola_kelas');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedMhs, setSelectedMhs] = useState([]);

  const [jenisTest, setJenisTest] = useState('TOEFL');
  const [tanggal, setTanggal] = useState('2026-10-28');
  const [sesi, setSesi] = useState('Sesi 1 (Pagi) | 08.00 - 10.00 WITA');
  const [lab, setLab] = useState('Lab Komputer Bahasa A');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('antrean_kelola_kelas', JSON.stringify(kelolaKelas));
    if (kelolaKelas.length > 0 && !selectedKelasId) {
      setSelectedKelasId(kelolaKelas[0].id);
      setSelectedMhs(kelolaKelas[0].mahasiswa.map(m => m.id));
    }
  }, [kelolaKelas]);

  const fetchLogsFromDB = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/log-jadwal`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLogs(data);
      }
    } catch (err) {
      console.error('Fetch DB Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsFromDB();
  }, []);

  // Handler Upload Excel (Validasi Nama Kelas & Validasi Isi NIM Mahasiswa)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const namaKelasClean = namaKelasInput.trim().toUpperCase();
    if (!namaKelasClean) {
      alert('Masukkan Nama Kelas terlebih dahulu!');
      e.target.value = '';
      return;
    }

    // 1. Cek Nama Kelas di Log DB
    const isAlreadyInDB = logs.some(
      (log) => (log.kelas || log.namaKelas || '').trim().toUpperCase() === namaKelasClean
    );

    if (isAlreadyInDB) {
      alert(`GAGAL UPLOAD!\nKelas "${namaKelasClean}" sudah dikunci di Database dan tidak boleh dijadwalkan lagi.`);
      e.target.value = '';
      return;
    }

    // 2. Cek Nama Kelas di Antrean
    const isAlreadyInQueue = kelolaKelas.some(
      (k) => k.namaKelas.toUpperCase() === namaKelasClean
    );

    if (isAlreadyInQueue) {
      alert(`Kelas "${namaKelasClean}" sudah ada di dalam antrean!`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const parsedMhs = data.map((row, idx) => ({
        id: idx + 1,
        nim: String(row.NIM || row.Nim || row.nim || `2461510${String(idx + 1).padStart(2, '0')}`).trim(),
        nama: String(row.Nama || row.NAMA || row.nama || `MAHASISWA ${idx + 1}`).trim().toUpperCase(),
        idMeja: `STUDENT${String(idx + 1).padStart(2, '0')}`
      }));

      // 3. VALIDASI ISI FILE: Cek apakah ada NIM di dalam Excel ini yang sudah ada di Log DB
      const existingNimsInDB = new Set();
      logs.forEach(log => {
        if (log.pesertaJadwal && Array.isArray(log.pesertaJadwal)) {
          log.pesertaJadwal.forEach(p => {
            if (p.nim) existingNimsInDB.add(String(p.nim).trim());
          });
        }
      });

      const duplicateMhs = parsedMhs.find(m => existingNimsInDB.has(m.nim));

      if (duplicateMhs) {
        alert(
          `DILARANG UPLOAD!\n\nFile Excel ini berisi mahasiswa (NIM: ${duplicateMhs.nim} - ${duplicateMhs.nama}) yang sudah pernah dijadwalkan di Database!\n\nTidak boleh mengunggah data mahasiswa yang sama meskipun nama kelas diubah.`
        );
        e.target.value = '';
        return;
      }

      const newKelasObj = {
        id: Date.now().toString(),
        namaKelas: namaKelasClean,
        mahasiswa: parsedMhs
      };

      setKelolaKelas((prev) => [...prev, newKelasObj]);
      setSelectedKelasId(newKelasObj.id);
      setSelectedMhs(parsedMhs.map(m => m.id));
      setNamaKelasInput('');
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleHapusAntrean = () => {
    if (!selectedKelasId) return;
    const kelasTarget = kelolaKelas.find((k) => k.id === selectedKelasId);
    if (window.confirm(`Hapus antrean kelas "${kelasTarget?.namaKelas}"?`)) {
      const sisa = kelolaKelas.filter((k) => k.id !== selectedKelasId);
      setKelolaKelas(sisa);
      if (sisa.length > 0) {
        setSelectedKelasId(sisa[0].id);
        setSelectedMhs(sisa[0].mahasiswa.map(m => m.id));
      } else {
        setSelectedKelasId('');
        setSelectedMhs([]);
      }
    }
  };

  const handleHapusLogDB = async (id, namaKelas) => {
    if (window.confirm(`Hapus permanen jadwal kelas "${namaKelas}" dari Database Aiven?`)) {
      try {
        const res = await fetch(`${API_URL}/hapus-jadwal/${id}`, { method: 'DELETE' });
        const resData = await res.json();
        if (res.ok && resData.success) {
          alert('Berhasil dihapus dari Database Aiven!');
          fetchLogsFromDB();
        } else {
          alert(`Gagal hapus: ${resData.error}`);
        }
      } catch (err) {
        alert('Gagal terhubung ke server!');
      }
    }
  };

  const activeKelas = kelolaKelas.find((k) => k.id === selectedKelasId);

  const handleSelectAll = (e) => {
    if (e.target.checked && activeKelas) {
      setSelectedMhs(activeKelas.mahasiswa.map(m => m.id));
    } else {
      setSelectedMhs([]);
    }
  };

  const handleToggleMhs = (id) => {
    if (selectedMhs.includes(id)) {
      setSelectedMhs(selectedMhs.filter(mId => mId !== id));
    } else {
      setSelectedMhs([...selectedMhs, id]);
    }
  };

  const handleLockPlotting = async () => {
    if (isSubmitting || !activeKelas) return;

    const namaKelasClean = activeKelas.namaKelas.trim().toUpperCase();

    const isAlreadyInDB = logs.some(
      (log) => (log.kelas || log.namaKelas || '').trim().toUpperCase() === namaKelasClean
    );

    if (isAlreadyInDB) {
      alert(`GAGAL KUNCI!\nKelas "${namaKelasClean}" sudah dikunci di Database.`);
      return;
    }

    const isBentrok = logs.some(
      (log) =>
        String(log.tanggal).split('T')[0] === tanggal &&
        log.sesi === sesi &&
        log.lab === lab
    );

    if (isBentrok) {
      alert(`GAGAL KUNCI!\n${lab} pada ${sesi} di tanggal ini sudah dipakai oleh kelas lain.`);
      return;
    }

    setIsSubmitting(true);
    const mhsTerpilih = activeKelas.mahasiswa.filter(m => selectedMhs.includes(m.id));

    const payload = {
      namaKelas: activeKelas.namaKelas,
      jurusan: 'TEKNIK INFORMATIKA',
      tanggal: tanggal,
      sesi: sesi,
      lab: lab,
      jenisTest: jenisTest,
      mahasiswa: mhsTerpilih
    };

    try {
      const response = await fetch(`${API_URL}/kunci-sesi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        alert(`BERHASIL! Penjadwalan ${activeKelas.namaKelas} telah tersimpan di Aiven.`);
        const sisa = kelolaKelas.filter((k) => k.id !== selectedKelasId);
        setKelolaKelas(sisa);
        setSelectedKelasId(sisa.length > 0 ? sisa[0].id : '');
        setSelectedMhs(sisa.length > 0 ? sisa[0].mahasiswa.map(m => m.id) : []);
        fetchLogsFromDB();
      } else {
        alert(`GAGAL MENYIMPAN:\n${resData.error}`);
      }
    } catch (error) {
      alert('Gagal terhubung ke Server Backend!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = (logItem) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('POLITEKNIK NEGERI SAMARINDA', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('BERITA ACARA PELAKSANAAN UJIAN UPA BAHASA', 105, 22, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(14, 26, 196, 26);

      doc.setFontSize(10);
      doc.text(`Nama Kelas   : ${logItem.kelas || logItem.namaKelas || 'Kelas UPA'}`, 14, 34);
      doc.text(`Jenis Ujian  : ${logItem.jenisTes || 'TOEFL'}`, 14, 40);
      doc.text(`Lokasi Lab   : ${logItem.lab || '-'}`, 14, 46);
      doc.text(`Sesi Ujian   : ${logItem.sesi || '-'}`, 14, 52);
      doc.text(`Tanggal      : ${String(logItem.tanggal || '').split('T')[0]}`, 14, 58);

      const pesertaList = logItem.pesertaJadwal || [];
      const tableRows = pesertaList.map((p, idx) => [
        idx + 1,
        p.idMeja || `STUDENT${String(idx + 1).padStart(2, '0')}`,
        p.nim || '-',
        p.mahasiswa ? p.mahasiswa.nama : `MAHASISWA ${idx + 1}`,
        '[   ] Hadir'
      ]);

      doc.autoTable({
        startY: 64,
        head: [['No', 'ID Meja', 'NIM', 'Nama Mahasiswa', 'Kehadiran']],
        body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Tidak Ada Peserta', '-']],
        theme: 'grid',
        headStyles: { fillColor: [30, 136, 229] },
        styles: { fontSize: 9 }
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100;
      doc.text('Pengawas Ruang Ujian,', 140, finalY);
      doc.text('( ____________________ )', 140, finalY + 20);

      doc.save(`Berita_Acara_${logItem.kelas || 'Ujian'}_${logItem.jenisTes || 'TEST'}.pdf`);
    } catch (err) {
      alert('Gagal mengunduh PDF.');
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Modul 1: Penjadwalan & Penguncian Sesi Ujian">
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload master data kelas baru, tentukan jenis tes, sesi, dan lokasi lab. Klik Kunci Sesi Ujian untuk menyimpan data secara permanen ke Database.
          </Alert>

          <Paper elevation={1} sx={{ p: 2.5, mb: 4, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Upload Master Data Kelas Baru (Excel)</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  size="small" 
                  label="Nama Kelas Baru (Contoh: 5 TI B / D3 Elektro A)" 
                  value={namaKelasInput}
                  onChange={(e) => setNamaKelasInput(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="success"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ py: 1, fontWeight: 'bold' }}
                >
                  Upload File Excel Mhs
                  <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={1} sx={{ p: 2.5, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Pengaturan Sesi & Centang Mahasiswa Terjadwal ({kelolaKelas.length} Kelas Menunggu Plotting)
              </Typography>

              {selectedKelasId && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleHapusAntrean}
                  sx={{ fontWeight: 'bold' }}
                >
                  Hapus Antrean Kelas Ini
                </Button>
              )}
            </Box>

            {kelolaKelas.length === 0 ? (
              <Typography color="textSecondary" sx={{ py: 1 }}>
                Semua kelas sudah dijadwalkan atau belum ada antrean file.
              </Typography>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Jenis Ujian / Tes</InputLabel>
                      <Select value={jenisTest} label="Jenis Ujian / Tes" onChange={(e) => setJenisTest(e.target.value)}>
                        <MenuItem value="TOEFL">TOEFL</MenuItem>
                        <MenuItem value="SSPECT">SSPECT</MenuItem>
                        <MenuItem value="TOEIC">TOEIC</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Pilih Antrean Kelas</InputLabel>
                      <Select value={selectedKelasId} label="Pilih Antrean Kelas" onChange={(e) => setSelectedKelasId(e.target.value)}>
                        {kelolaKelas.map((k) => (
                          <MenuItem key={k.id} value={k.id}>{k.namaKelas} ({k.mahasiswa.length} Mhs)</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2.4}>
                    <TextField 
                      fullWidth 
                      type="date" 
                      size="small" 
                      label="Tanggal Ujian" 
                      value={tanggal} 
                      onChange={(e) => setTanggal(e.target.value)} 
                      InputLabelProps={{ shrink: true }} 
                    />
                  </Grid>

                  <Grid item xs={12} sm={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sesi & Jam Ujian</InputLabel>
                      <Select value={sesi} label="Sesi & Jam Ujian" onChange={(e) => setSesi(e.target.value)}>
                        <MenuItem value="Sesi 1 (Pagi) | 08.00 - 10.00 WITA">Sesi 1 (Pagi) | 08.00 - 10.00 WITA</MenuItem>
                        <MenuItem value="Sesi 2 (Siang) | 10.00 - 12.00 WITA">Sesi 2 (Siang) | 10.00 - 12.00 WITA</MenuItem>
                        <MenuItem value="Sesi 3 (Sore) | 14.00 - 16.00 WITA">Sesi 3 (Sore) | 14.00 - 16.00 WITA</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Lokasi Lab</InputLabel>
                      <Select value={lab} label="Lokasi Lab" onChange={(e) => setLab(e.target.value)}>
                        <MenuItem value="Lab Komputer Bahasa A">Lab Komputer Bahasa A</MenuItem>
                        <MenuItem value="Lab Komputer Bahasa B">Lab Komputer Bahasa B</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {activeKelas && (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox 
                                checked={selectedMhs.length === activeKelas.mahasiswa.length} 
                                onChange={handleSelectAll} 
                              />
                            </TableCell>
                            <TableCell><b>ID Meja</b></TableCell>
                            <TableCell><b>NIM</b></TableCell>
                            <TableCell><b>Nama Mahasiswa</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeKelas.mahasiswa.map((mhs) => (
                            <TableRow key={mhs.id} hover onClick={() => handleToggleMhs(mhs.id)} sx={{ cursor: 'pointer' }}>
                              <TableCell padding="checkbox">
                                <Checkbox checked={selectedMhs.includes(mhs.id)} />
                              </TableCell>
                              <TableCell><Chip label={mhs.idMeja} size="small" variant="outlined" /></TableCell>
                              <TableCell>{mhs.nim}</TableCell>
                              <TableCell><b>{mhs.nama}</b></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Button 
                      variant="contained" 
                      color="primary" 
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                      onClick={handleLockPlotting}
                      sx={{ px: 3, py: 1, fontWeight: 'bold' }}
                    >
                      {isSubmitting ? 'MEMPROSES...' : 'KUNCI SESI UJIAN'}
                    </Button>
                  </>
                )}
              </>
            )}
          </Paper>

          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">📋 LOG HISTORI PENJADWALAN SESI DIKUNCI (DATABASE RESMI)</Typography>
              <Button startIcon={<RefreshIcon />} size="small" onClick={fetchLogsFromDB}>
                Refresh Log
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><b>No</b></TableCell>
                    <TableCell><b>Jenis Tes</b></TableCell>
                    <TableCell><b>Nama Kelas</b></TableCell>
                    <TableCell><b>Tanggal</b></TableCell>
                    <TableCell><b>Sesi & Jam</b></TableCell>
                    <TableCell><b>Ruang Lab</b></TableCell>
                    <TableCell align="center"><b>Jumlah Mhs</b></TableCell>
                    <TableCell align="center"><b>Status</b></TableCell>
                    <TableCell align="center"><b>Aksi</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {loading ? 'Memuat data dari database Aiven...' : 'Belum ada riwayat sesi yang dikunci.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.jenisTes || 'TOEFL'} 
                            variant="outlined" 
                            size="small" 
                            sx={{ fontWeight: 'bold', borderColor: '#94a3b8', color: '#1e293b' }} 
                          />
                        </TableCell>
                        <TableCell><b>{log.kelas || log.namaKelas || '-'}</b></TableCell>
                        <TableCell>{String(log.tanggal || '').split('T')[0]}</TableCell>
                        <TableCell>{log.sesi}</TableCell>
                        <TableCell><Chip label={log.lab} color="primary" size="small" variant="outlined" /></TableCell>
                        <TableCell align="center"><b>{log.pesertaJadwal ? log.pesertaJadwal.length : 0} Mhs</b></TableCell>
                        <TableCell align="center"><Chip label="Dikunci" color="success" size="small" /></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button 
                              variant="outlined" 
                              color="secondary" 
                              size="small"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => handleExportPDF(log)}
                            >
                              PDF
                            </Button>

                            <Tooltip title="Hapus dari Database Aiven">
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleHapusLogDB(log.id, log.kelas || log.namaKelas)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

        </MainCard>
      </Grid>
    </Grid>
  );
};

export default JadwalTest;