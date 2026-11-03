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

export default function UploadHasilTestSSPECT() {
  const [lab, setLab] = useState('Lab A');
  const [sesi, setSesi] = useState('1');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileMeta, setFileMeta] = useState({ date: '', time: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isMatched, setIsMatched] = useState(false);
  const [processedDatabase, setProcessedDatabase] = useState([]);

  // Ekstrak tanggal & jam dari nama file (Mengabaikan penamaan format TOIEC/lainnya, fokus baca tanggal & jam)
  const extractMetadataFromName = (filename) => {
    const dateMatch = filename.match(/(\d{2}-\d{2}-\d{4})/);
    const timeMatch = filename.match(/(\d{2}-\d{2}-\d{2})/);
    return {
      date: dateMatch ? dateMatch[1] : '28-10-2026',
      time: timeMatch ? timeMatch[1].replace(/-/g, ':') : '09:00:00'
    };
  };

  const isTimeInSessionRange = (timeStr, selectedSesi) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (selectedSesi === '1' && (hour >= 8 && hour < 10)) return true;
    if (selectedSesi === '2' && (hour >= 10 && hour < 12)) return true;
    if (selectedSesi === '3' && (hour >= 13 && hour < 16)) return true;
    return false;
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const meta = extractMetadataFromName(file.name);
      
      if (!isTimeInSessionRange(meta.time, sesi)) {
        setErrorMessage(`Validasi Gagal! Jam pada file (${meta.time}) di luar rentang Sesi ${sesi} yang dipilih.`);
        return;
      }

      setUploadedFile(file);
      setFileMeta(meta);
      setErrorMessage('');
    }
  };

  const handleProcessMapping = () => {
    if (!uploadedFile) {
      setErrorMessage('Harap unggah file hasil test SSPECT terlebih dahulu!');
      return;
    }

    const keyCheck = `SSPECT-${lab}-Sesi${sesi}-${fileMeta.date}`;
    if (processedDatabase.includes(keyCheck)) {
      setErrorMessage(`PENGAMBILAN DITOLAK! Data SSPECT untuk ${lab} Sesi ${sesi} tanggal ${fileMeta.date} sudah pernah dicocokkan sebelumnya.`);
      return;
    }

    setErrorMessage('');
    setIsMatched(true);
    setProcessedDatabase([...processedDatabase, keyCheck]);
  };

  const [mappingData] = useState([
    { no: 1, nim: '210102045', nama: 'Lissa Anantha', skor: 480, status: 'LULUS' },
    { no: 2, nim: '210102046', nama: 'Ahmad Fauzi', skor: 390, status: 'REMEDIAL' }
  ]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
        Modul Upload Hasil Test - SSPECT
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Upload 1 file Excel bersih hasil kalkulasi SSPECT dengan validasi jam sesi otomatis.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Pilih Ruang Lab" value={lab} onChange={(e) => setLab(e.target.value)}>
                <MenuItem value="Lab A">Lab Komputer Bahasa A</MenuItem>
                <MenuItem value="Lab B">Lab Komputer Bahasa B</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Pilih Sesi Ujian" value={sesi} onChange={(e) => setSesi(e.target.value)}>
                <MenuItem value="1">Sesi 1 (08:00 - 10:00)</MenuItem>
                <MenuItem value="2">Sesi 2 (10:00 - 12:00)</MenuItem>
                <MenuItem value="3">Sesi 3 (13:00 - 15:00)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Upload File Excel SSPECT</Typography>
          {errorMessage && <Alert severity="error" icon={<IconAlertCircle />} sx={{ mb: 2 }}>{errorMessage}</Alert>}

          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            {uploadedFile ? (
              <Box>
                <Typography variant="body2">{uploadedFile.name}</Typography>
                <Chip label={`Tgl: ${fileMeta.date} | Jam: ${fileMeta.time}`} size="small" color="success" sx={{ my: 1 }} />
                <br />
                <IconButton color="error" onClick={() => setUploadedFile(null)}><IconTrash size={20} /></IconButton>
              </Box>
            ) : (
              <Button component="label" variant="outlined" startIcon={<IconUpload />} size="small">
                Pilih File Excel SSPECT
                <input type="file" hidden accept=".xlsx, .xls" onChange={handleUpload} />
              </Button>
            )}
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={handleProcessMapping}>Validasi & Proses Data</Button>
          </Box>
        </CardContent>
      </Card>

      {isMatched && (
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Hasil Mapping SSPECT</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Nama Mahasiswa</TableCell>
                    <TableCell align="center">Skor Total</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappingData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.no}</TableCell>
                      <TableCell>{row.nim}</TableCell>
                      <TableCell>{row.nama}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.skor}</TableCell>
                      <TableCell align="center"><Chip label={row.status} color="success" size="small" /></TableCell>
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