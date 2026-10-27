import React, { useState } from 'react';
import { 
  Typography, Grid, Button, Paper, Box, Alert, 
  IconButton, Chip, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MainCard from 'ui-component/cards/MainCard';
import * as XLSX from 'xlsx';

const HasilTestTOEFL = () => {
  // State Pengaturan Sesi oleh Staf
  const [lab, setLab] = useState('Lab Komputer Bahasa A');
  const [sesi, setSesi] = useState('Sesi 1 (Pagi) | 08.00 - 10.00 WITA');

  // State File Upload Section
  const [fileS1, setFileS1] = useState(null);
  const [fileS2, setFileS2] = useState(null);
  const [fileS3, setFileS3] = useState(null);
  
  // State Tanggal Otomatis
  const [extractedTanggal, setExtractedTanggal] = useState('');

  // State Hasil Mapping & Unbound Student
  const [hasilMapping, setHasilMapping] = useState([]);
  const [unboundMhs, setUnboundMhs] = useState([]);
  const [inputNimBind, setInputNimBind] = useState({});

  // 1. Fungsi Validasi Jam terhadap Sesi Pilihan Staf
  const validateJamDenganSesi = (timeString, selectedSesi) => {
    if (!timeString) return true;
    const hour = parseInt(timeString.split(':')[0], 10);

    if (selectedSesi.includes('Sesi 1') && (hour < 8 || hour >= 10)) {
      return { valid: false, expected: '08.00 - 10.00 (Sesi 1)' };
    }
    if (selectedSesi.includes('Sesi 2') && (hour < 10 || hour >= 14)) {
      return { valid: false, expected: '10.00 - 12.00 (Sesi 2)' };
    }
    if (selectedSesi.includes('Sesi 3') && (hour < 14 || hour >= 17)) {
      return { valid: false, expected: '14.00 - 16.00 (Sesi 3)' };
    }
    return { valid: true };
  };

  // 2. Ekstrak Tanggal & Jam dari File Excel (Sel D2 / Column 'Date')
  const parseExcelDateTime = (file, jsonData) => {
    let rawDateStr = '';
    
    if (jsonData && jsonData.length > 0) {
      const firstRow = jsonData[0];
      rawDateStr = firstRow.Date || firstRow.date || firstRow.DATE || '';
    }

    // Jika tidak ada di sel D2, coba cari di nama file (misal: "28-10-2026 08-29-23")
    if (!rawDateStr) {
      const matchName = file.name.match(/\d{4}-\d{2}-\d{2}/) || file.name.match(/\d{2}-\d{2}-\d{4}/);
      rawDateStr = matchName ? matchName[0] : '2026-10-28 08:29:23';
    }

    const parts = String(rawDateStr).split(' ');
    const tanggalOnly = parts[0].replace(/\//g, '-');
    const jamOnly = parts[1] || '08:29:23';

    return { tanggalOnly, jamOnly };
  };

  // 3. Handle Upload File Section
  const handleUpload = (sectionKey, setFileState, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const { tanggalOnly, jamOnly } = parseExcelDateTime(file, data);

      // Validasi Kesesuaian Jam File dengan Pilihan Sesi
      const checkSession = validateJamDenganSesi(jamOnly, sesi);
      if (!checkSession.valid) {
        alert(`GAGAL UPLOAD ${sectionKey}!\n\nJam pelaksanaan di file Excel (${jamOnly} WITA) TIDAK SESUAI dengan ${sesi}.\nWaktu yang diperbolehkan untuk pilihan ini adalah ${checkSession.expected}.`);
        return;
      }

      // Validasi Tanggal Antar Section
      if (sectionKey === 'S1') {
        setExtractedTanggal(tanggalOnly);
      } else if (extractedTanggal && tanggalOnly !== extractedTanggal) {
        alert(`PERINGATAN TANGGAL BERBEDA!\n\nTanggal file ${sectionKey} (${tanggalOnly}) berbeda dengan Section 1 (${extractedTanggal}). Harap periksa kembali file Anda.`);
        return;
      }

      setFileState({
        name: file.name,
        date: tanggalOnly,
        time: jamOnly,
        totalMhs: data.length,
        rawData: data
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = (sectionKey, setFileState) => {
    setFileState(null);
    if (sectionKey === 'S1') {
      setExtractedTanggal('');
    }
  };

  const handleProcessAutoMapping = () => {
    if (!fileS1 || !fileS2 || !fileS3) {
      alert('Harap lengkapi upload File S1, S2, dan S3 terlebih dahulu!');
      return;
    }

    const mockMappedData = Array.from({ length: 25 }, (_, i) => ({
      idMeja: `STUDENT${String(i + 1).padStart(2, '0')}`,
      nim: `2461510${String(i + 1).padStart(2, '0')}`,
      nama: `MAHASISWA TERJADWAL ${i + 1}`,
      sec1: Math.floor(Math.random() * (68 - 31 + 1)) + 31,
      sec2: Math.floor(Math.random() * (68 - 31 + 1)) + 31,
      sec3: Math.floor(Math.random() * (68 - 31 + 1)) + 31,
      totalScore: 480
    }));

    const mockUnbound = [
      { idMeja: 'STUDENT26', sec1: 52, sec2: 48, sec3: 50, totalScore: 500, nim: '', nama: '' }
    ];

    setHasilMapping(mockMappedData);
    setUnboundMhs(mockUnbound);
    alert(`Auto Mapping Berhasil!\n\nLokasi: ${lab}\nSesi: ${sesi}\nTanggal: ${extractedTanggal}`);
  };

  const handleBindNim = (idMeja) => {
    const nimInput = inputNimBind[idMeja];
    if (!nimInput) {
      alert('Masukkan NIM terlebih dahulu!');
      return;
    }

    const updatedUnbound = unboundMhs.filter(u => u.idMeja !== idMeja);
    const targetStudent = unboundMhs.find(u => u.idMeja === idMeja);

    setUnboundMhs(updatedUnbound);
    setHasilMapping([
      ...hasilMapping, 
      { ...targetStudent, nim: nimInput, nama: `MAHASISWA SUSULAN (${nimInput})` }
    ]);

    alert(`Berhasil BINDing NIM ${nimInput} ke ${idMeja}!`);
  };

  const renderUploadBox = (title, btnLabel, sectionKey, fileState, setFileState) => {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center', bgcolor: fileState ? '#f0fdf4' : '#fafafa', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#334155' }}>
          {title}
        </Typography>

        {fileState ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold', wordBreak: 'break-all', mb: 0.5 }}>
              ✓ {fileState.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip label={`Tgl: ${fileState.date} (${fileState.time})`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => handleDelete(sectionKey, setFileState)}
                title="Hapus File"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <>
            <Button
              variant="outlined"
              component="label"
              size="medium"
              fullWidth
              color="success"
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 'bold', 
                py: 0.8,
                bgcolor: '#fff' 
              }}
            >
              {btnLabel}
              <input 
                type="file" 
                hidden 
                accept=".xlsx, .xls"
                onChange={(e) => handleUpload(sectionKey, setFileState, e.target.files[0])} 
              />
            </Button>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
              Belum Diunggah
            </Typography>
          </>
        )}
      </Paper>
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Modul Hasil Test: UPA BAHASA (TOEFL PREDICTION)">
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Pilih Lokasi Lab dan Sesi Ujian. Sistem akan <b>memvalidasi jam pelaksanaan file Excel</b> terhadap Sesi Ujian yang Anda pilih.
          </Alert>

          {/* PANEL FORM PENGATURAN LAB & SESI */}
          <Paper elevation={1} sx={{ p: 2.5, mb: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>1. Pengaturan Lokasi & Sesi Pelaksanaan Ujian</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lokasi Laboratorium</InputLabel>
                  <Select value={lab} label="Lokasi Laboratorium" onChange={(e) => setLab(e.target.value)}>
                    <MenuItem value="Lab Komputer Bahasa A">Lab Komputer Bahasa A</MenuItem>
                    <MenuItem value="Lab Komputer Bahasa B">Lab Komputer Bahasa B</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={5}>
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
                <Box sx={{ p: 1, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary" display="block">Tanggal File S1:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: extractedTanggal ? 'primary.main' : 'text.disabled' }}>
                    {extractedTanggal || 'Menunggu Upload...'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* PANEL 3 FORM INPUT UPLOAD SECTION */}
          <Paper elevation={1} sx={{ p: 2.5, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>2. Upload File Excel Hasil Ujian (3 Section)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                {renderUploadBox('1. Excel Section 1 / A01 (Listening)', 'Pilih File S1 (.xlsx)', 'S1', fileS1, setFileS1)}
              </Grid>
              <Grid item xs={12} md={4}>
                {renderUploadBox('2. Excel Section 2 / A02 (Structure)', 'Pilih File S2 (.xlsx)', 'S2', fileS2, setFileS2)}
              </Grid>
              <Grid item xs={12} md={4}>
                {renderUploadBox('3. Excel Section 3 / A03 (Reading)', 'Pilih File S3 (.xlsx)', 'S3', fileS3, setFileS3)}
              </Grid>
            </Grid>
          </Paper>

          {/* TOMBOL PROSES AUTO MAPPING */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleProcessAutoMapping}
              sx={{ px: 4, py: 1.2, fontWeight: 'bold', borderRadius: 2 }}
            >
              🔄 PROSES AUTO MAPPING NILAI DENGAN DATABASE JADWAL
            </Button>
          </Box>

          {/* ANTREAN UNBOUND STUDENT */}
          {unboundMhs.length > 0 && (
            <Paper elevation={3} sx={{ p: 2, mb: 4, bgcolor: '#fffde7', border: '1px solid #ffe082' }}>
              <Typography variant="h4" color="warning.dark" sx={{ mb: 1 }}>
                ⚠️ UNBOUND STUDENT DETECTED ({unboundMhs.length} Mahasiswa Susulan/Pindahan)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Ditemukan nilai komputer hasil tes yang ID Meja-nya tidak terdaftar pada antrean jadwal kelas sesi ini. Silakan bind dengan memasukkan NIM Mahasiswa.
              </Typography>

              {unboundMhs.map((u) => (
                <Box key={u.idMeja} sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', p: 1.5, borderRadius: 1, mb: 1 }}>
                  <Chip label={`ID Meja: ${u.idMeja}`} color="warning" />
                  <Typography variant="body2">
                    Nilai: Sec1({u.sec1}) | Sec2({u.sec2}) | Sec3({u.sec3}) | <b>Total: {u.totalScore}</b>
                  </Typography>
                  <TextField 
                    size="small" 
                    placeholder="Masukkan NIM Mhs..." 
                    value={inputNimBind[u.idMeja] || ''}
                    onChange={(e) => setInputNimBind({ ...inputNimBind, [u.idMeja]: e.target.value })}
                    sx={{ width: 200, ml: 'auto' }}
                  />
                  <Button 
                    variant="contained" 
                    color="warning" 
                    size="small"
                    onClick={() => handleBindNim(u.idMeja)}
                  >
                    BIND NIM
                  </Button>
                </Box>
              ))}
            </Paper>
          )}

          {/* TABEL HASIL MAPPING NILAI MAHASISWA */}
          {hasilMapping.length > 0 && (
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>
                📊 REKAP HASIL AUTO MAPPING NILAI TOEFL ({hasilMapping.length} Mahasiswa)
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><b>ID Meja</b></TableCell>
                      <TableCell><b>NIM</b></TableCell>
                      <TableCell><b>Nama Mahasiswa</b></TableCell>
                      <TableCell align="center"><b>Sec 1 (Listening)</b></TableCell>
                      <TableCell align="center"><b>Sec 2 (Structure)</b></TableCell>
                      <TableCell align="center"><b>Sec 3 (Reading)</b></TableCell>
                      <TableCell align="center"><b>Total Score</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hasilMapping.map((row) => (
                      <TableRow key={row.idMeja} hover>
                        <TableCell><Chip label={row.idMeja} size="small" variant="outlined" /></TableCell>
                        <TableCell>{row.nim}</TableCell>
                        <TableCell><b>{row.nama}</b></TableCell>
                        <TableCell align="center">{row.sec1}</TableCell>
                        <TableCell align="center">{row.sec2}</TableCell>
                        <TableCell align="center">{row.sec3}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={row.totalScore} 
                            color={row.totalScore >= 450 ? "success" : "error"} 
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

        </MainCard>
      </Grid>
    </Grid>
  );
};

export default HasilTestTOEFL;