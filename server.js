import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Button, Paper, Box, Alert, 
  Checkbox, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import MainCard from 'ui-component/cards/MainCard';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const JadwalTest = () => {
  // State Form Upload & Antrean Kelas
  const [namaKelasInput, setNamaKelasInput] = useState('');
  const [kelolaKelas, setKelolaKelas] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedMhs, setSelectedMhs] = useState([]);

  // State Pengaturan Sesi & Lab
  const [tanggal, setTanggal] = useState('2026-10-28');
  const [sesi, setSesi] = useState('Sesi 1 (Pagi) | 08.00 - 10.00 WITA');
  const [lab, setLab] = useState('Lab Komputer Bahasa A');
  const [jenisTest, setJenisTest] = useState('TOEFL');

  // State Log Histori Resmi dari Database Aiven
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Ambil Log Histori Penjadwalan dari Database Aiven saat Page Loaded
  const fetchLogsFromDB = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/jadwal/log-jadwal');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data dari Database Aiven:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsFromDB();
  }, []);

  // 2. Handle Upload File Excel Data Mahasiswa Kelas Baru
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!namaKelasInput.trim()) {
      alert('Masukkan Nama Kelas terlebih dahulu sebelum upload!');
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
        nim: String(row.NIM || row.Nim || row.nim || `2461510${String(idx + 1).padStart(2, '0')}`),
        nama: row.Nama || row.NAMA || row.nama || `MAHASISWA ${idx + 1}`,
        idMeja: `STUDENT${String(idx + 1).padStart(2, '0')}`
      }));

      const newKelasObj = {
        id: Date.now().toString(),
        namaKelas: namaKelasInput,
        jurusan: 'TEKNIK INFORMATIKA',
        mahasiswa: parsedMhs
      };

      setKelolaKelas([...kelolaKelas, newKelasObj]);
      setSelectedKelasId(newKelasObj.id);
      setSelectedMhs(parsedMhs.map(m => m.id)); // Centang semua mhs secara default
      setNamaKelasInput('');
      alert(`Berhasil mengunggah ${parsedMhs.length} mahasiswa untuk kelas ${namaKelasInput}!`);
    };
    reader.readAsBinaryString(file);
  };

  const activeKelas = kelolaKelas.find(k => k.id === selectedKelasId);

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

  // 3. Kunci Sesi Ujian & Kirim ke Database Aiven
  const handleLockPlotting = async () => {
    if (!selectedKelasId || !activeKelas) {
      alert('Pilih kelas antrean terlebih dahulu!');
      return;
    }
    if (selectedMhs.length === 0) {
      alert('Pilih minimal 1 mahasiswa untuk dijadwalkan!');
      return;
    }

    const mhsTerpilih = activeKelas.mahasiswa.filter(m => selectedMhs.includes(m.id));

    const payload = {
      namaKelas: activeKelas.namaKelas,
      jurusan: activeKelas.jurusan,
      tanggal: tanggal,
      sesi: sesi,
      lab: lab,
      jenisTest: jenisTest,
      mahasiswa: mhsTerpilih
    };

    try {
      const response = await fetch('http://localhost:3000/api/jadwal/kunci-sesi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData.success) {
        alert(`BERHASIL! Jadwal kelas ${activeKelas.namaKelas} telah dikunci dan disimpan permanen di Database Aiven.`);
        
        // Hapus kelas yang sudah dikunci dari antrean sementara frontend
        setKelolaKelas(kelolaKelas.filter(k => k.id !== selectedKelasId));
        setSelectedKelasId('');
        setSelectedMhs([]);

        // Refresh tabel log langsung dari database Aiven
        fetchLogsFromDB();
      } else {
        alert(`Gagal mengunci jadwal: ${resData.error}`);
      }
    } catch (error) {
      alert('Gagal terhubung ke Server Backend (Port 3000). Pastikan server.js berjalan!');
    }
  };

  // 4. Cetak Berita Acara Pelaksanaan Ujian (PDF)
  const handleExportPDF = (logItem) => {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.text('POLITEKNIK NEGERI SAMARINDA', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('BERITA ACARA PELAKSANAAN UJIAN UPA BAHASA', 105, 22, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(14, 26, 196, 26);

    doc.setFontSize(10);
    doc.text(`Nama Kelas   : ${logItem.namaKelas || '-'}`, 14, 34);
    doc.text(`Jenis Ujian  : ${logItem.jenisTes}`, 14, 40);
    doc.text(`Lokasi Lab   : ${logItem.lab}`, 14, 46);
    doc.text(`Sesi Ujian   : ${logItem.sesi}`, 14, 52);
    doc.text(`Tanggal      : ${String(logItem.tanggal).split('T')[0]}`, 14, 58);

    const tableRows = logItem.pesertaJadwal ? logItem.pesertaJadwal.map((p, idx) => [
      idx + 1,
      p.idMeja || `STUDENT${String(idx + 1).padStart(2, '0')}`,
      p.nim,
      p.mahasiswa ? p.mahasiswa.nama : '-',
      'Hadir / [  ]'
    ]) : [];

    doc.autoTable({
      startY: 64,
      head: [['No', 'ID Meja', 'NIM', 'Nama Mahasiswa', 'Tanda Tangan']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 136, 229] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text('Pengawas Ruang Ujian,', 140, finalY);
    doc.text('( ____________________ )', 140, finalY + 20);

    doc.save(`Berita_Acara_${logItem.namaKelas || 'Ujian'}_${logItem.jenisTes}.pdf`);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Modul 1: Penjadwalan & Penguncian Sesi Ujian (Connected to Database Aiven)">
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload data master kelas baru, atur lokasi lab dan jam sesi ujian, lalu kunci plotting. Data penjadwalan akan <b>tersimpan permanen di Database Aiven</b>.
          </Alert>

          {/* UPLOAD MASTER DATA KELAS */}
          <Paper elevation={2} sx={{ p: 2.5, mb: 4, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>1. Upload Master Data Kelas Baru</Typography>
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

          {/* SETTING SESI & PLOTTING */}
          {kelolaKelas.length > 0 && (
            <Paper elevation={2} sx={{ p: 2.5, mb: 4, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>2. Pengaturan Sesi & Centang Mahasiswa Terjadwal</Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Pilih Antrean Kelas</InputLabel>
                    <Select value={selectedKelasId} label="Pilih Antrean Kelas" onChange={(e) => setSelectedKelasId(e.target.value)}>
                      {kelolaKelas.map(k => (
                        <MenuItem key={k.id} value={k.id}>{k.namaKelas} ({k.mahasiswa.length} Mhs)</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type="date" size="small" label="Tanggal Ujian" value={tanggal} onChange={(e) => setTanggal(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sesi & Jam Ujian</InputLabel>
                    <Select value={sesi} label="Sesi & Jam Ujian" onChange={(e) => setSesi(e.target.value)}>
                      <MenuItem value="Sesi 1 (Pagi) | 08.00 - 10.00 WITA">Sesi 1 (Pagi) | 08.00 - 10.00 WITA</MenuItem>
                      <MenuItem value="Sesi 2 (Siang) | 10.00 - 12.00 WITA">Sesi 2 (Siang) | 10.00 - 12.00 WITA</MenuItem>
                      <MenuItem value="Sesi 3 (Sore) | 14.00 - 16.00 WITA">Sesi 3 (Sore) | 14.00 - 16.00 WITA</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
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
                    size="large"
                    startIcon={<LockIcon />}
                    onClick={handleLockPlotting}
                    sx={{ px: 4, py: 1.2, fontWeight: 'bold' }}
                  >
                    🔒 KUNCI SESI UJIAN KE DATABASE AIVEN
                  </Button>
                </>
              )}
            </Paper>
          )}

          {/* TABEL LOG HISTORI RESMI DATABASE */}
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">📋 LOG HISTORI PENJADWALAN RESMI (DATABASE AIVEN)</Typography>
              <Button startIcon={<RefreshIcon />} size="small" onClick={fetchLogsFromDB}>Refresh DB</Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><b>No</b></TableCell>
                    <TableCell><b>Nama Kelas</b></TableCell>
                    <TableCell><b>Tanggal Ujian</b></TableCell>
                    <TableCell><b>Sesi & Jam</b></TableCell>
                    <TableCell><b>Laboratorium</b></TableCell>
                    <TableCell align="center"><b>Jumlah Peserta</b></TableCell>
                    <TableCell align="center"><b>Cetak Berita Acara</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {loading ? 'Memuat data dari database...' : 'Belum ada data penjadwalan dikunci di database Aiven.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell><b>{log.namaKelas || 'Kelas UPA'}</b></TableCell>
                        <TableCell>{String(log.tanggal).split('T')[0]}</TableCell>
                        <TableCell>{log.sesi}</TableCell>
                        <TableCell><Chip label={log.lab} color="primary" size="small" variant="outlined" /></TableCell>
                        <TableCell align="center"><b>{log.pesertaJadwal ? log.pesertaJadwal.length : 0} Mhs</b></TableCell>
                        <TableCell align="center">
                          <Button 
                            variant="outlined" 
                            color="secondary" 
                            size="small"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => handleExportPDF(log)}
                          >
                            PDF Berita Acara
                          </Button>
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