import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  MenuItem, 
  TextField, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Alert,
  Chip 
} from '@mui/material';
import { IconUpload, IconTrash, IconCheck, IconAlertCircle } from '@tabler/icons-react';

export default function UploadHasilTestTOEFL() {
  const [lab, setLab] = useState('Lab A');
  const [sesi, setSesi] = useState('1');

  // State 3 File Section
  const [fileSection1, setFileSection1] = useState(null);
  const [fileSection2, setFileSection2] = useState(null);
  const [fileSection3, setFileSection3] = useState(null);

  // Metadata Tanggal & Jam yang diekstrak dari nama file
  const [metaSec1, setMetaSec1] = useState({ date: '', time: '' });
  const [metaSec2, setMetaSec2] = useState({ date: '', time: '' });
  const [metaSec3, setMetaSec3] = useState({ date: '', time: '' });

  const [errorMessage, setErrorMessage] = useState('');
  const [isMatched, setIsMatched] = useState(false);

  // Simulasi Database Penyimpanan Mapping yang sudah pernah diproses (untuk mencegah double mapping)
  const [processedDatabase, setProcessedDatabase] = useState([]);

  // Helper ekstrak Tanggal (DD-MM-YYYY) dan Jam (HH-MM-SS) dari nama file
  const extractMetadataFromName = (filename) => {
    const dateMatch = filename.match(/(\d{2}-\d{2}-\d{4})/);
    const timeMatch = filename.match(/(\d{2}-\d{2}-\d{2})/);
    return {
      date: dateMatch ? dateMatch[1] : null,
      time: timeMatch ? timeMatch[1].replace(/-/g, ':') : '08:30:00' // Default simulasi jam
    };
  };

  // Helper validasi rentang jam berdasarkan sesi pilihan
  const isTimeInSessionRange = (timeStr, selectedSesi) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (selectedSesi === '1' && (hour >= 8 && hour < 10)) return true;
    if (selectedSesi === '2' && (hour >= 10 && hour < 12)) return true;
    if (selectedSesi === '3' && (hour >= 13 && hour < 16)) return true;
    return false;
  };

  // Handler Upload Section 1
  const handleUpload1 = (e) => {
    const file = e.target.files[0];
    if (file) {
      const meta = extractMetadataFromName(file.name);
      
      // Validasi jam terhadap sesi yang dipilih
      if (!isTimeInSessionRange(meta.time, sesi)) {
        setErrorMessage(`Validasi Gagal! Jam pada file Section 1 (${meta.time}) di luar rentang Sesi ${sesi} yang dipilih.`);
        return;
      }

      setFileSection1(file);
      setMetaSec1(meta);
      setErrorMessage('');
    }
  };

  // Handler Upload Section 2 (Wajib sama tanggal dengan Section 1)
  const handleUpload2 = (e) => {
    const file = e.target.files[0];
    if (file) {
      const meta = extractMetadataFromName(file.name);
      
      if (metaSec1.date && meta.date !== metaSec1.date) {
        setErrorMessage(`Validasi Gagal! Tanggal Section 2 (${meta.date}) tidak cocok dengan Section 1 (${metaSec1.date}).`);
        return;
      }

      setFileSection2(file);
      setMetaSec2(meta);
      setErrorMessage('');
    }
  };

  // Handler Upload Section 3 (Wajib sama tanggal dengan Section 1)
  const handleUpload3 = (e) => {
    const file = e.target.files[0];
    if (file) {
      const meta = extractMetadataFromName(file.name);
      
      if (metaSec1.date && meta.date !== metaSec1.date) {
        setErrorMessage(`Validasi Gagal! Tanggal Section 3 (${meta.date}) tidak cocok dengan Section 1 (${metaSec1.date}).`);
        return;
      }

      setFileSection3(file);
      setMetaSec3(meta);
      setErrorMessage('');
    }
  };

  // Proses Auto Mapping dengan Pengecekan Double Mapping
  const handleProcessMapping = () => {
    if (!fileSection1 || !fileSection2 || !fileSection3) {
      setErrorMessage('Harap unggah ke-3 file Section (1, 2, dan 3) secara lengkap!');
      return;
    }

    // Cek apakah Lab dan Sesi ini sudah pernah dicocokkan sebelumnya (Double Mapping Check)
    const keyCheck = `${lab}-Sesi${sesi}-${metaSec1.date}`;
    if (processedDatabase.includes(keyCheck)) {
      setErrorMessage(`PENGAMBILAN DITOLAK! Data untuk ${lab} Sesi ${sesi} pada tanggal ${metaSec1.date} sudah pernah dicocokkan dan disimpan sebelumnya.`);
      return;
    }

    setErrorMessage('');
    setIsMatched(true);
    // Simpan ke database simulasi agar tidak bisa di-upload ulang
    setProcessedDatabase([...processedDatabase, keyCheck]);
  };

  // Data Simulasi Hasil Test (Dengan peserta ke-29 sebagai siswa susulan)
  const [mappingData, setMappingData] = useState([
    { no: 1, nim: '210102045', nama: 'Lissa Anantha', listening: 52, structure: 50, reading: 54, skor: 520, statusResmi: true },
    { no: 2, nim: '210102046', nama: 'Ahmad Fauzi', listening: 40, structure: 42, reading: 43, skor: 415, statusResmi: true },
    // Peserta Susulan / Pindahan (Data Excel lebih banyak dari jadwal awal)
    { no: 29, nim: '', nama: '-', listening: 48, structure: 45, reading: 50, skor: 476, statusResmi: false }
  ]);

  const handleNimChange = (index, newNim) => {
    const updated = [...mappingData];
    updated[index].nim = newNim;
    if (newNim === '210102099') {
      updated[index].nama = 'Budi Susulan (Pindahan)';
      updated[index].statusResmi = true;
    } else {
      updated[index].nama = newNim ? 'Mencari nama di database...' : '-';
    }
    setMappingData(updated);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
        Modul Auto Mapping & Upload Hasil Test - TOEFL
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Validasi ketat 3 file Section, pencegahan double mapping, dan penanganan siswa susulan.
      </Typography>

      {/* Pilihan Lab dan Sesi */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth size="small" label="Pilih Ruang Lab"
                value={lab} onChange={(e) => setLab(e.target.value)}
              >
                <MenuItem value="Lab A">Lab Komputer Bahasa A</MenuItem>
                <MenuItem value="Lab B">Lab Komputer Bahasa B</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth size="small" label="Pilih Sesi Ujian"
                value={sesi} onChange={(e) => setSesi(e.target.value)}
              >
                <MenuItem value="1">Sesi 1 (08:00 - 10:00)</MenuItem>
                <MenuItem value="2">Sesi 2 (10:00 - 12:00)</MenuItem>
                <MenuItem value="3">Sesi 3 (13:00 - 15:00)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Area Upload 3 File Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Upload 3 File Section TOEFL</Typography>
          
          {errorMessage && (
            <Alert severity="error" icon={<IconAlertCircle />} sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Section 1 */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Section 1 (Listening)</Typography>
                {fileSection1 ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" noWrap>{fileSection1.name}</Typography>
                    <Chip label={`Tgl: ${metaSec1.date}`} size="small" color="success" sx={{ my: 1 }} />
                    <IconButton color="error" onClick={() => { setFileSection1(null); setMetaSec1({date:'', time:''}); }}>
                      <IconTrash size={20} />
                    </IconButton>
                  </Box>
                ) : (
                  <Button component="label" variant="outlined" startIcon={<IconUpload />} size="small" sx={{ mt: 2 }}>
                    Upload Section 1
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleUpload1} />
                  </Button>
                )}
              </Paper>
            </Grid>

            {/* Section 2 */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Section 2 (Structure)</Typography>
                {fileSection2 ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" noWrap>{fileSection2.name}</Typography>
                    <Chip label={`Tgl: ${metaSec2.date}`} size="small" color="success" sx={{ my: 1 }} />
                    <IconButton color="error" onClick={() => { setFileSection2(null); setMetaSec2({date:'', time:''}); }}>
                      <IconTrash size={20} />
                    </IconButton>
                  </Box>
                ) : (
                  <Button component="label" variant="outlined" startIcon={<IconUpload />} size="small" sx={{ mt: 2 }}>
                    Upload Section 2
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleUpload2} />
                  </Button>
                )}
              </Paper>
            </Grid>

            {/* Section 3 */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Section 3 (Reading)</Typography>
                {fileSection3 ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" noWrap>{fileSection3.name}</Typography>
                    <Chip label={`Tgl: ${metaSec3.date}`} size="small" color="success" sx={{ my: 1 }} />
                    <IconButton color="error" onClick={() => { setFileSection3(null); setMetaSec3({date:'', time:''}); }}>
                      <IconTrash size={20} />
                    </IconButton>
                  </Box>
                ) : (
                  <Button component="label" variant="outlined" startIcon={<IconUpload />} size="small" sx={{ mt: 2 }}>
                    Upload Section 3
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleUpload3} />
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={handleProcessMapping}>
              Validasi & Proses Auto Mapping
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabel Hasil Mapping & Fitur Bind Siswa Susulan */}
      {isMatched && (
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Hasil Pencocokan Data Mahasiswa</Typography>
            <TableContainer component={Paper} elevation={1}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell>No Komputer</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Nama Mahasiswa</TableCell>
                    <TableCell align="center">Listening</TableCell>
                    <TableCell align="center">Structure</TableCell>
                    <TableCell align="center">Reading</TableCell>
                    <TableCell align="center">Skor Total</TableCell>
                    <TableCell align="center">Status Binding</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappingData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.no}</TableCell>
                      <TableCell>
                        {row.nim ? row.nim : (
                          <TextField
                            size="small" placeholder="Input NIM Susulan..."
                            onChange={(e) => handleNimChange(index, e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>{row.nama}</TableCell>
                      <TableCell align="center">{row.listening}</TableCell>
                      <TableCell align="center">{row.structure}</TableCell>
                      <TableCell align="center">{row.reading}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.skor}</TableCell>
                      <TableCell align="center">
                        {row.statusResmi ? (
                          <Chip label="Matched" color="success" size="small" icon={<IconCheck size={14} />} />
                        ) : (
                          <Chip label="Butuh Input NIM" color="warning" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}