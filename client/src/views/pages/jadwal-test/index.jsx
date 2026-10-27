import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Button, Paper, Box, Alert, 
  Checkbox, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField,
  Card, CardContent, Divider, Tooltip, IconButton, Stack, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions, Badge
} from '@mui/material';

// Material Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupIcon from '@mui/icons-material/Group';
import ComputerIcon from '@mui/icons-material/Computer';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import MainCard from 'ui-component/cards/MainCard';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// URL Endpoint Backend Express
const API_URL = 'http://localhost:3000/api/jadwal';

const JadwalTest = () => {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  // Input Form & Antrean Kelas
  const [namaKelasInput, setNamaKelasInput] = useState('');
  const [jurusanInput, setJurusanInput] = useState('TEKNIK INFORMATIKA');
  const [kelolaKelas, setKelolaKelas] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedMhs, setSelectedMhs] = useState([]);

  // Form Pengaturan Sesi & Lab
  const [tanggal, setTanggal] = useState('2026-10-28');
  const [sesi, setSesi] = useState('Sesi 1 (Pagi) | 08.00 - 10.00 WITA');
  const [lab, setLab] = useState('Lab Komputer Bahasa A');
  const [jenisTest, setJenisTest] = useState('TOEFL');
  const [pengawas, setPengawas] = useState('Staf UPA Bahasa POLNES');

  // Filter & Search Log Histori
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLab, setFilterLab] = useState('ALL');

  // Pop-up Dialog Preview Peserta
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Database Histori & Loading State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. FETCH LOG PENJADWALAN DARI DATABASE AIVEN
  // ---------------------------------------------------------------------------
  const fetchLogsFromDB = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/log-jadwal`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Gagal mengambil log dari DB Aiven:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsFromDB();
  }, []);

  // ---------------------------------------------------------------------------
  // 2. PARSING & UPLOAD MASTER DATA MAHASISWA (EXCEL)
  // ---------------------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!namaKelasInput.trim()) {
      alert('⚠️ Mohon isi "Nama Kelas Baru" terlebih dahulu sebelum mengunggah file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('⚠️ File Excel kosong atau format tidak sesuai!');
          return;
        }

        const parsedMhs = data.map((row, idx) => ({
          id: idx + 1,
          nim: String(row.NIM || row.Nim || row.nim || `2461510${String(idx + 1).padStart(2, '0')}`),
          nama: String(row.Nama || row.NAMA || row.nama || `MAHASISWA ${idx + 1}`).toUpperCase(),
          idMeja: `STUDENT${String(idx + 1).padStart(2, '0')}`,
          prodi: String(row.Prodi || row.PRODI || jurusanInput)
        }));

        const newKelasObj = {
          id: Date.now().toString(),
          namaKelas: namaKelasInput.toUpperCase(),
          jurusan: jurusanInput,
          mahasiswa: parsedMhs,
          totalCount: parsedMhs.length
        };

        setKelolaKelas((prev) => [...prev, newKelasObj]);
        setSelectedKelasId(newKelasObj.id);
        setSelectedMhs(parsedMhs.map(m => m.id)); // Auto check-all
        setNamaKelasInput('');
        alert(`✅ Berhasil mengimpor ${parsedMhs.length} data mahasiswa untuk kelas ${newKelasObj.namaKelas}!`);
      } catch (err) {
        alert('❌ Gagal membaca file Excel. Pastikan file berformat .xlsx atau .xls!');
      }
    };
    reader.readAsBinaryString(file);
  };

  const activeKelas = kelolaKelas.find(k => k.id === selectedKelasId);

  // ---------------------------------------------------------------------------
  // 3. LOGIKA CENTANG MAHASISWA & BATCH SELECTION
  // ---------------------------------------------------------------------------
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

  const handleHapusAntrean = (idKelas) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus antrean kelas ini?')) {
      setKelolaKelas(kelolaKelas.filter(k => k.id !== idKelas));
      if (selectedKelasId === idKelas) {
        setSelectedKelasId('');
        setSelectedMhs([]);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 4. PERSISTENSI KE DATABASE AIVEN (KUNCI SESI)
  // ---------------------------------------------------------------------------
  const handleLockPlotting = async () => {
    if (!selectedKelasId || !activeKelas) {
      alert('⚠️ Pilih kelas antrean terlebih dahulu!');
      return;
    }
    if (selectedMhs.length === 0) {
      alert('⚠️ Pilih minimal 1 mahasiswa untuk dijadwalkan!');
      return;
    }

    setIsSubmitting(true);
    const mhsTerpilih = activeKelas.mahasiswa.filter(m => selectedMhs.includes(m.id));

    const payload = {
      namaKelas: activeKelas.namaKelas,
      jurusan: activeKelas.jurusan,
      tanggal: tanggal,
      sesi: sesi,
      lab: lab,
      jenisTest: jenisTest,
      dibuatOleh: pengawas,
      mahasiswa: mhsTerpilih
    };

    try {
      const response = await fetch(`${API_URL}/kunci-sesi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData.success) {
        alert(`🎉 BERHASIL! Jadwal kelas ${activeKelas.namaKelas} telah dikunci dan tersimpan permanen di Database Aiven.`);
        
        // Hapus dari antrean lokal React
        setKelolaKelas(kelolaKelas.filter(k => k.id !== selectedKelasId));
        setSelectedKelasId('');
        setSelectedMhs([]);

        // Reload log dari database
        fetchLogsFromDB();
      } else {
        alert(`❌ GAGAL MENYIMPAN KE DATABASE: ${resData.error}`);
      }
    } catch (error) {
      alert('❌ Terjadi kesalahan jaringan! Pastikan backend `node server.js` di port 3000 aktif.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. CETAK BERITA ACARA PDF RESMI
  // ---------------------------------------------------------------------------
  const handleExportPDF = (logItem) => {
    const doc = new jsPDF();
    
    // Header Kop Surat
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('POLITEKNIK NEGERI SAMARINDA', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text('UNIT PELAKSANA AKADEMIK (UPA) BAHASA', 105, 21, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Jl. Cipto Mangunkusumo Kampus Gunung Lipan Samarinda 75131', 105, 26, { align: 'center' });
    doc.setLineWidth(0.8);
    doc.line(14, 29, 196, 29);

    // Judul Berita Acara
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('BERITA ACARA PELAKSANAAN UJIAN KOMPUTER', 105, 36, { align: 'center' });

    // Meta Informasi
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Nama Kelas   : ${logItem.namaKelas || 'Kelas UPA'}`, 14, 45);
    doc.text(`Jenis Ujian  : ${logItem.jenisTes}`, 14, 50);
    doc.text(`Laboratorium : ${logItem.lab}`, 14, 55);
    doc.text(`Sesi Ujian   : ${logItem.sesi}`, 110, 45);
    doc.text(`Tanggal      : ${String(logItem.tanggal).split('T')[0]}`, 110, 50);
    doc.text(`Jumlah Mhs   : ${logItem.pesertaJadwal ? logItem.pesertaJadwal.length : 0} Peserta`, 110, 55);

    // Tabel Mahasiswa
    const tableRows = logItem.pesertaJadwal ? logItem.pesertaJadwal.map((p, idx) => [
      idx + 1,
      p.idMeja || `STUDENT${String(idx + 1).padStart(2, '0')}`,
      p.nim,
      p.mahasiswa ? p.mahasiswa.nama : '-',
      p.mahasiswa ? p.mahasiswa.prodi : '-',
      '[   ] Hadir'
    ]) : [];

    doc.autoTable({
      startY: 61,
      head: [['No', 'ID Meja', 'NIM', 'Nama Mahasiswa', 'Program Studi', 'Kehadiran']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 136, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    // Tanda Tangan
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text('Mengetahui,', 20, finalY);
    doc.text('Kepala UPA Bahasa POLNES,', 20, finalY + 5);
    doc.text('( ______________________ )', 20, finalY + 25);

    doc.text('Samarinda, ' + String(logItem.tanggal).split('T')[0], 135, finalY);
    doc.text('Pengawas Ruang Ujian,', 135, finalY + 5);
    doc.text(`( ${logItem.dibuatOleh || pengawas} )`, 135, finalY + 25);

    doc.save(`Berita_Acara_${logItem.namaKelas || 'Ujian'}_${logItem.jenisTes}.pdf`);
  };

  // Filter Log Histori
  const filteredLogs = logs.filter((log) => {
    const matchSearch = (log.namaKelas || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (log.jenisTes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchLab = filterLab === 'ALL' || log.lab === filterLab;
    return matchSearch && matchLab;
  });

  // Hitung Total Statistik
  const totalMhsTerjadwal = logs.reduce((acc, curr) => acc + (curr.pesertaJadwal ? curr.pesertaJadwal.length : 0), 0);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Modul 1: Penjadwalan & Penguncian Sesi Ujian (Connected to Database Aiven)">
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Sistem terintegrasi langsung dengan <b>Database MySQL Aiven</b>. Seluruh data antrean kelas yang dikunci akan tersimpan secara permanen dan <b>tidak akan hilang saat browser di-refresh</b>.
          </Alert>

          {/* STATISTIC CARDS */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ bgcolor: '#e3f2fd', borderColor: '#90caf9' }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <EventAvailableIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Total Sesi Dikunci</Typography>
                      <Typography variant="h3" color="primary">{logs.length} Sesi</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ bgcolor: '#e8f5e9', borderColor: '#a5d6a7' }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <GroupIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Mahasiswa Terjadwal</Typography>
                      <Typography variant="h3" color="success.main">{totalMhsTerjadwal} Mhs</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ bgcolor: '#fff3e0', borderColor: '#ffe0b2' }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ComputerIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Antrean Kelas Sementara</Typography>
                      <Typography variant="h3" color="warning.dark">{kelolaKelas.length} Kelas</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* UPLOAD MASTER DATA KELAS BARU */}
          <Paper elevation={1} sx={{ p: 2.5, mb: 4, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1e293b' }}>
              1. Upload Master Data Kelas Baru (Excel)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  size="small" 
                  label="Nama Kelas Baru (Contoh: 5 TI B)" 
                  value={namaKelasInput}
                  onChange={(e) => setNamaKelasInput(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Jurusan / Kategori</InputLabel>
                  <Select value={jurusanInput} label="Jurusan / Kategori" onChange={(e) => setJurusanInput(e.target.value)}>
                    <MenuItem value="TEKNIK INFORMATIKA">TEKNIK INFORMATIKA</MenuItem>
                    <MenuItem value="TEKNIK ELEKTRO">TEKNIK ELEKTRO</MenuItem>
                    <MenuItem value="TEKNIK SIPIL">TEKNIK SIPIL</MenuItem>
                    <MenuItem value="AKUNTANSI">AKUNTANSI</MenuItem>
                    <MenuItem value="ADMINISTRASI NIAGA">ADMINISTRASI NIAGA</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  color="success"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ py: 1, fontWeight: 'bold', borderRadius: 1.5 }}
                >
                  Upload File Excel Mhs
                  <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* FORM PENGATURAN SESI & CENTANG PLOTTING */}
          {kelolaKelas.length > 0 && (
            <Paper elevation={2} sx={{ p: 2.5, mb: 4, borderRadius: 2, borderTop: '4px solid #1e88e5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  2. Pengaturan Sesi & Centang Mahasiswa Terjadwal
                </Typography>
                <Chip label={`${kelolaKelas.length} Kelas Menunggu Plotting`} color="warning" size="small" />
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Pilih Antrean Kelas</InputLabel>
                    <Select value={selectedKelasId} label="Pilih Antrean Kelas" onChange={(e) => setSelectedKelasId(e.target.value)}>
                      {kelolaKelas.map(k => (
                        <MenuItem key={k.id} value={k.id}>{k.namaKelas} ({k.totalCount} Mhs)</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
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
                    <InputLabel>Lokasi Lab Komputer</InputLabel>
                    <Select value={lab} label="Lokasi Lab Komputer" onChange={(e) => setLab(e.target.value)}>
                      <MenuItem value="Lab Komputer Bahasa A">Lab Komputer Bahasa A</MenuItem>
                      <MenuItem value="Lab Komputer Bahasa B">Lab Komputer Bahasa B</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {activeKelas && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Mahasiswa Terpilih: <b>{selectedMhs.length}</b> dari {activeKelas.mahasiswa.length} Mhs
                    </Typography>
                    <Button color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleHapusAntrean(activeKelas.id)}>
                      Batalkan Antrean Kelas Ini
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 350 }}>
                    <Table stickyHeader size="small">
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
                          <TableCell><b>Program Studi</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeKelas.mahasiswa.map((mhs) => (
                          <TableRow key={mhs.id} hover onClick={() => handleToggleMhs(mhs.id)} sx={{ cursor: 'pointer' }}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={selectedMhs.includes(mhs.id)} />
                            </TableCell>
                            <TableCell><Chip label={mhs.idMeja} size="small" variant="outlined" color="primary" /></TableCell>
                            <TableCell>{mhs.nim}</TableCell>
                            <TableCell><b>{mhs.nama}</b></TableCell>
                            <TableCell>{mhs.prodi}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ textAlign: 'right' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      disabled={isSubmitting}
                      startIcon={<LockIcon />}
                      onClick={handleLockPlotting}
                      sx={{ px: 4, py: 1.2, fontWeight: 'bold', borderRadius: 2 }}
                    >
                      {isSubmitting ? 'Memproses ke DB Aiven...' : '🔒 KUNCI SESI UJIAN KE DATABASE AIVEN'}
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          )}

          {/* LOG HISTORI PENJADWALAN RESMI */}
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                📋 LOG HISTORI PENJADWALAN SESI DIKUNCI (DATABASE RESMI)
              </Typography>
              <Button startIcon={<RefreshIcon />} size="small" variant="outlined" onClick={fetchLogsFromDB}>
                Refresh DB
              </Button>
            </Box>

            {/* BARIS SEARCH & FILTER */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Cari Nama Kelas atau Jenis Tes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter Laboratorium</InputLabel>
                  <Select value={filterLab} label="Filter Laboratorium" onChange={(e) => setFilterLab(e.target.value)}>
                    <MenuItem value="ALL">Semua Laboratorium</MenuItem>
                    <MenuItem value="Lab Komputer Bahasa A">Lab Komputer Bahasa A</MenuItem>
                    <MenuItem value="Lab Komputer Bahasa B">Lab Komputer Bahasa B</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* TABEL DATA LOG */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><b>No</b></TableCell>
                    <TableCell><b>Tanggal Ujian</b></TableCell>
                    <TableCell><b>Sesi & Jam</b></TableCell>
                    <TableCell><b>Ruang Lab</b></TableCell>
                    <TableCell><b>Nama Kelas / Kategori</b></TableCell>
                    <TableCell align="center"><b>Jumlah Peserta</b></TableCell>
                    <TableCell align="center"><b>Status DB</b></TableCell>
                    <TableCell align="center"><b>Aksi & PDF</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {loading ? 'Sedang memuat riwayat data dari MySQL Aiven...' : 'Belum ada data riwayat penjadwalan dikunci.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell><b>{String(log.tanggal).split('T')[0]}</b></TableCell>
                        <TableCell>{log.sesi}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.lab} 
                            color={log.lab.includes('Lab A') ? 'primary' : 'success'} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell><b>{log.namaKelas || log.jenisTes}</b></TableCell>
                        <TableCell align="center">
                          <Chip label={`${log.pesertaJadwal ? log.pesertaJadwal.length : 0} Mhs`} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            icon={<CheckCircleOutlineIcon fontSize="small" />} 
                            label="Tersimpan DB" 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Lihat Daftar Peserta">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => {
                                  setSelectedLogDetail(log);
                                  setOpenDetailDialog(true);
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Button 
                              variant="outlined" 
                              color="secondary" 
                              size="small"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => handleExportPDF(log)}
                            >
                              Berita Acara
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* DIALOG POP-UP DETAIL PESERTA LOG */}
          <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
            {selectedLogDetail && (
              <>
                <DialogTitle>
                  Detail Peserta Ujian: <b>{selectedLogDetail.namaKelas}</b> ({selectedLogDetail.lab})
                </DialogTitle>
                <DialogContent dividers>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Sesi: {selectedLogDetail.sesi} | Tanggal: {String(selectedLogDetail.tanggal).split('T')[0]}
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell><b>No</b></TableCell>
                          <TableCell><b>ID Meja</b></TableCell>
                          <TableCell><b>NIM</b></TableCell>
                          <TableCell><b>Nama Mahasiswa</b></TableCell>
                          <TableCell><b>Program Studi</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedLogDetail.pesertaJadwal && selectedLogDetail.pesertaJadwal.map((p, idx) => (
                          <TableRow key={p.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell><Chip label={p.idMeja || `STUDENT${String(idx + 1).padStart(2, '0')}`} size="small" variant="outlined" /></TableCell>
                            <TableCell>{p.nim}</TableCell>
                            <TableCell><b>{p.mahasiswa ? p.mahasiswa.nama : '-'}</b></TableCell>
                            <TableCell>{p.mahasiswa ? p.mahasiswa.prodi : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDetailDialog(false)}>Tutup</Button>
                  <Button 
                    variant="contained" 
                    startIcon={<PictureAsPdfIcon />} 
                    onClick={() => {
                      handleExportPDF(selectedLogDetail);
                      setOpenDetailDialog(false);
                    }}
                  >
                    Cetak Berita Acara PDF
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>

        </MainCard>
      </Grid>
    </Grid>
  );
};

export default JadwalTest;