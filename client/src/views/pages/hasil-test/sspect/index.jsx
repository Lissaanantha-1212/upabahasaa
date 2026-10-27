import React, { useState } from 'react';
import { 
  Typography, Grid, Button, Paper, Box, Alert, 
  IconButton, Card, TextField, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MainCard from 'ui-component/cards/MainCard';

const HasilTestSSPECT = () => {
  const [fileLabA, setFileLabA] = useState(null);
  const [fileLabB, setFileLabB] = useState(null);
  const [hasilMapping, setHasilMapping] = useState([]);
  const [unboundMhs, setUnboundMhs] = useState([]);
  const [inputNimBind, setInputNimBind] = useState({});

  const handleUpload = (labType, file) => {
    if (!file) return;
    const data = { name: file.name, rawFile: file };
    if (labType === 'A') setFileLabA(data);
    else setFileLabB(data);
  };

  const handleProcessAutoMapping = () => {
    if (!fileLabA && !fileLabB) {
      alert('Upload minimal 1 file hasil tes SSPECT!');
      return;
    }

    // Simulasi Hasil Auto Mapping SSPECT
    const mockMappedData = Array.from({ length: 25 }, (_, i) => ({
      idMeja: `STUDENT${String(i + 1).padStart(2, '0')}`,
      nim: `2461510${String(i + 1).padStart(2, '0')}`,
      nama: `MAHASISWA TERJADWAL ${i + 1}`,
      score: Math.floor(Math.random() * (500 - 300 + 1)) + 300
    }));

    const mockUnbound = [
      { idMeja: 'STUDENT26', score: 450, nim: '', nama: '' }
    ];

    setHasilMapping(mockMappedData);
    setUnboundMhs(mockUnbound);
    alert('Auto Mapping SSPECT Berhasil!');
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
    alert(`Berhasil BINDing NIM ${nimInput}!`);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Modul Hasil Test: UPA BAHASA (SSPECT)">
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload 1 file hasil tes SSPECT per Lab. Sistem akan membaca data nilai dan mencocokkan secara otomatis ke jadwal terdaftar.
          </Alert>

          {/* UPLOAD AREA */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #1e88e5' }}>
                <Typography variant="h4" color="primary" sx={{ mb: 2 }}>📍 LAB KOMPUTER BAHASA A</Typography>
                <Card variant="outlined" sx={{ p: 2, bgcolor: fileLabA ? '#f0fdf4' : '#fff' }}>
                  {fileLabA ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>✓ {fileLabA.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => setFileLabA(null)}><DeleteIcon /></IconButton>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ borderStyle: 'dashed' }}>
                      Upload File SSPECT Lab A
                      <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => handleUpload('A', e.target.files[0])} />
                    </Button>
                  )}
                </Card>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #2e7d32' }}>
                <Typography variant="h4" color="success.main" sx={{ mb: 2 }}>📍 LAB KOMPUTER BAHASA B</Typography>
                <Card variant="outlined" sx={{ p: 2, bgcolor: fileLabB ? '#f0fdf4' : '#fff' }}>
                  {fileLabB ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>✓ {fileLabB.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => setFileLabB(null)}><DeleteIcon /></IconButton>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" color="success" fullWidth startIcon={<CloudUploadIcon />} sx={{ borderStyle: 'dashed' }}>
                      Upload File SSPECT Lab B
                      <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => handleUpload('B', e.target.files[0])} />
                    </Button>
                  )}
                </Card>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Button variant="contained" color="primary" size="large" onClick={handleProcessAutoMapping} sx={{ px: 4, py: 1.2, fontWeight: 'bold' }}>
              🔄 PROSES AUTO MAPPING SSPECT
            </Button>
          </Box>

          {/* UNBOUND STUDENT */}
          {unboundMhs.length > 0 && (
            <Paper elevation={3} sx={{ p: 2, mb: 4, bgcolor: '#fffde7', border: '1px solid #ffe082' }}>
              <Typography variant="h4" color="warning.dark" sx={{ mb: 1 }}>⚠️ UNBOUND STUDENT DETECTED</Typography>
              {unboundMhs.map((u) => (
                <Box key={u.idMeja} sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', p: 1.5, borderRadius: 1 }}>
                  <Chip label={`ID Meja: ${u.idMeja}`} color="warning" />
                  <Typography variant="body2">Nilai SSPECT: <b>{u.score}</b></Typography>
                  <TextField size="small" placeholder="Masukkan NIM Mhs..." value={inputNimBind[u.idMeja] || ''} onChange={(e) => setInputNimBind({ ...inputNimBind, [u.idMeja]: e.target.value })} sx={{ width: 200, ml: 'auto' }} />
                  <Button variant="contained" color="warning" size="small" onClick={() => handleBindNim(u.idMeja)}>BIND NIM</Button>
                </Box>
              ))}
            </Paper>
          )}

          {/* REKAP TABEL */}
          {hasilMapping.length > 0 && (
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>📊 REKAP HASIL AUTO MAPPING SSPECT</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><b>ID Meja</b></TableCell>
                      <TableCell><b>NIM</b></TableCell>
                      <TableCell><b>Nama Mahasiswa</b></TableCell>
                      <TableCell align="center"><b>Score SSPECT</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hasilMapping.map((row) => (
                      <TableRow key={row.idMeja} hover>
                        <TableCell><Chip label={row.idMeja} size="small" variant="outlined" /></TableCell>
                        <TableCell>{row.nim}</TableCell>
                        <TableCell><b>{row.nama}</b></TableCell>
                        <TableCell align="center"><Chip label={row.score} color="primary" size="small" sx={{ fontWeight: 'bold' }} /></TableCell>
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

export default HasilTestSSPECT;